
export type Role = "user" | "assistant" | string;

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface AskResponse {
  conversation_id: string;
  message: Array<{ role: string; message: string }>; 
  latency_ms: number;
  stance: "pro" | "contra";
}

export interface HistoryResponse {
  conversation_id: string;
  message: Array<{ role: string; message: string }>;
}
