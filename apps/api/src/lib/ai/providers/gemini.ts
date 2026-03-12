import { env } from "../../../config/env";
import { AiProvider, GenerateTextInput } from "../types";

export const geminiProvider: AiProvider = {
  name: "gemini",
  async generateText(input: GenerateTextInput) {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: input.systemPrompt
            ? {
                parts: [{ text: input.systemPrompt }]
              }
            : undefined,
          contents: [
            {
              role: "user",
              parts: [{ text: input.userPrompt }]
            }
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.8,
            maxOutputTokens: input.maxOutputTokens ?? 700
          }
        })
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        `Gemini request failed: ${response.status} ${JSON.stringify(payload)}`
      );
    }

    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((item: { text?: string }) => item.text ?? "")
        ?.join("\n") ?? "";

    return {
      provider: "gemini",
      model: input.model,
      text,
      rawResponse: payload
    };
  }
};
