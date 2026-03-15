import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AvailabilityBlock } from '@/data/mockData';

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
} | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CurrentUserProfile>(defaultProfile);
  const updateProfile = useCallback((updates: Partial<CurrentUserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);
  return (
    <CurrentUserContext.Provider value={{ profile, updateProfile }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return ctx;
}
