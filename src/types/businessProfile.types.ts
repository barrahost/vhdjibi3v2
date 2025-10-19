export type BusinessProfileType = 
  | 'shepherd' 
  | 'department_leader' 
  | 'adn' 
  | 'admin';

export interface BusinessProfile {
  type: BusinessProfileType;
  departmentId?: string; // For department leaders
  isActive?: boolean;
}

export interface UserBusinessProfiles {
  profiles: BusinessProfile[];
  activeProfileType?: BusinessProfileType; // Single active profile
}

export const BUSINESS_PROFILE_LABELS: Record<BusinessProfileType, string> = {
  shepherd: 'Berger(e)',
  department_leader: 'Responsable de Département',
  adn: 'ADN',
  admin: 'Administrateur'
};

export const BUSINESS_PROFILE_DESCRIPTIONS: Record<BusinessProfileType, string> = {
  shepherd: 'Peut promouvoir des âmes, gérer ses interactions',
  department_leader: 'Peut gérer son département et ses serviteurs',
  adn: 'Peut gérer les âmes, audios, statistiques',
  admin: 'Accès complet au système'
};

// Map business profiles to permissions
export const PROFILE_PERMISSIONS: Record<BusinessProfileType, string[]> = {
  shepherd: [
    'MANAGE_INTERACTIONS',
    'MANAGE_ATTENDANCES',
    'PROMOTE_SOUL_TO_SERVANT',
    'MANAGE_PROFILE'
  ],
  department_leader: [
    'MANAGE_SERVANTS',
    'MANAGE_DEPARTMENT_SERVANTS',
    'MANAGE_PROFILE'
  ],
  adn: [
    'MANAGE_SOULS',
    'MANAGE_AUDIO',
    'VIEW_STATS',
    'EXPORT_DATA',
    'MANAGE_INTERACTIONS',
    'MANAGE_ATTENDANCES',
    'MANAGE_PROFILE',
    'VIEW_REPLAY_TEACHINGS',
    'MANAGE_SMS_TEMPLATES'
  ],
  admin: ['*']
};

// Helper function to get permissions from a single active profile
export function getProfilePermissions(profileType: BusinessProfileType): string[] {
  return PROFILE_PERMISSIONS[profileType] || [];
}