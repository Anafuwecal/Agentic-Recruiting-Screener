import { VoltAgent, Agent } from "@voltagent/core";
import { groq } from "@ai-sdk/groq"; // Import the Groq provider

const llmClient = new groq({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: process.env.GROK_API_URL || "https://api.groq.com/openai/v1",
});

interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
}

export class CustomAgent {
  private name: string;
  private instructions: string;
  private tools: Tool[];
  private model: string;
  private temperature: number;

  constructor(config: {
    name: string;
    instructions: string;
    tools?: Tool[];
    model?: string;
    temperature?: number;
  }) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.tools = config.tools || [];
    this.model = config.model || "llama-3.1-70b-versatile";
    this.temperature = config.temperature || 0.3;
  }

  async execute({ input }: { input: string }): Promise<string> {
    try {
      const messages: any[] = [
        { role: "system", content: this.instructions },
        { role: "user", content: input },
      ];

      // Build completion params
      const completionParams: any = {
        model: this.model,
        messages,
        temperature: this.temperature,
      };

      // Add tools if available
      if (this.tools.length > 0) {
        completionParams.tools = this.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters, // Already in JSON Schema format
          },
        }));
        completionParams.tool_choice = "auto";
      }

      let response = await llmClient.chat.completions.create(completionParams);
      let assistantMessage = response.choices[0].message;

      // Handle tool calls
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        messages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const tool = this.tools.find((t) => t.name === toolCall.function.name);
          if (tool) {
            console.log(`🔧 ${this.name} calling tool: ${tool.name}`);
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.execute(args);

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          }
        }

        // Get final response after tool execution
        response = await llmClient.chat.completions.create({
          model: this.model,
          messages,
          temperature: this.temperature,
        });
        assistantMessage = response.choices[0].message;
      }

      return assistantMessage.content || "{}";
    } catch (error: any) {
      console.error(`❌ ${this.name} error:`, error.message);
      throw error;
    }
  }
}