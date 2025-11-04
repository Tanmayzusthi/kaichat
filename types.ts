import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  username: string;
  phone: string;
  verified: boolean;
  status: 'online' | 'offline';
  lastSeen: Timestamp;
}

export type MessageType = 'text' | 'image' | 'video';

export interface Message {
  id: string;
  from: string;
  // `to` field is no longer needed as messages are in a specific chat subcollection
  // to: string;
  content: string;
  type: MessageType;
  timestamp: Timestamp;
  reactions?: { [key: string]: string[] };
}

export interface ChatRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: Timestamp;
}