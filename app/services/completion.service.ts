import type { ConversationModel } from "../types/domain/conversationModel.type";
import type { SettingsModel } from "../types/domain/settingsModel.type";

let currentController: AbortController | null = null;
const thinkingListeners = new Set<(isThinking: boolean) => void>();

export const completionService = {
  async request(
    conversation: ConversationModel,
    language: SettingsModel["language"],
  ): Promise<string | null> {
    // Cancel any pending request
    if (currentController) {
      currentController.abort();
    }

    // Create new controller for this request
    currentController = new AbortController();
    const signal = currentController.signal;

    try {
      // Emit thinking started event
      thinkingListeners.forEach((listener) => listener(true));

      const response = await fetch("/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation,
          language,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.completion || null;
    } catch (error) {
      // Don't log abort errors as they're expected
      if (error instanceof Error && error.name === "AbortError") {
        return null;
      }
      console.error("Error getting AI completion:", error);
      return null;
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
};
