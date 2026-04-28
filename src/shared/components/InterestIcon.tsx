import { BookOpen, Coffee, Music, Gamepad2, PartyPopper, Mountain, Palette, Dumbbell, Camera, Theater, Code, Utensils, LucideProps } from 'lucide-react';
import React from 'react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  BookOpen, Coffee, Music, Gamepad2, PartyPopper, Mountain, Palette, Dumbbell, Camera, Theater, Code, Utensils,
};

export const InterestIcon = ({ name, size = 16, className }: { name: string; size?: number; className?: string }) => {
  const Icon = iconMap[name];
  return Icon ? <Icon size={size} className={className} /> : null;
};
