import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

// Ensure an API key is available before boot
const apiKey = process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn(" Warning: Missing GROK_API_KEY / OPENAI_API_KEY. Ensure your .env configuration is set.");
}

export const aiModelClient = new ChatOpenAI({
  openAIApiKey: apiKey,
  configuration: {
    baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
  },
  modelName: process.env.LLM_MODEL_NAME || "gpt-4o-mini", // Easily swappable to grok-beta or llama-3
  temperature: 0.1, // Set low temperature to enforce strict structural accuracy
});