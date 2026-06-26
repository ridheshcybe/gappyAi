// backend/agents/copilot-agent.js
import { chatCompletion, isConfigured } from '../lib/openrouter.js';
import copilotContext from '../services/copilot-context.js';
import incidentStore from '../stores/datastore.js';
import remediationService from '../services/remediation-service.js';

const SYSTEM_PROMPT = `You are the SecureOps Incident Copilot — an AI assistant embedded in an incident response dashboard.

You help engineers resolve incidents. You have access to tools to actually execute commands.
When a user asks you to fix, restart, scale, or resolve something, you MUST respond with a JSON tool call.
If you are just answering a question, respond with normal markdown text.

Available Tools:
1. restart_service: Restarts a service. Args: service (string)
2. scale_up: Scales up a service. Args: service (string)
3. clear_cache: Clears Redis cache. No args.
4. resolve_incident: Marks incident resolved. Args: note (string)

If using a tool, respond ONLY with this JSON format:
{"tool_call": true, "tool": "tool_name", "args": {"key": "value"}}

Rules:
- Be concise. Use markdown.
- Never fabricate telemetry data.
- If an action is risky, ask for confirmation first (e.g., "Are you sure you want me to restart the DB?").`;

class CopilotAgent {
  async _chat(messages) {
    if (!isConfigured()) {
      return {
        content: "I'm running in development mode without an AI backend. Please set `OPENROUTER_API_KEY` to enable the copilot. In the meantime, here's what I can tell you:\n\n- Check the incident classification and runbook details above\n- Review the timeline for key events\n- The remediation steps are listed in the runbook section"
      };
    }

    const response = await chatCompletion({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.2,
      maxTokens: 1024,
    });

    return response;
  }

  async chat({ incidentId, message, conversation = [] }) {
    const ctx = await copilotContext.build(incidentId);
    const contextBlock = copilotContext.formatForLLM(ctx);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `CURRENT CONTEXT:\n${contextBlock}` },
      ...conversation.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await this._chat(messages);
    const content = response.content;

    // Check if AI decided to use a tool
    const toolMatch = content.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);

    if (toolMatch) {
      try {
        const toolData = JSON.parse(toolMatch[0]);

        if (toolData.tool_call) {
          const result = await remediationService.executeAction(
            incidentId,
            toolData.tool,
            toolData.args || {}
          );

          const followUpMessages = [
            ...messages,
            { role: 'assistant', content: content },
            { role: 'system', content: `Tool Execution Result: ${result.log}` }
          ];

          const finalResponse = await this._chat(followUpMessages);

          await this.persistConversation(incidentId, message, finalResponse.content);
          return {
            reply: finalResponse.content,
            actionTaken: toolData.tool,
            contextUsed: { incidentId, historyMatches: ctx.history.count || 0 }
          };
        }
      } catch (e) {
        console.error("Tool parsing failed", e);
      }
    }

    await this.persistConversation(incidentId, message, content);
    return {
      reply: content,
      contextUsed: { incidentId, historyMatches: ctx.history.count || 0 }
    };
  }

  async persistConversation(incidentId, userMsg, aiReply) {
    const key = `chat:${incidentId}`;
    const existing = await incidentStore.fetch(key) || { incidentId, messages: [] };
    existing.messages.push(
      { role: 'user', content: userMsg, ts: Date.now() },
      { role: 'assistant', content: aiReply, ts: Date.now() }
    );
    await incidentStore.save(key, existing);
  }

  async getConversation(incidentId) {
    const conv = await incidentStore.fetch(`chat:${incidentId}`);
    return conv?.messages || [];
  }
}

export default new CopilotAgent();
