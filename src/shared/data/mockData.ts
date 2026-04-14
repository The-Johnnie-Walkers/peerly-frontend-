import { BookOpen, Coffee, Music, Gamepad2, PartyPopper, Mountain, Palette, Dumbbell, Camera, Theater, Code, Utensils } from 'lucide-react';
import React from 'react';

export type Interest = {
  id: string;
  label: string;
  icon: string; // lucide icon name
  category: 'SPORTS' | 'VIDEOGAMES' | 'MUSIC' | 'MOVIES' | 'BOOKS' | 'TECHNOLOGY' | 'OTHER';
};

/** Franja disponible: un bloque de tiempo en un día (ej. Lun 08:00–10:00). */
export type AvailabilityBlock = {
  id?: string;
  day: string;
  start: string;
  end: string;
};

export type Student = {
  id: string;
  name: string;
  photo: string;
  career: string;
  semester: number;
  interests: string[];
  compatibility: number;
  bio: string;
  availability: AvailabilityBlock[];
  isOnline: boolean;
};

export type Activity = {
  id: string;
  title: string;
  category: 'study' | 'social' | 'sport' | 'food' | 'other';
  coverImage: string;
  location: string;
  date: string;
  time: string;
  maxAttendees: number;
  currentAttendees: string[];
  description: string;
  creatorId: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
};

export type Notification = {
  id: string;
  type: 'connection' | 'activity' | 'message';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
};

export type ConnectionRequest = {
  id: string;
  student: Student;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
};

/** Conversación/chat con un estudiante (conexión). */
export type Connection = {
  id: string;
  student: Student;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
};

export const INTERESTS: Interest[] = [
  { id: 'study', label: 'Grupos de estudio', icon: 'BookOpen', category: 'BOOKS' },
  { id: 'coffee', label: 'Cafecito', icon: 'Coffee', category: 'OTHER' },
  { id: 'music', label: 'Conciertos', icon: 'Music', category: 'MUSIC' },
  { id: 'gaming', label: 'Gaming', icon: 'Gamepad2', category: 'VIDEOGAMES' },
  { id: 'party', label: 'Fiestas', icon: 'PartyPopper', category: 'OTHER' },
  { id: 'hiking', label: 'Senderismo', icon: 'Mountain', category: 'SPORTS' },
  { id: 'art', label: 'Arte', icon: 'Palette', category: 'OTHER' },
  { id: 'sports', label: 'Deportes', icon: 'Dumbbell', category: 'SPORTS' },
  { id: 'photo', label: 'Fotografía', icon: 'Camera', category: 'TECHNOLOGY' },
  { id: 'theater', label: 'Teatro', icon: 'Theater', category: 'MOVIES' },
  { id: 'coding', label: 'Programación', icon: 'Code', category: 'TECHNOLOGY' },
  { id: 'food', label: 'Gastronomía', icon: 'Utensils', category: 'OTHER' },
];

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Valeria Gómez',
    photo: 'https://picsum.photos/seed/peerly-student-1/400/400',
    career: 'Ingeniería de Diseño',
    semester: 6,
    interests: ['study', 'coffee', 'music', 'art'],
    compatibility: 94,
    bio: 'Amante del buen café y el UI design. Busco gente para estudiar en la biblioteca los martes. 📚☕',
    availability: [
      { day: 'Lun', start: '10:00', end: '12:00' },
      { day: 'Mar', start: '10:00', end: '12:00' },
      { day: 'Mié', start: '08:00', end: '10:00' },
      { day: 'Mié', start: '12:00', end: '14:00' },
      { day: 'Jue', start: '08:00', end: '10:00' },
      { day: 'Jue', start: '12:00', end: '14:00' },
    ],
    isOnline: true,
  },
  {
    id: '2',
    name: 'Mateo Ruiz',
    photo: 'https://picsum.photos/seed/peerly-student-2/400/400',
    career: 'Administración',
    semester: 4,
    interests: ['gaming', 'party', 'hiking', 'sports'],
    compatibility: 82,
    bio: 'FIFA y caminatas los fines de semana. ¿Sale plan? 🎮⛰️',
    availability: [
      { day: 'Mar', start: '14:00', end: '16:00' },
      { day: 'Mié', start: '08:00', end: '10:00' },
      { day: 'Jue', start: '12:00', end: '14:00' },
      { day: 'Vie', start: '18:00', end: '20:00' },
    ],
    isOnline: false,
  },
  {
    id: '3',
    name: 'Isabella Torres',
    photo: 'https://picsum.photos/seed/peerly-student-3/400/400',
    career: 'Psicología',
    semester: 7,
    interests: ['coffee', 'music', 'theater', 'art'],
    compatibility: 89,
    bio: 'Creo que las mejores conversaciones surgen tomando tinto. Psicología + música indie 🎶',
    availability: [
      { day: 'Lun', start: '09:00', end: '11:00' },
      { day: 'Mar', start: '10:00', end: '12:00' },
      { day: 'Mié', start: '14:00', end: '16:00' },
    ],
    isOnline: true,
  },
  {
    id: '4',
    name: 'Santiago López',
    photo: 'https://picsum.photos/seed/peerly-student-4/400/400',
    career: 'Ingeniería de Sistemas',
    semester: 5,
    interests: ['coding', 'gaming', 'coffee', 'music'],
    compatibility: 91,
    bio: 'Full-stack dev en progreso. Siempre buscando un partner para hackathons 💻🚀',
    availability: [
      { day: 'Lun', start: '14:00', end: '16:00' },
      { day: 'Mar', start: '08:00', end: '10:00' },
      { day: 'Jue', start: '10:00', end: '12:00' },
      { day: 'Vie', start: '14:00', end: '16:00' },
    ],
    isOnline: true,
  },
  {
    id: '5',
    name: 'Camila Herrera',
    photo: 'https://picsum.photos/seed/peerly-student-5/400/400',
    career: 'Comunicación Social',
    semester: 3,
    interests: ['photo', 'party', 'food', 'music'],
    compatibility: 76,
    bio: 'Fotógrafa de fiestas y foodie de corazón. ¿Alguien para un brunch dominical? 📸🥐',
    availability: [
      { day: 'Mar', start: '12:00', end: '14:00' },
      { day: 'Mié', start: '16:00', end: '18:00' },
      { day: 'Jue', start: '10:00', end: '12:00' },
    ],
    isOnline: false,
  },
  {
    id: '6',
    name: 'Andrés Mejía',
    photo: 'https://picsum.photos/seed/peerly-student-6/400/400',
    career: 'Arquitectura',
    semester: 8,
    interests: ['art', 'hiking', 'photo', 'coffee'],
    compatibility: 85,
    bio: 'Diseño espacios que inspiran. Los domingos son de caminata y café artesanal ☕🏔️',
    availability: [
      { day: 'Lun', start: '08:00', end: '10:00' },
      { day: 'Mié', start: '08:00', end: '10:00' },
      { day: 'Jue', start: '14:00', end: '16:00' },
      { day: 'Vie', start: '21:00', end: '22:00' },
    ],
    isOnline: true,
  },
  {
    id: '7',
    name: 'Laura Martínez',
    photo: 'https://picsum.photos/seed/peerly-student-7/400/400',
    career: 'Medicina',
    semester: 9,
    interests: ['study', 'sports', 'food', 'hiking'],
    compatibility: 78,
    bio: 'Estudiando para salvar vidas, pero los viernes necesito desconectar. ¿Volley? 🏐',
    availability: [
      { day: 'Mar', start: '14:00', end: '16:00' },
      { day: 'Jue', start: '12:00', end: '14:00' },
      { day: 'Vie', start: '18:00', end: '22:00' },
    ],
    isOnline: false,
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    title: 'Repaso Cálculo III',
    category: 'study',
    coverImage: 'https://picsum.photos/seed/peerly-activity-a1/800/500',
    location: 'Biblioteca Norte, Sala 3',
    date: '2026-03-16',
    time: '14:00',
    maxAttendees: 8,
    currentAttendees: ['1', '4', '7'],
    description: 'Sesión de repaso para el parcial del viernes. Traigan ejercicios resueltos para compartir.',
    creatorId: '4',
  },
  {
    id: 'a2',
    title: 'Torneo FIFA Campus',
    category: 'social',
    coverImage: 'https://picsum.photos/seed/peerly-activity-a2/800/500',
    location: 'Sala de Juegos, Bloque C',
    date: '2026-03-17',
    time: '16:00',
    maxAttendees: 16,
    currentAttendees: ['2', '4', '5'],
    description: '¡Torneo de FIFA con premios! Inscríbete y demuestra quién es el mejor del campus.',
    creatorId: '2',
  },
  {
    id: 'a3',
    title: 'Café & Sketch',
    category: 'food',
    coverImage: 'https://picsum.photos/seed/peerly-activity-a3/800/500',
    location: 'Cafetería Central',
    date: '2026-03-18',
    time: '10:00',
    maxAttendees: 12,
    currentAttendees: ['1', '3', '6'],
    description: 'Dibujamos mientras tomamos café. Todos los niveles bienvenidos. Trae tu sketchbook 🎨',
    creatorId: '6',
  },
  {
    id: 'a4',
    title: 'Caminata al cerro',
    category: 'sport',
    coverImage: 'https://picsum.photos/seed/peerly-activity-a4/800/500',
    location: 'Punto de encuentro: Portería Sur',
    date: '2026-03-20',
    time: '07:00',
    maxAttendees: 20,
    currentAttendees: ['2', '6', '7', '3'],
    description: 'Caminata matutina de 2 horas. Nivel intermedio. ¡Lleva agua y snacks!',
    creatorId: '6',
  },
];

export const MOCK_CONNECTIONS: Connection[] = [
  {
    id: 'm1',
    student: MOCK_STUDENTS[0],
    lastMessage: '¿Nos vemos mañana en la biblio? 📚',
    lastMessageTime: '2 min',
    unread: 2,
  },
  {
    id: 'm2',
    student: MOCK_STUDENTS[3],
    lastMessage: '¡Parcero, el hackathon es este finde!',
    lastMessageTime: '15 min',
    unread: 0,
  },
  {
    id: 'm3',
    student: MOCK_STUDENTS[2],
    lastMessage: 'Ese café suena increíble ☕',
    lastMessageTime: '1 hora',
    unread: 1,
  },
  {
    id: 'm4',
    student: MOCK_STUDENTS[5],
    lastMessage: '¿Cómo va el proyecto de arq?',
    lastMessageTime: '3 horas',
    unread: 0,
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'connection',
    title: 'Nueva conexión',
    description: 'Valeria Gómez quiere conectar contigo.',
    timestamp: 'Hace 5 min',
    isRead: false,
    avatar: 'https://picsum.photos/seed/peerly-student-1/100/100',
  },
  {
    id: 'n2',
    type: 'activity',
    title: 'Actividad confirmada',
    description: 'Te has unido a "Repaso Cálculo III".',
    timestamp: 'Hace 1 hora',
    isRead: false,
    avatar: 'https://picsum.photos/seed/peerly-activity-a1/100/100',
  },
  {
    id: 'n3',
    type: 'message',
    title: 'Nuevo mensaje',
    description: 'Mateo Ruiz: ¡Parcero, el hackathon es este...',
    timestamp: 'Hace 2 horas',
    isRead: true,
    avatar: 'https://picsum.photos/seed/peerly-student-2/100/100',
  },
];

export const MOCK_CONNECTION_REQUESTS: ConnectionRequest[] = [
  {
    id: 'cr1',
    student: MOCK_STUDENTS[4], // Camila Herrera
    timestamp: 'Hace 2 horas',
    status: 'pending',
  },
  {
    id: 'cr2',
    student: MOCK_STUDENTS[6], // Laura Martínez
    timestamp: 'Ayer',
    status: 'pending',
  },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'c1', senderId: '1', text: '¡Hola! Vi que también estás en diseño 👀', timestamp: '10:30 AM' },
  { id: 'c2', senderId: 'me', text: '¡Sí! Estoy en 6to semestre. ¿Tú?', timestamp: '10:32 AM' },
  { id: 'c3', senderId: '1', text: 'Yo también en 6to. ¿Tienes clase con Martínez?', timestamp: '10:33 AM' },
  { id: 'c4', senderId: 'me', text: 'Sí, los martes y jueves. Esa clase está intensa 😅', timestamp: '10:35 AM' },
  { id: 'c5', senderId: '1', text: '¿Nos vemos mañana en la biblio? 📚', timestamp: '10:38 AM' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  study: 'Estudio',
  social: 'Social',
  sport: 'Deporte',
  food: 'Gastronomía',
  other: 'Otro',
};

export const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] as const;
/** Horas posibles para inicio/fin de franjas (bloques de estudio). */
export const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'] as const;
/** Etiquetas para la grilla de onboarding (compatibilidad). */
export const TIME_LABELS = ['8AM', '10AM', '12PM', '2PM'] as const;
