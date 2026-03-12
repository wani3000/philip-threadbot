import { env } from "../../../config/env";
import { AiProvider, GenerateTextInput } from "../types";

export const openAiProvider: AiProvider = {
  name: "openai",
  async generateText(input: GenerateTextInput) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature ?? 0.8,
        max_output_tokens: input.maxOutputTokens ?? 700,
        input: [
          input.systemPrompt
            ? {
                role: "system",
                content: [{ type: "input_text", text: input.systemPrompt }]
              }
            : null,
          {
            role: "user",
            content: [{ type: "input_text", text: input.userPrompt }]
          }
        ].filter(Boolean)
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        `OpenAI request failed: ${response.status} ${JSON.stringify(payload)}`
      );
    }

    const text =
      payload.output_text ??
      payload.output
        ?.flatMap((item: { content?: Array<{ text?: string }> }) =>
          item.content ?? []
        )
        ?.map((item: { text?: string }) => item.text ?? "")
        ?.join("\n") ??
      "";

    return {
      provider: "openai",
      model: input.model,
      text,
      rawResponse: payload
    };
  }
};

