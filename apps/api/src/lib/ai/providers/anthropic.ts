import { env } from "../../../config/env";
import { AiProvider, GenerateTextInput } from "../types";

export const anthropicProvider: AiProvider = {
  name: "anthropic",
  async generateText(input: GenerateTextInput) {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxOutputTokens ?? 700,
        temperature: input.temperature ?? 0.8,
        system: input.systemPrompt,
        messages: [
          {
            role: "user",
            content: input.userPrompt
          }
        ]
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        `Anthropic request failed: ${response.status} ${JSON.stringify(payload)}`
      );
    }

    const text =
      Array.isArray(payload.content)
        ? payload.content
            .filter((item: { type?: string }) => item.type === "text")
            .map((item: { text?: string }) => item.text ?? "")
            .join("\n")
        : "";

    return {
      provider: "anthropic",
      model: input.model,
      text,
      rawResponse: payload
    };
  }
};

