export interface Servant {
  id: string;
  fullName: string;
  nickname?: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  departmentId: string;
  isHead: boolean;
  isShepherd?: boolean;
  shepherdId?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  // Nouveaux champs pour le lien avec l'âme d'origine
  originalSoulId?: string; // Référence vers l'âme d'origine
  promotionDate?: Date; // Date de promotion depuis âme
}

export interface ServantFormData {
  fullName: string;
  nickname?: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  departmentId: string;
  isHead: boolean;
  isShepherd?: boolean;
  shepherdId?: string;
  status?: 'active' | 'inactive';
  originalSoulId?: string;
  promotionDate?: Date;
}