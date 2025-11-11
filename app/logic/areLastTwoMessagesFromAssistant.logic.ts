import type { MessageModel } from "~/types/domain/messageModel.type";

export function areLastTwoMessagesFromAssistant(
  conversation: Array<MessageModel>,
): boolean {
  if (conversation.length < 2) {
    return false;
  }
  const lastTwoMessages = conversation.slice(-2);
  return lastTwoMessages.every((msg) => msg.role === "assistant");
}
