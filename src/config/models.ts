import OpenAI from "openai";

// Create OpenAI-compatible client for Groq
export const llmClient = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: process.env.GROK_API_URL || "https://api.groq.com/openai/v1",
});

export const modelConfig = {
  provider: llmClient,
  model: process.env.GROK_MODEL || "llama-3.1-70b-versatile",
  temperature: 0.3,
};