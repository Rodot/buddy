import { describe, it, expect } from "vitest";
import { areLastTwoMessagesFromAssistant } from "./areLastTwoMessagesFromAssistant.logic";
import type { MessageModel } from "~/types/domain/messageModel.type";

describe("areLastTwoMessagesFromAssistant", () => {
  it("should return false when conversation is empty", () => {
    const conversation: Array<MessageModel> = [];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(false);
  });

  it("should return false when conversation has only one message", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hello",
        role: "assistant",
        timestamp: "2025-01-01T00:00:00Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(false);
  });

  it("should return true when last two messages are from assistant", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hi",
        role: "user",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "Hello",
        role: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
      },
      {
        id: "3",
        text: "How are you?",
        role: "assistant",
        timestamp: "2025-01-01T00:00:02Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(true);
  });

  it("should return false when last message is from user", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hello",
        role: "assistant",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "Hi",
        role: "user",
        timestamp: "2025-01-01T00:00:01Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(false);
  });

  it("should return false when second to last message is from user", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hello",
        role: "user",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "Hi",
        role: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(false);
  });

  it("should return true when exactly two messages and both from assistant", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hello",
        role: "assistant",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "How are you?",
        role: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(true);
  });

  it("should return false when exactly two messages and both from user", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hello",
        role: "user",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "Hi there",
        role: "user",
        timestamp: "2025-01-01T00:00:01Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(false);
  });

  it("should only check last two messages, ignoring earlier ones", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Message 1",
        role: "assistant",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "Message 2",
        role: "assistant",
        timestamp: "2025-01-01T00:00:01Z",
      },
      {
        id: "3",
        text: "Message 3",
        role: "assistant",
        timestamp: "2025-01-01T00:00:02Z",
      },
      {
        id: "4",
        text: "Message 4",
        role: "user",
        timestamp: "2025-01-01T00:00:03Z",
      },
      {
        id: "5",
        text: "Message 5",
        role: "assistant",
        timestamp: "2025-01-01T00:00:04Z",
      },
      {
        id: "6",
        text: "Message 6",
        role: "assistant",
        timestamp: "2025-01-01T00:00:05Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(true);
  });

  it("should handle messages with personna field", () => {
    const conversation: Array<MessageModel> = [
      {
        id: "1",
        text: "Hello",
        role: "assistant",
        personna: "buddy",
        timestamp: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        text: "How are you?",
        role: "assistant",
        personna: "bully",
        timestamp: "2025-01-01T00:00:01Z",
      },
    ];
    expect(areLastTwoMessagesFromAssistant(conversation)).toBe(true);
  });
});
