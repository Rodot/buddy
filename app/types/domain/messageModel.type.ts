export type Personna = "buddy" | "bully";

export interface MessageModel {
  id: string;
  text: string;
  timestamp: string;
  role: "user" | "assistant";
  personna?: Personna;
}
