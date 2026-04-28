export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  read: boolean;
  timestamp: string | Date;
}

export interface ServerToChatEvents {
  roomHistory: (messages: ChatMessage[]) => void;
  newMessage: (message: ChatMessage) => void;
  messagesRead: (data: { roomId: string; readBy: string }) => void;
  error: (data: { code: string; message: string }) => void;
}

export interface ClientToChatEvents {
  joinRoom: (data: { roomId: string }) => void;
  leaveRoom: (data: { roomId: string }) => void;
  sendMessage: (data: { roomId: string; text: string }) => void;
  markRead: (data: { roomId: string }) => void;
}

/** Genera el roomId para un chat personal (orden alfabético para que sea único) */
export const getPersonalRoomId = (userId1: string, userId2: string): string => {
  const sorted = [userId1, userId2].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
};

/** Genera el roomId para un chat de comunidad */
export const getCommunityRoomId = (communityId: string): string =>
  `room_community_${communityId}`;
