export type Permission = 
  | 'MANAGE_USERS'
  | 'MANAGE_SOULS' 
  | 'MANAGE_SHEPHERDS'
  | 'MANAGE_DEPARTMENTS'
  | 'MANAGE_FAMILIES'
  | 'VIEW_STATS'
  | 'EXPORT_DATA'
  | 'MANAGE_SETTINGS'
  | 'MANAGE_PROFILE'
  | 'MANAGE_INTERACTIONS'
  | 'MANAGE_ATTENDANCES'
  | 'MANAGE_REPORTS'
  | 'MANAGE_BACKUP'
  | 'MANAGE_DATABASE'
  | 'MANAGE_SMS'
  | 'MANAGE_SMS_TEMPLATES'
  | 'MANAGE_AUDIO'
  | 'MANAGE_ROLES_PERMISSIONS'
  | 'MANAGE_ROLES_PERMISSIONS'
  | '*';

export type BaseRole = 'super_admin' | 'admin' | 'shepherd' | 'adn' | 'pasteur';

export interface UserRoles {
  primary: BaseRole;
  secondary: BaseRole[];
}

export type Role = BaseRole | UserRoles;

export interface RolePermissions {
  role: BaseRole;
  permissions: Permission[];
  description: string;
}