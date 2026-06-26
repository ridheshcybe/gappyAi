// backend/lib/openrouter.js
// Shared utility for calling OpenRouter via the OpenAI SDK

import OpenAI from "openai";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  _client = new OpenAI({
    baseURL: OPENROUTER_BASE,
    apiKey,
  });
  return _client;
}

/**
 * Send a chat completion request via OpenRouter.
 *
 * @param {object} options
 * @param {string} options.model   - OpenRouter model slug (e.g. "openai/gpt-4o-mini")
 * @param {Array<{role:string,content:string}>} options.messages
 * @param {number}  [options.temperature]
 * @param {number}  [options.maxTokens]
 * @param {object}  [options.responseFormat]
 * @returns {Promise<{content:string}>}
 */
export async function chatCompletion({
  model = "openai/gpt-4o-mini",
  messages,
  temperature,
  maxTokens,
  responseFormat,
} = {}) {
  const client = getClient();
  if (!client) {
    throw new Error(
      "OPENROUTER_API_KEY is not set — cannot call LLM."
    );
  }

  const body = {
    model,
    messages,
    ...(temperature != null ? { temperature } : {}),
    ...(maxTokens != null ? { max_tokens: maxTokens } : {}),
    ...(responseFormat ? { response_format: responseFormat } : {}),
  };

  const response = await client.chat.completions.create(body);
  const content = response.choices[0]?.message?.content || "";
  return { content };
}

/**
 * Check whether the OpenRouter client is configured.
 */
export function isConfigured() {
  return !!process.env.OPENROUTER_API_KEY;
}
