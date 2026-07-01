import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();


const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1";
const modelName = process.env.LLM_MODEL_NAME || "openai/gpt-oss-120b";

if (!apiKey) {
  console.warn(" Warning: Missing API Key ");
}

export const aiModelClient = new ChatOpenAI({
  apiKey: apiKey,
  configuration: {
    baseURL: baseURL,
  },
  modelName: modelName,
  temperature: 0.1,
});