import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AvailabilityBlock } from '@/shared/data/mockData';
import { userService, type UserProfile } from '@/features/users/services/user.service';

type CurrentUserProfile = {
  bio: string;
  interests: string[];
  availability: AvailabilityBlock[];
};

const defaultProfile: CurrentUserProfile = {
  bio: 'Dev en progreso ☕💻 Buscando partners para hackathons y cafés. Semestre 6 y sobreviviendo.',
  interests: ['coding', 'coffee', 'music', 'gaming'],
  availability: [
    { day: 'Lun', start: '10:00', end: '12:00' },
    { day: 'Mar', start: '10:00', end: '12:00' },
    { day: 'Mié', start: '08:00', end: '10:00' },
    { day: 'Mié', start: '12:00', end: '14:00' },
    { day: 'Jue', start: '08:00', end: '10:00' },
    { day: 'Jue', start: '12:00', end: '14:00' },
  ],
};

const CurrentUserContext = createContext<{
  profile: CurrentUserProfile;
  updateProfile: (updates: Partial<CurrentUserProfile>) => void;
  userData: UserProfile | null;
  setUserData: (data: UserProfile | null) => void;
  isLoading: boolean;
} | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CurrentUserProfile>(defaultProfile);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateProfile = useCallback((updates: Partial<CurrentUserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        try {
          const user = await userService.getUserById(userId);
          if (user) {
            setUserData(user);
            setProfile({
              bio: user.description || '',
              interests: user.interests?.map(i => i.id) || [],
              availability: user.freeTimeSchedule?.map(f => ({
                day: f.dayOfTheWeek,
                start: f.startsAt?.substring(11, 16) ?? '',
                end: f.endsAt?.substring(11, 16) ?? '',
              })) || [],
            });
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
      setIsLoading(false);
    };

    loadUserData();
  }, []);

  return (
    <CurrentUserContext.Provider value={{ profile, updateProfile, userData, setUserData, isLoading }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return ctx;
}
