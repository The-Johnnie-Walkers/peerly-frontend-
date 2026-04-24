import { ACTIVITIES_API_BASE, activityApi, userApi } from '@/shared/lib/api';

export type ActivityStatus = 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';

export interface ActivityLocationPayload {
  latitude: number;
  longitude: number;
  placeId: string;
  address: string;
  accuracy: number;
}

export interface Activity {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  maxAttendees: number;
  currentAttendees: string[];
  description: string;
  creatorId: string;
  startsAtISO?: string;
  endsAtISO?: string;
  availablePlaces?: number;
  status?: 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';
}

interface ActivityResponseDto {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  status: ActivityStatus;
  location: ActivityLocationPayload;
  availablePlaces: number;
  totalPlaces: number;
  createdAt: string;
  updatedAt: string;
}

interface JoinedActivitiesResponse {
  userId: string;
  activityIds: string[];
}

interface ActivityParticipationResponse {
  success: boolean;
  activityId: string;
  message: string;
}

export interface CreateActivityPayload {
  requesterUserId: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  status: ActivityStatus;
  location: ActivityLocationPayload;
  totalPlaces: number;
}

interface ActivityCommandResponse {
  success: boolean;
  activityId: string;
  message: string;
}

const assertActivityCommandSucceeded = <T extends ActivityCommandResponse>(
  response: T,
  fallbackMessage: string,
): T => {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }

  return response;
};

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const mapActivityDtoToViewModel = (activity: ActivityResponseDto): Activity => {
  const startsAt = new Date(activity.startsAt);
  const confirmedCount = Math.max(0, activity.totalPlaces - activity.availablePlaces);
  const status = activity.availablePlaces === 0 && activity.status === 'OPEN' ? 'FULL' : activity.status;

  return {
    id: activity.id,
    title: activity.name,
    location: activity.location.address,
    date: dateFormatter.format(startsAt),
    time: timeFormatter.format(startsAt),
    maxAttendees: activity.totalPlaces,
    currentAttendees: Array.from(
      { length: confirmedCount },
      (_, index) => `activity-attendee-${activity.id}-${index + 1}`,
    ),
    description: activity.description,
    creatorId: '',
    startsAtISO: activity.startsAt,
    endsAtISO: activity.endsAt,
    availablePlaces: activity.availablePlaces,
    status,
  };
};

const sortActivitiesByStartDate = (activities: Activity[]) =>
  [...activities].sort((left, right) => {
    const leftTime = new Date(left.startsAtISO ?? left.date).getTime();
    const rightTime = new Date(right.startsAtISO ?? right.date).getTime();
    return leftTime - rightTime;
  });



export const activityService = {
  async getAllActivities(): Promise<Activity[]> {
    const activities = await activityApi.request<ActivityResponseDto[]>(ACTIVITIES_API_BASE);
    const seen = new Set<string>();
    const unique = activities.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    return sortActivitiesByStartDate(unique.map(mapActivityDtoToViewModel));
  },

  async createActivity(payload: CreateActivityPayload): Promise<ActivityCommandResponse> {
    const response = await userApi.request<ActivityCommandResponse>(ACTIVITIES_API_BASE, {
      method: 'POST',
      body: payload,
    });

    return assertActivityCommandSucceeded(response, 'No fue posible crear la actividad.');
  },

  async getActivityById(id: string): Promise<Activity> {
    const activity = await activityApi.request<ActivityResponseDto>(`${ACTIVITIES_API_BASE}/${id}`);
    return mapActivityDtoToViewModel(activity);
  },

  async getJoinedActivityIdsByUserId(id: string): Promise<string[]> {
    if (!id) return [];

    const { activityIds } = await userApi.request<JoinedActivitiesResponse>(`${ACTIVITIES_API_BASE}/joined/${id}`);
    return activityIds;
  },

  async getUserActivitiesById(id: string): Promise<Activity[]> {
    const activityIds = [...new Set(await this.getJoinedActivityIdsByUserId(id))];

    if (!activityIds.length) return [];

    const activities = await Promise.all(
      activityIds.map((activityId) =>
        activityApi.request<ActivityResponseDto>(`${ACTIVITIES_API_BASE}/${activityId}`),
      ),
    );

    return sortActivitiesByStartDate(activities.map(mapActivityDtoToViewModel));
  },

  async joinActivity(activityId: string, userId: string): Promise<ActivityParticipationResponse> {
    const response = await userApi.request<ActivityParticipationResponse>(`${ACTIVITIES_API_BASE}/${activityId}/join`, {
      method: 'POST',
      body: { userId },
    });

    return assertActivityCommandSucceeded(response, 'No fue posible ingresar a la actividad.');
  },

  async leaveActivity(activityId: string, userId: string): Promise<ActivityParticipationResponse> {
    const response = await userApi.request<ActivityParticipationResponse>(`${ACTIVITIES_API_BASE}/${activityId}/leave`, {
      method: 'POST',
      body: { userId },
    });

    return assertActivityCommandSucceeded(response, 'No fue posible salir de la actividad.');
  },
};
