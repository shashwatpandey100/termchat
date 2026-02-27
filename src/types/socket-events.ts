import type { Message } from "../db/schema";

export interface ServerToClientEvents {
  "message-history": (messages: Message[]) => void;
  "new-message": (message: Message) => void;
}

export interface ClientToServerEvents {
  "join-room": (data: { roomId: string; senderName: string }) => void;
  "send-message": (data: {
    roomId: string;
    senderName: string;
    content: string;
    fileUrl?: string;
  }) => void;
}

export interface SocketData {
  roomId?: string;
  senderName?: string;
}
