import type { ConversationModel } from "../types/domain/conversationModel.type";

const tokenUsageListeners = new Set<
  (usage: { inputTokens: number; outputTokens: number }) => void
>();

export const spontaneousThinkingDelayService = {
  async calculate(conversation: ConversationModel): Promise<number> {
    try {
      const response = await fetch("/api/spontaneous-thinking-delay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Emit token usage event
      if (data.usage) {
        tokenUsageListeners.forEach((listener) => listener(data.usage));
      }

      const delayMinutes = data.delayMinutes || 0;
      console.log(`[spontaneous thinking delay] ${delayMinutes} min`);

      return delayMinutes;
    } catch (error) {
      console.error("Error calculating spontaneous thinking delay:", error);
      // Default to 0.5 minutes (30 seconds) on error
      return 0.5;
    }
  },

  onTokenUsage(
    callback: (usage: { inputTokens: number; outputTokens: number }) => void,
  ): () => void {
    tokenUsageListeners.add(callback);
    return () => {
      tokenUsageListeners.delete(callback);
    };
  },
};
