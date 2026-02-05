export type GamePhase = 'INTRO' | 'WRITE_LETTER' | 'SELECT_CURRENT' | 'TRAVEL_SIMULATION' | 'ARRIVAL' | 'SETTINGS';

export type WeatherEffect = 'NONE' | 'RAIN' | 'FOG';

export interface GeoPoint {
  lat: number;
  lng: number;
  alt?: number;
}

export interface MarineLife {
  name: string;
  emoji: string;
  depth: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct option
  fact: string; // explanation shown after answering
}

export interface OceanCurrent {
  id: string;
  name: string;
  description: string;
  startLocation: string;
  endLocation: string;
  path: GeoPoint[];
  color: string;
  avgTemp: string; // e.g., "24°C"
  avgSpeed: string; // e.g., "2 m/s"
  biodiversity: MarineLife[];
  quizzes: QuizQuestion[];
}

export interface Letter {
  content: string;
  senderName: string;
}

export interface DestinationResponse {
  location: string;
  replyText: string;
  funFact: string;
}