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
}