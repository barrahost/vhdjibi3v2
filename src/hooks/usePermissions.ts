import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../constants/roles';
import type { Permission } from '../types/permission.types';

export function usePermissions() {
  const { permissions, userRole, activeRole, additionalMenus } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    // Use active role if available, otherwise fall back to userRole
    const currentRole = activeRole || userRole;
    
    // Le super admin a toutes les permissions
    if (currentRole === 'super_admin') return true;
    
    // Check if the user has this permission in their additional menus
    if (additionalMenus && additionalMenus.includes(permission)) {
      return true;
    }
    
    if (!permissions || !Array.isArray(permissions)) return false;
    return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission);
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  return { hasPermission, hasAllPermissions, hasAnyPermission };
}