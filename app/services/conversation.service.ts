import type { ConversationModel } from "../types/domain/conversationModel.type";
import type { MessageModel } from "../types/domain/messageModel.type";

const CONVERSATION_KEY = "buddy:conversation";

export const conversationService = {
  get(): ConversationModel {
    try {
      const stored = localStorage.getItem(CONVERSATION_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored) as ConversationModel;
    } catch (error) {
      console.error("Failed to load conversation from localStorage:", error);
      return [];
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
    } catch (error) {
      console.error("Failed to save conversation to localStorage:", error);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(CONVERSATION_KEY);
    } catch (error) {
      console.error("Failed to clear conversation from localStorage:", error);
    }
  },
};
