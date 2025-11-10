import type { ConversationModel } from "../types/domain/conversationModel.type";
import type { Language } from "../consts/i18n.const";

const thinkingListeners = new Set<(isThinking: boolean) => void>();
let abortController: AbortController | null = null;

export const completionService = {
  async request(
    conversation: ConversationModel,
    language: Language,
  ): Promise<string | null> {
    try {
      // Cancel previous request if it exists
      if (abortController) {
        abortController.abort();
      }

      // Create new AbortController for this request
      abortController = new AbortController();

      // Emit thinking started event
      thinkingListeners.forEach((listener) => listener(true));

      // Get current locale date and time
      const now = new Date();
      const dateTime = now.toLocaleString();

      const response = await fetch("/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation,
          language,
          dateTime,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.completion || null;
    } catch (error) {
      // Log non-abort errors
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Error getting AI completion:", error);
      }
      // Re-throw to let the caller handle it
      throw error;
    } finally {
      // Emit thinking stopped event
      thinkingListeners.forEach((listener) => listener(false));
    }
  },

  onThinkingChange(callback: (isThinking: boolean) => void): () => void {
    thinkingListeners.add(callback);
    return () => {
      thinkingListeners.delete(callback);
    };
  },

  abort(): void {
    if (abortController) {
      abortController.abort();
    }
  },
};
