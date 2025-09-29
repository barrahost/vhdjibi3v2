import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Shield, Settings, Crown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BusinessProfileType, BUSINESS_PROFILE_LABELS, BUSINESS_PROFILE_DESCRIPTIONS, getCumulativePermissions } from '../../types/businessProfile.types';
import type { BusinessProfile } from '../../types/businessProfile.types';

export function MultiProfileSwitcher() {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Only show if user has business profiles
  if (!user?.businessProfiles || user.businessProfiles.length === 0) {
    return null;
  }

  const getProfileIcon = (profileType: BusinessProfileType) => {
    switch (profileType) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'department_leader':
        return <Settings className="w-4 h-4" />;
      case 'adn':
        return <Shield className="w-4 h-4" />;
      case 'shepherd':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const activeProfiles = user.businessProfiles.filter((profile: BusinessProfile) => profile.isActive);
  const activeProfileTypes = activeProfiles.map((profile: BusinessProfile) => profile.type as BusinessProfileType);
  const cumulativePermissions = getCumulativePermissions(activeProfileTypes);

  const getActiveProfilesLabel = () => {
    if (activeProfiles.length === 0) return 'Aucun profil actif';
    if (activeProfiles.length === 1) return BUSINESS_PROFILE_LABELS[activeProfiles[0].type as BusinessProfileType];
    return `${activeProfiles.length} profils actifs`;
  };

  const handleProfileToggle = async (profileType: BusinessProfileType) => {
    await switchRole(profileType);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        {activeProfiles.length === 1 ? (
          getProfileIcon(activeProfiles[0].type as BusinessProfileType)
        ) : (
          <div className="flex -space-x-1">
            {activeProfiles.slice(0, 2).map((profile: BusinessProfile, index: number) => (
              <div key={profile.type} className={`relative ${index > 0 ? 'ml-1' : ''}`}>
                {getProfileIcon(profile.type as BusinessProfileType)}
              </div>
            ))}
            {activeProfiles.length > 2 && (
              <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                +{activeProfiles.length - 2}
              </div>
            )}
          </div>
        )}
        <span className="hidden sm:inline font-medium">
          {getActiveProfilesLabel()}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
              Gestion des profils métier
            </div>
            
            <div className="py-2">
              {user.businessProfiles.map((profile: BusinessProfile) => {
                const isActive = profile.isActive;
                const profileType = profile.type as BusinessProfileType;
                
                return (
                  <button
                    key={profile.type}
                    onClick={() => handleProfileToggle(profileType)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getProfileIcon(profileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {BUSINESS_PROFILE_LABELS[profileType]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {BUSINESS_PROFILE_DESCRIPTIONS[profileType]}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isActive ? (
                        <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-border"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {activeProfiles.length > 0 && (
              <>
                <div className="border-t border-border my-2"></div>
                <div className="px-4 py-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Permissions actives ({cumulativePermissions.length})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Profils actifs combinés donnent accès à toutes les fonctionnalités de vos rôles.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}