export interface EvangelizedSoul {
  id: string;
  fullName: string;
  nickname?: string | null;
  gender: 'male' | 'female';
  phone: string;
  location: string;
  evangelizationDate: Date;
  evangelizationLocation?: string | null;
  notes?: string | null;
  evangelistId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'imported';
  photoURL?: string | null;
  importedToSoulId?: string | null;
  importedAt?: Date | null;
  importedBy?: string | null;
}
