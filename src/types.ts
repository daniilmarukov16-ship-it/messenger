export interface User {
  id: string;
  login: string;
  password: string;
  displayName: string;
  avatar: string;
  status: string;
  lastSeen: number;
  createdAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  type: 'text' | 'image';
  timestamp: number;
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  avatar: string;
  members: string[];
  createdAt: number;
  createdBy: string;
}
