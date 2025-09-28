import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/roles';
import BackupRestore from '../components/settings/BackupRestore';
import AnnouncementManagement from '../components/settings/AnnouncementManagement';
import UserMenuManagement from '../components/settings/UserMenuManagement';
import RolePermissionManagement from '../components/settings/RolePermissionManagement';

export default function Settings() {
  const { userRole } = useAuth();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<'backup' | 'announcements' | 'user-menus' | 'roles-permissions'>('backup');
  const isSuperAdmin = userRole === 'super_admin';
  
  // Rediriger vers le profil si l'utilisateur n'a que cette permission
  useEffect(() => {
    if (!hasPermission(PERMISSIONS.MANAGE_BACKUP)) {
      setActiveTab('backup');
    }
  }, [hasPermission]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <div className="flex space-x-2">
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'announcements'
                    ? 'bg-[#00665C] text-white'
                    : 'text-gray-700 bg-white border border-gray-300'
                }`}
              >
                Annonces
              </button>
              <button
                onClick={() => setActiveTab('user-menus')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'user-menus'
                    ? 'bg-[#00665C] text-white'
                    : 'text-gray-700 bg-white border border-gray-300'
                }`}
              >
                Menus Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('roles-permissions')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'roles-permissions'
                    ? 'bg-[#00665C] text-white'
                    : 'text-gray-700 bg-white border border-gray-300'
                }`}
              >
                Rôles et Permissions
              </button>
            </>
          )}
          {hasPermission(PERMISSIONS.MANAGE_BACKUP) && (
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'backup'
                  ? 'bg-[#00665C] text-white'
                  : 'text-gray-700 bg-white border border-gray-300'
              }`}
            >
              Sauvegarde
            </button>
          )}
        </div>
      </div>

      {hasPermission(PERMISSIONS.MANAGE_BACKUP) && activeTab === 'backup' && (
        <BackupRestore />
      )}
      {isSuperAdmin && activeTab === 'announcements' && (
        <AnnouncementManagement />
      )}
      {isSuperAdmin && activeTab === 'user-menus' && (
        <UserMenuManagement />
      )}
      {isSuperAdmin && activeTab === 'roles-permissions' && (
        <RolePermissionManagement />
      )}
    </div>
  );
}