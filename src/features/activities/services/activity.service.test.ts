import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  activityRequest: vi.fn(),
  userRequest: vi.fn(),
  userRequestVoid: vi.fn(),
}));

vi.mock('@/shared/lib/api', () => ({
  ACTIVITIES_API_BASE: 'activities',
  activityApi: {
    request: apiMocks.activityRequest,
  },
  userApi: {
    request: apiMocks.userRequest,
    requestVoid: apiMocks.userRequestVoid,
  },
}));

import { activityService } from '@/features/activities/services/activity.service';

const buildActivityDto = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'activity-1',
  name: 'Actividad',
  description: 'Descripcion',
  startsAt: '2026-04-30T10:00:00.000Z',
  endsAt: '2026-04-30T12:00:00.000Z',
  status: 'OPEN',
  location: {
    latitude: 0,
    longitude: 0,
    placeId: 'place-1',
    address: 'Bloque A',
    accuracy: 1,
  },
  availablePlaces: 3,
  totalPlaces: 5,
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
  ...overrides,
});

describe('activityService', () => {
  beforeEach(() => {
    apiMocks.activityRequest.mockReset();
    apiMocks.userRequest.mockReset();
    apiMocks.userRequestVoid.mockReset();
  });

  it('creates an activity through the user management service', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      success: true,
      activityId: 'activity-9',
      message: 'created',
    });

    await expect(
      activityService.createActivity({
        requesterUserId: 'user-1',
        name: 'Nueva actividad',
        description: 'Descripcion',
        startsAt: '2026-05-01T10:00:00.000Z',
        endsAt: '2026-05-01T11:00:00.000Z',
        status: 'OPEN',
        location: {
          latitude: 4.6,
          longitude: -74.1,
          placeId: 'bloque-a',
          address: 'Bloque A',
          accuracy: 1,
        },
        totalPlaces: 8,
      }),
    ).resolves.toEqual({
      success: true,
      activityId: 'activity-9',
      message: 'created',
    });

    expect(apiMocks.userRequest).toHaveBeenCalledWith('activities', {
      method: 'POST',
      body: {
        requesterUserId: 'user-1',
        name: 'Nueva actividad',
        description: 'Descripcion',
        startsAt: '2026-05-01T10:00:00.000Z',
        endsAt: '2026-05-01T11:00:00.000Z',
        status: 'OPEN',
        location: {
          latitude: 4.6,
          longitude: -74.1,
          placeId: 'bloque-a',
          address: 'Bloque A',
          accuracy: 1,
        },
        totalPlaces: 8,
      },
    });
  });

  it('rejects when create returns success false', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      success: false,
      activityId: '',
      message: 'create failed',
    });

    await expect(
      activityService.createActivity({
        requesterUserId: 'user-1',
        name: 'Nueva actividad',
        description: '',
        startsAt: '2026-05-01T10:00:00.000Z',
        endsAt: '2026-05-01T11:00:00.000Z',
        status: 'OPEN',
        location: {
          latitude: 0,
          longitude: 0,
          placeId: 'place-1',
          address: 'Bloque A',
          accuracy: 1,
        },
        totalPlaces: 5,
      }),
    ).rejects.toThrow('create failed');
  });

  it('returns joined activities sorted by start date', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      userId: 'user-1',
      activityIds: ['activity-2', 'activity-1'],
    });

    apiMocks.activityRequest.mockImplementation(async (endpoint: string) => {
      if (endpoint === 'activities/activity-2') {
        return buildActivityDto({
          id: 'activity-2',
          name: 'Tarde',
          startsAt: '2026-05-02T16:00:00.000Z',
        });
      }

      if (endpoint === 'activities/activity-1') {
        return buildActivityDto({
          id: 'activity-1',
          name: 'Temprano',
          startsAt: '2026-05-01T09:00:00.000Z',
        });
      }

      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });

    const activities = await activityService.getUserActivitiesById('user-1');

    expect(apiMocks.userRequest).toHaveBeenCalledWith('activities/joined/user-1');
    expect(activities.map((activity) => activity.id)).toEqual(['activity-1', 'activity-2']);
    expect(activities.map((activity) => activity.title)).toEqual(['Temprano', 'Tarde']);
  });

  it('rejects when a joined activity cannot be resolved', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      userId: 'user-1',
      activityIds: ['activity-1'],
    });
    apiMocks.activityRequest.mockRejectedValueOnce(new Error('boom'));

    await expect(activityService.getUserActivitiesById('user-1')).rejects.toThrow('boom');
  });

  it('returns only the joined activity ids for a user', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      userId: 'user-1',
      activityIds: ['activity-1', 'activity-3'],
    });

    await expect(activityService.getJoinedActivityIdsByUserId('user-1')).resolves.toEqual([
      'activity-1',
      'activity-3',
    ]);
    expect(apiMocks.userRequest).toHaveBeenCalledWith('activities/joined/user-1');
  });

  it('joins an activity through the user management service', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      success: true,
      activityId: 'activity-7',
      message: 'joined',
    });

    await expect(activityService.joinActivity('activity-7', 'user-1')).resolves.toEqual({
      success: true,
      activityId: 'activity-7',
      message: 'joined',
    });

    expect(apiMocks.userRequest).toHaveBeenCalledWith('activities/activity-7/join', {
      method: 'POST',
      body: { userId: 'user-1' },
    });
  });

  it('rejects when join returns success false', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      success: false,
      activityId: 'activity-7',
      message: 'join failed',
    });

    await expect(activityService.joinActivity('activity-7', 'user-1')).rejects.toThrow('join failed');
  });

  it('leaves an activity through the user management service', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      success: true,
      activityId: 'activity-7',
      message: 'left',
    });

    await expect(activityService.leaveActivity('activity-7', 'user-1')).resolves.toEqual({
      success: true,
      activityId: 'activity-7',
      message: 'left',
    });

    expect(apiMocks.userRequest).toHaveBeenCalledWith('activities/activity-7/leave', {
      method: 'POST',
      body: { userId: 'user-1' },
    });
  });

  it('rejects when leave returns success false', async () => {
    apiMocks.userRequest.mockResolvedValueOnce({
      success: false,
      activityId: 'activity-7',
      message: 'leave failed',
    });

    await expect(activityService.leaveActivity('activity-7', 'user-1')).rejects.toThrow('leave failed');
  });
});
