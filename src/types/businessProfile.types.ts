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
  activeProfileTypes: BusinessProfileType[]; // Multiple active profiles
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
    'MANAGE_PROFILE'
  ],
  admin: ['*']
};

// Helper function to get all permissions from multiple profiles
export function getCumulativePermissions(profileTypes: BusinessProfileType[]): string[] {
  const allPermissions = new Set<string>();
  
  profileTypes.forEach(profileType => {
    const permissions = PROFILE_PERMISSIONS[profileType] || [];
    permissions.forEach(permission => allPermissions.add(permission));
  });
  
  return Array.from(allPermissions);
}