import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { DEFAULT_PASSWORDS } from '../constants/auth';
import { RoleService } from '../services/auth/roleService';
import type { Permission, Role, BaseRole } from '../types/permission.types';
import { ROLE_PERMISSIONS } from '../constants/roles';
import { PROFILE_PERMISSIONS, getProfilePermissions } from '../types/businessProfile.types';
import type { BusinessProfileType } from '../types/businessProfile.types';
import { validatePhoneNumber } from '../utils/phoneValidation';
import toast from 'react-hot-toast';

interface AuthState {
  user: any | null;
  loading: boolean;
  userRole: Role | null;
  availableRoles: BaseRole[];
  activeRole: BaseRole | null;
  additionalMenus: string[];
  permissions: Permission[];
  login: (phone: string, password: string) => Promise<any>;
  logout: () => void;
  switchRole: (role: BaseRole | BusinessProfileType) => void;
  switchToProfile: (profileType: BusinessProfileType) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  userRole: null,
  availableRoles: [],
  activeRole: null,
  additionalMenus: [],
  permissions: [],
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
  switchToProfile: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    userRole: null,
    availableRoles: [],
    activeRole: null,
    additionalMenus: [],
    permissions: [],
    login: async () => null,
    logout: () => {},
    switchRole: () => {},
    switchToProfile: async () => {}
  });

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Convert date strings back to Date objects
      if (userData.createdAt) {
        userData.createdAt = new Date(userData.createdAt);
      }
      if (userData.lastLoginAt) {
        userData.lastLoginAt = new Date(userData.lastLoginAt);
      }
      
      const loadPermissions = async () => {
        // For regular admins, we now look in the users collection
        const permissions = await RoleService.getUserPermissions(userData.uid);
        
        // Load additional menus if user is a shepherd
        let additionalMenus: string[] = [];
        if (userData.role === 'shepherd' || userData.role === 'intern') {
          try {
            const userQuery = query(
              collection(db, 'users'),
              where('uid', '==', userData.uid)
            );
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0].data();
              additionalMenus = userDoc.additionalMenus || [];
            }
          } catch (error) {
            console.error('Error loading additional menus:', error);
          }
        }
        
        let availableRoles = [];
        let activeRole = null;
        let activePermissions: Permission[] = [];
        
        // Check for business profiles first (new system)
        if (userData.businessProfiles && Array.isArray(userData.businessProfiles)) {
          availableRoles = userData.businessProfiles.map((profile: any) => profile.type);
          
          // Get active profiles
          const activeProfiles = userData.businessProfiles.filter((profile: any) => profile.isActive);
          const activeProfileTypes = activeProfiles.map((profile: any) => profile.type as BusinessProfileType);
          
          if (activeProfileTypes.length > 0) {
            // Calculate cumulative permissions
            activePermissions = getProfilePermissions(activeProfileTypes[0]) as Permission[];
            // Set activeRole to shepherd if present, otherwise first active profile
            activeRole = activeProfileTypes.includes('shepherd') ? 'shepherd' : activeProfileTypes[0];
          } else {
            // No active profiles, use old system permissions
            activePermissions = getUserPermissions(userData.role as Role);
            activeRole = userData.role as BaseRole;
          }
        } else {
          // Fallback to old system
          if (userData.roles && userData.roles.primary) {
            availableRoles.push(userData.roles.primary);
            if (userData.roles.secondary) {
              availableRoles.push(...userData.roles.secondary);
            }
          } else if (userData.role) {
            availableRoles.push(userData.role);
          }
          activeRole = userData.activeRole || userData.role as BaseRole;
          activePermissions = getUserPermissions(activeRole as Role);
        }
        
        setState(prev => ({
          ...prev,
          user: userData,
          userRole: userData.role,
          availableRoles,
          activeRole,
          additionalMenus,
          permissions: activePermissions,
          loading: false
        }));
      };
      loadPermissions();
    } else {
      setState(prev => ({
        ...prev, 
        loading: false
      }));
    }
  }, []);

  // Helper function to get user permissions based on role
  const getUserPermissions = (role: Role): Permission[] => {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    return Array.isArray(permissions) ? [...permissions] : [];
  };

  const login = async (phone: string, password: string) => {
    try {
      if (!phone || !password) {
        throw new Error('Phone and password required');
      }

      // Validate and format phone number
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error || 'Numéro de téléphone invalide');
      }
      
      const formattedPhone = phoneValidation.formattedNumber;
      console.log('Attempting login with:', { phone: formattedPhone, passwordLength: password.length });

      // Try Firebase Auth first (for backward compatibility)
      try {
        await auth.signOut().catch(err => {
          console.log('Firebase signout error (non-critical):', err);
        });
        console.log('Firebase Auth cleared for custom authentication');
      } catch (firebaseError) {
        console.log('Firebase auth operation failed, continuing with custom auth');
      }

      // Check users collection first (includes regular admins, shepherds, ADN)
      const usersQuery = query(
        collection(db, 'users'),
        where('phone', '==', formattedPhone),
        where('status', '==', 'active')
      );
      const usersSnapshot = await getDocs(usersQuery);

      // Check admins collection only for super_admin
      const adminsQuery = query(
        collection(db, 'admins'),
        where('phone', '==', formattedPhone),
        where('role', '==', 'super_admin'),
        where('status', '==', 'active')
      );
      const adminsSnapshot = await getDocs(adminsQuery);

      // Get user data from either collection
      const userDoc = !usersSnapshot.empty ? usersSnapshot.docs[0] : 
                     !adminsSnapshot.empty ? adminsSnapshot.docs[0] : null;

      if (!userDoc) {
        console.error('User profile not found');
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      console.log('User found:', userData.role);
      
      // Verify password based on role - support both old role system and new business profiles
      let isPasswordValid = false;
      
      // Check business profiles first (new system)
      if (userData.businessProfiles && userData.businessProfiles.length > 0) {
        // Check if any business profile matches the password
        for (const profile of userData.businessProfiles) {
          if (profile.type === 'shepherd' || profile.type === 'department_leader' || profile.type === 'family_leader') {
            isPasswordValid = password === DEFAULT_PASSWORDS.SHEPHERD;
          } else if (profile.type === 'adn') {
            isPasswordValid = password === DEFAULT_PASSWORDS.ADN;
          } else if (profile.type === 'admin') {
            isPasswordValid = password === DEFAULT_PASSWORDS.ADMIN;
          }
          
          if (isPasswordValid) {
            console.log('Password validated with business profile:', profile.type);
            break;
          }
        }
      }
      // Fallback to old role system for backward compatibility
      else if (userData.role) {
        if (['shepherd', 'adn', 'department_leader', 'family_leader'].includes(userData.role)) {
          const defaultPassword = userData.role === 'adn' 
            ? DEFAULT_PASSWORDS.ADN 
            : DEFAULT_PASSWORDS.SHEPHERD;
            
          isPasswordValid = password === defaultPassword;
          console.log('Checking default password (legacy):', { role: userData.role, isValid: isPasswordValid });
        } 
        // For admins, use admin password
        else if (userData.role === 'admin') {
          isPasswordValid = password === DEFAULT_PASSWORDS.ADMIN;
          console.log('Checking admin password (legacy):', { isValid: isPasswordValid });
        }
        // For super_admin, use admin password
        else if (userData.role === 'super_admin') {
          isPasswordValid = password === DEFAULT_PASSWORDS.ADMIN;
          console.log('Checking super_admin password (legacy):', { isValid: isPasswordValid });
        }
      }
      
      if (!isPasswordValid) {
        console.error('Invalid password');
        throw new Error('Invalid password');
      }

      // Get permissions based on role or business profiles
      let permissions: Permission[] = [];
      
      if (userData.businessProfiles && userData.businessProfiles.length > 0) {
        // Use new business profiles system - get cumulative permissions
        const activeProfileTypes = userData.businessProfiles
          .filter((profile: any) => profile.isActive)
          .map((profile: any) => profile.type as BusinessProfileType);
        
        if (activeProfileTypes.length === 0) {
          // If no active profiles, activate the first one
          activeProfileTypes.push(userData.businessProfiles[0].type as BusinessProfileType);
        }
        
        permissions = getProfilePermissions(activeProfileTypes[0]) as Permission[];
        console.log('🔍 [AuthContext] Business profile permissions:', {
          activeProfileTypes,
          permissions
        });
      } else {
        // Fallback to old role system
        permissions = getUserPermissions(userData.role as Role);
        console.log('🔍 [AuthContext] Legacy role permissions:', {
          role: userData.role,
          permissions
        });
      }
      
      // Get additional menus if user is a shepherd or intern
      let additionalMenus: string[] = [];
      if (userData.role === 'shepherd') {
        additionalMenus = userData.additionalMenus || [];
      }
      
      // Store user data
      const userToStore = {
        id: userDoc.id,
        uid: userData.uid || userDoc.id,
        role: userData.role as Role,
        additionalMenus,
        ...userData,
        // Ensure dates are serialized properly
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
        lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : userData.lastLoginAt
      };
      
      console.log('🔍 [AuthContext] User data after login:', {
        fullName: userData.fullName,
        role: userToStore.role,
        businessProfiles: userData.businessProfiles,
        additionalMenus: userToStore.additionalMenus,
        hasBusinessProfiles: !!(userData.businessProfiles && userData.businessProfiles.length > 0)
      });
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      
      // Determine available roles - prioritize business profiles
      let availableRoles: BaseRole[] = [];
      let activeRole: BaseRole | null = null;
      
      if (userData.businessProfiles && Array.isArray(userData.businessProfiles)) {
        availableRoles = userData.businessProfiles.map((profile: any) => profile.type as BaseRole);
        
        // Get active profiles
        const activeProfiles = userData.businessProfiles.filter((profile: any) => profile.isActive);
        const activeProfileTypes = activeProfiles.map((profile: any) => profile.type as BusinessProfileType);
        
        if (activeProfileTypes.length > 0) {
          // Set activeRole to shepherd if present, otherwise first active profile
          activeRole = activeProfileTypes.includes('shepherd') ? 'shepherd' : activeProfileTypes[0] as BaseRole;
        } else {
          // No active profiles, use main role
          activeRole = userToStore.role as BaseRole;
        }
      } else {
        // Fallback to old role system
        availableRoles = userData.roles && Array.isArray(userData.roles) 
          ? userData.roles as BaseRole[]
          : [userToStore.role as BaseRole];
        activeRole = userToStore.role as BaseRole;
      }
      
      console.log('🔍 [AuthContext] Roles determined:', {
        availableRoles,
        activeRole,
        permissions
      });
      
      // Update state
      setState(prev => ({
        ...prev,
        user: userToStore,
        userRole: userToStore.role as Role,
        availableRoles,
        activeRole,
        additionalMenus,
        permissions,
        loading: false
      }));

      return userToStore;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      auth.signOut().catch(err => {
        console.log('Firebase signout error (non-critical):', err);
      });
    } catch (e) {
      console.log('Error during signout (non-critical)');
    }
    
    localStorage.removeItem('user');
    setState({
      user: null,
      loading: false,
      userRole: null,
      availableRoles: [],
      activeRole: null,
      additionalMenus: [],
      permissions: [],
      login,
      logout,
      switchRole,
      switchToProfile
    });
    navigate('/login');
  };

  // Switch to single profile function for business profiles
  const switchToProfile = async (profileType: BusinessProfileType) => {
    if (!state.user?.businessProfiles) return;
    
    console.log('🔄 [AuthContext] Switching to profile:', profileType);
    
    try {
      // Set only the selected profile as active
      const updatedProfiles = state.user.businessProfiles.map((profile: any) => ({
        ...profile,
        isActive: profile.type === profileType
      }));
      
      // Get permissions from the single active profile
      const newPermissions = getProfilePermissions(profileType) as Permission[];
      
      // Update user object
      const updatedUser = {
        ...state.user,
        businessProfiles: updatedProfiles
      };
      
      // Update state
      setState(prev => ({
        ...prev,
        user: updatedUser,
        permissions: newPermissions,
        activeRole: profileType as BaseRole
      }));
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      const profileLabel = getRoleLabel(profileType as BaseRole);
      toast.success(`Profil basculé vers: ${profileLabel}`);
    } catch (error) {
      console.error('❌ [AuthContext] Error switching profile:', error);
      toast.error('Erreur lors du changement de profil');
    }
  };

  // Switch role function (updated to handle both old and new systems)
  const switchRole = (newRole: BaseRole | BusinessProfileType) => {
    // For business profiles, use switchToProfile functionality
    if (state.user?.businessProfiles && state.user.businessProfiles.some((p: any) => p.type === newRole)) {
      switchToProfile(newRole as BusinessProfileType);
      return;
    }
    
    // Legacy role switching
    if (!state.availableRoles.includes(newRole as BaseRole)) return;
    
    const newPermissions = getUserPermissions(newRole as Role);
    
    setState(prev => ({
      ...prev,
      activeRole: newRole as BaseRole,
      permissions: newPermissions
    }));
    
    // Store active role in localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...currentUser, activeRole: newRole }));
    
    toast.success(`Basculé vers le rôle: ${getRoleLabel(newRole as BaseRole)}`);
  };

  // Helper function to get role labels
  const getRoleLabel = (role: BaseRole | BusinessProfileType) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrateur';
      case 'shepherd': return 'Berger(e)';
      case 'adn': return 'ADN';
      case 'department_leader': return 'Responsable Département';
      case 'family_leader': return 'Responsable de Famille';
      default: return 'Utilisateur';
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchRole, switchToProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);