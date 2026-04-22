import { ACTIVITIES_API_BASE, activityApi } from '@/shared/lib/api';
import { Activity, MOCK_ACTIVITIES } from '@/shared/data/mockData';

type ActivityStatus = 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED';

interface ActivityLocationDto {
  latitude: number;
  longitude: number;
  placeId: string;
  address: string;
  accuracy: number;
}

interface ActivityResponseDto {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  status: ActivityStatus;
  location: ActivityLocationDto;
  availablePlaces: number;
  totalPlaces: number;
  createdAt: string;
  updatedAt: string;
}

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

  return {
    id: activity.id,
    title: activity.name,
    category: 'other',
    coverImage: `https://picsum.photos/seed/peerly-activity-${activity.id}/800/500`,
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
    status: activity.status,
    source: 'api',
  };
};

const sortActivitiesByStartDate = (activities: Activity[]) =>
  [...activities].sort((left, right) => {
    const leftTime = new Date(left.startsAtISO ?? left.date).getTime();
    const rightTime = new Date(right.startsAtISO ?? right.date).getTime();
    return leftTime - rightTime;
  });

const mockActivities = MOCK_ACTIVITIES.map((activity) => ({
  ...activity,
  source: 'mock' as const,
}));

export const activityService = {
  async getAllActivities(): Promise<Activity[]> {
    const activities = await activityApi.request<ActivityResponseDto[]>(ACTIVITIES_API_BASE);
    return sortActivitiesByStartDate(activities.map(mapActivityDtoToViewModel));
  },

  async getActivityById(id: string): Promise<Activity> {
    const activity = await activityApi.request<ActivityResponseDto>(`${ACTIVITIES_API_BASE}/${id}`);
    return mapActivityDtoToViewModel(activity);
  },

  getMockActivities(): Activity[] {
    return mockActivities;
  },

  getMockActivityById(id: string): Activity | undefined {
    return mockActivities.find((activity) => activity.id === id);
  },
};
