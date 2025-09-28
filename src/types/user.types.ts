// src/types/user.types.ts

import { Role } from './permission.types'; // garde si utile ailleurs

export type UserRoles = 'admin' | 'shepherd' | 'adn';

export type UserType = UserRoles | null;

export interface UserCreateData {
  fullName: string;
  email: string;
  password: string;
  roles: UserRoles;
  phone?: string;
  photo?: File | null;
}

export interface User {
  id: string;
  uid: string;
  fullName: string;
  nickname?: string;
  email: string;
  role?: string;
  roles: UserRoles;
  additionalMenus?: string[];
  phone?: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  photoURL?: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  fromAdminsCollection?: boolean;
}
