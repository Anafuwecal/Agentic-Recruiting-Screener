import { openai } from "@voltagent/core";

// Use Groq-compatible OpenAI client
export const groqModel = openai("llama-3.1-70b-versatile", {
  apiKey: process.env.GROK_API_KEY!,
  baseURL: process.env.GROK_API_URL || "https://api.groq.com/openai/v1",
});