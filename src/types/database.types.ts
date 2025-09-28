export interface Admin {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les profils spirituels
export interface SpiritualProfile {
  isBornAgain: boolean;
  bornAgainDate?: Date;
  isBaptized: boolean;
  baptismDate?: Date;
  isEnrolledInAcademy: boolean;
  academyEnrollmentDate?: Date;
  isEnrolledInLifeBearers: boolean;
  lifeBearersEnrollmentDate?: Date;
  servantFamily?: string;
  departments: {
    name: string;
    startDate: Date;
  }[];
}

// Types pour les interactions
export interface Interaction {
  id: string;
  soulId: string;
  shepherdId: string;
  type: 'call' | 'visit' | 'message' | 'sms' | 'other';
  date: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les âmes
export interface Soul {
  id: string;
  fullName: string;
  nickname?: string; // Ajout du champ surnom
  gender: 'male' | 'female';
  phone: string;
  location: string;
  isUndecided: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  firstVisitDate: Date;
  shepherdId?: string; // Peut être l'ID d'un berger ou d'un stagiaire
  spiritualProfile: SpiritualProfile;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
  photoURL?: string;
}

export interface ShepherdOption {
  id: string;
  fullName: string;
  role?: string;
}

export interface Shepherd {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface Teaching {
  id: string;
  title: string;
  description: string;
  speaker: string;
  date: Date;
  thumbnail_url: string;
  category: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudioTeaching extends Teaching {
  file_url: string;
  audioDuration?: number;
}

