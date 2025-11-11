import OpenAI from "openai";
import type { ConversationModel } from "../types/domain/conversationModel.type";

const SYSTEM_PROMPT = `You are an AI assistant that determines how long to wait before spontaneously reaching out to the user again.

Analyze the conversation and return ONLY a single number between 0 and 120, representing the number of minutes to wait before the next spontaneous message.

Guidelines:
- If the assistant should continue talking right away: 0 minutes
- If the conversation just started or is very engaging: 1-5 minutes
- If the conversation is casual and ongoing: 5-30 minutes
- If the user seems busy or the conversation is winding down: 30-60 minutes
- If the conversation ended naturally: 60-120 minutes
- If the last message was "{no-answer-from-user}": increase the delay significantly

Consider:
- The energy level of the conversation
- Whether the user is actively engaged
- Time of day patterns if visible
- The natural flow and cadence of the exchange

Return ONLY the number, nothing else.`;

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
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify(
          conversation.map((msg) => ({
            role: msg.role,
            text: msg.text,
            timestamp: msg.timestamp,
          })),
        ),
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      service_tier: "default",
      messages,
    });

    const delayText = response.choices[0]?.message?.content || "0.5";
    const delayMinutes = Math.max(
      0,
      Math.min(120, parseFloat(delayText) || 0.5),
    );

    return Response.json({
      delayMinutes,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    });
  } catch (error) {
    console.error("Error calculating spontaneous thinking delay:", error);
    return Response.json(
      {
        error: `Failed to calculate delay: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
