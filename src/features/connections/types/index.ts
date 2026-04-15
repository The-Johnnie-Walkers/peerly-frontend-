export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

export interface Connection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  interests: string[];
  memberIds: string[];
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectionRequest {
  requesterId: string;
  receiverId: string;
}

export interface UpdateConnectionRequest {
  status: ConnectionStatus;
  actorId?: string;
}

export interface CreateCommunityRequest {
  name: string;
  description?: string;
  interests?: string[];
  creatorId: string;
}
