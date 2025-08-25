export type Role = 'user' | 'bot';

export interface ChatMessage {
  role: Role;
  message: string;
}

export interface ApiResponse {
  conversation_id: string;
  message: ChatMessage[];
}

export interface Profile {
  id: string;          
  name: string;        
}
