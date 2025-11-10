export function areLastThreeMessagesFromAssistant(
  conversation: Array<{ role: string }>,
): boolean {
  if (conversation.length < 3) {
    return false;
  }
  const lastThreeMessages = conversation.slice(-3);
  return lastThreeMessages.every((msg) => msg.role === "assistant");
}
