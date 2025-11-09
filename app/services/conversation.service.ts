import type { ConversationModel } from "../types/domain/conversationModel.type";
import type { MessageModel } from "../types/domain/messageModel.type";
import { conversationDefault } from "../defaults/conversation.default";

const CONVERSATION_KEY = "buddy:conversation";

export const conversationService = {
  answerListeners: new Set<(message: MessageModel) => void>(),

  get(): ConversationModel {
    try {
      const stored = localStorage.getItem(CONVERSATION_KEY);
      if (!stored) {
        return conversationDefault;
      }
      return JSON.parse(stored) as ConversationModel;
    } catch (error) {
      console.error("Failed to load conversation from localStorage:", error);
      return conversationDefault;
    }
  },

  addMessage(message: Omit<MessageModel, "id" | "timestamp">): void {
    const currentConversation = this.get();
    const newMessage: MessageModel = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const updatedConversation = [...currentConversation, newMessage];

    try {
      localStorage.setItem(
        CONVERSATION_KEY,
        JSON.stringify(updatedConversation),
      );
      // Notify all listeners when a new assistant message is added
      if (newMessage.role === "assistant") {
        this.answerListeners.forEach((listener) => listener(newMessage));
      }
    } catch (error) {
      console.error("Failed to save conversation to localStorage:", error);
    }
  },

  onNewAnswer(callback: (message: MessageModel) => void): () => void {
    this.answerListeners.add(callback);
    return () => {
      this.answerListeners.delete(callback);
    };
  },
};
