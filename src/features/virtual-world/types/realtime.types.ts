export interface Position {
  x: number;
  y: number;
}

export interface UserInMap {
  userId: string;
  name: string;
  email?: string;
  color?: string; // Optional, set by client or defaults
  x: number;
  y: number;
  timestamp?: number;
}

export interface AvatarPosition {
  userId: string;
  name: string;
  x: number;
  y: number;
  color?: string;
}

export interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  timestamp: number;
}

export interface PositionUpdate {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface RealtimeError {
  code: 'PROCESSING_ERROR' | 'VALIDATION_ERROR' | 'AUTH_ERROR';
  message: string;
  timestamp: number;
}

export interface ServerToClientEvents {
  userJoined: (payload: { userId: string; name: string; email: string; timestamp: number }) => void;
  userLeft: (payload: { userId: string; timestamp: number }) => void;
  positionUpdate: (payload: PositionUpdate) => void;
  chatMessage: (payload: ChatMessage) => void;
  initialPositions: (users: AvatarPosition[]) => void;
  error: (payload: RealtimeError) => void;
}

export interface ClientToServerEvents {
  joinMap: () => void;
  leaveMap: () => void;
  updatePosition: (position: Position) => void;
  sendChat: (payload: { message: string }) => void;
}
