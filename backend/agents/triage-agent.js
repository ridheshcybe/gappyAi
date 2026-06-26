// backend/agents/triage-agent.js
import { chatCompletion, isConfigured } from '../lib/openrouter.js';
import fs from "fs";
import path from "path";

const promptPath = path.join(
  process.cwd(),
  "prompts",
  "triage-system-prompt.txt"
);

let systemPrompt = `You are an incident triage AI. Analyze alerts and return structured JSON with: severity, affectedComponent, errorCategory, headline, rootCauseInferred, userImpactDescription, confidenceScore`;

try {
  systemPrompt = fs.readFileSync(
    promptPath,
    "utf8"
  );
} catch (err) {
  console.warn("⚠️ Triage prompt file not found, using default");
}

class TriageAgent {
  _generateMockResponse(rawAlert) {
    // Generate a reasonable mock triage result based on the alert text
    const text = typeof rawAlert === 'string' ? rawAlert : JSON.stringify(rawAlert);
    const lower = text.toLowerCase();

    let severity = 'P2_MEDIUM';
    let component = 'Unknown';
    let category = 'GenericError';
    let headline = 'Alert detected';
    let rootCause = 'Pending investigation';
    let impact = 'Service may be affected';
    let confidence = 75;

    if (lower.includes('critical') || lower.includes('down') || lower.includes('outage') || lower.includes('p0')) {
      severity = 'P0_CRITICAL';
      confidence = 90;
    } else if (lower.includes('high') || lower.includes('error') || lower.includes('failure') || lower.includes('p1')) {
      severity = 'P1_HIGH';
      confidence = 85;
    } else if (lower.includes('medium') || lower.includes('warning') || lower.includes('p2')) {
      severity = 'P2_MEDIUM';
      confidence = 75;
    } else if (lower.includes('low') || lower.includes('info') || lower.includes('p3')) {
      severity = 'P3_LOW';
      confidence = 65;
    }

    if (lower.includes('gateway') || lower.includes('api')) {
      component = 'API Gateway';
      category = 'GatewayError';
    } else if (lower.includes('database') || lower.includes('db') || lower.includes('postgres') || lower.includes('sql')) {
      component = 'Database';
      category = 'DatabaseConnectionError';
    } else if (lower.includes('auth') || lower.includes('login') || lower.includes('token')) {
      component = 'Authentication Service';
      category = 'Unauthorized';
    } else if (lower.includes('payment') || lower.includes('stripe') || lower.includes('checkout')) {
      component = 'Payment Processing';
      category = 'Timeout';
    } else if (lower.includes('redis') || lower.includes('cache')) {
      component = 'Cache';
      category = 'Timeout';
    } else if (lower.includes('frontend') || lower.includes('ui') || lower.includes('deploy')) {
      component = 'Frontend';
      category = 'InternalError';
    }

    if (lower.includes('timeout') || lower.includes('exhaust')) {
      rootCause = 'Resource exhaustion or timeout';
      impact = 'Requests are failing or timing out';
    } else if (lower.includes('connection') || lower.includes('unavailable')) {
      rootCause = 'Service dependency unavailable';
      impact = 'Service cannot reach its dependencies';
    } else if (lower.includes('memory') || lower.includes('oom')) {
      rootCause = 'Out of memory condition';
      impact = 'Process may be killed by OOM killer';
    }

    return {
      severity,
      affectedComponent: component,
      errorCategory: category,
      headline,
      rootCauseInferred: rootCause,
      userImpactDescription: impact,
      confidenceScore: confidence,
    };
  }

  async triage(rawAlert) {
    if (!isConfigured()) {
      const mockResult = this._generateMockResponse(rawAlert);
      return { content: JSON.stringify(mockResult) };
    }

    const response = await chatCompletion({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Triage this alert: ${JSON.stringify(rawAlert)}` }
      ],
      temperature: 0.1,
      maxTokens: 1200,
      responseFormat: { type: "json_object" },
    });

    return response;
  }

  async run({ input, context = {} }) {
    const response = await this.triage(input);
    return { text: response.content || JSON.stringify(response) };
  }
}

export default new TriageAgent();
