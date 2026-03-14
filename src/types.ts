export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  updatedAt: any;
  lastModifiedBy?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: any;
}
