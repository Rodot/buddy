import OpenAI from "openai";
import type { ConversationModel } from "../types/domain/conversationModel.type";
import { systemPromptDefault } from "../defaults/systemPrompt.default";

export async function action({ request }: { request: Request }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set");
    return Response.json(
      { error: "Server configuration error: Missing OPENAI_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const { conversation }: { conversation: ConversationModel } =
      await request.json();

    const openai = new OpenAI({ apiKey });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPromptDefault,
      },
      ...conversation.map((msg) => ({
        role: msg.role,
        content: msg.text,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
    });

    const completionText = response.choices[0]?.message?.content || "";

    return Response.json({ completion: completionText });
  } catch (error) {
    console.error("Error getting AI completion:", error);
    return Response.json(
      {
        error: `Failed to get AI completion: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
