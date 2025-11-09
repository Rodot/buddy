export interface MessageModel {
  id: string;
  text: string;
  timestamp: string;
  role: "user" | "assistant";
}
