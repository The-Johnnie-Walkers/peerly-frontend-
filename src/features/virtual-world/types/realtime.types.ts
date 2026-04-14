export interface Position {
  x: number;
  y: number;
}

export interface UserInMap {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface ServerToClientEvents {
  userJoined: (user: UserInMap) => void;
  userLeft: (userId: string) => void;
  positionUpdate: (update: { userId: string; x: number; y: number }) => void;
  chatMessage: (message: ChatMessage) => void;
  initialPositions: (users: UserInMap[]) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  joinMap: () => void;
  updatePosition: (position: Position) => void;
  sendChat: (payload: { message: string }) => void;
}
