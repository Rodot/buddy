import OpenAI from "openai";
import type { ConversationModel } from "../types/domain/conversationModel.type";
import type { Language } from "../consts/i18n.const";
import { LANGUAGES } from "../consts/i18n.const";
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
    const {
      conversation,
      language,
      dateTime,
    }: {
      conversation: ConversationModel;
      language: Language;
      dateTime: string;
    } = await request.json();

    const openai = new OpenAI({ apiKey });

    const languageName =
      LANGUAGES.find((lang) => lang.code === language)?.name.split(" ")[1] ||
      "English";

    const dateTimeInstruction = `\n\n# Date and Time\nCurrent date and time: ${dateTime}`;
    const languageInstruction = `\n\n# Language\nYou MUST respond in ${languageName}.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          systemPromptDefault + dateTimeInstruction + languageInstruction,
      },
      ...conversation.map((msg) => ({
        role: msg.role,
        content: msg.text,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      service_tier: "priority",
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
