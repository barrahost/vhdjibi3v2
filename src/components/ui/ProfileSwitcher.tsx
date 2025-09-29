import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Shield, Settings, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BusinessProfileType, BUSINESS_PROFILE_LABELS, BUSINESS_PROFILE_DESCRIPTIONS, getProfilePermissions } from '../../types/businessProfile.types';
import type { BusinessProfile } from '../../types/businessProfile.types';

export function ProfileSwitcher() {
  const { user, switchToProfile } = useAuth();
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

  const activeProfile = user.businessProfiles.find((profile: BusinessProfile) => profile.isActive);
  const activeProfileType = activeProfile?.type as BusinessProfileType;
  const activeProfilePermissions = activeProfileType ? getProfilePermissions(activeProfileType) : [];

  const handleProfileSwitch = async (profileType: BusinessProfileType) => {
    await switchToProfile(profileType);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        {activeProfile && getProfileIcon(activeProfileType)}
        <span className="hidden sm:inline font-medium">
          {activeProfile ? BUSINESS_PROFILE_LABELS[activeProfileType] : 'Aucun profil actif'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
              Sélectionner un profil
            </div>
            
            <div className="py-2">
              {user.businessProfiles.map((profile: BusinessProfile) => {
                const isActive = profile.isActive;
                const profileType = profile.type as BusinessProfileType;
                
                return (
                  <button
                    key={profile.type}
                    onClick={() => handleProfileSwitch(profileType)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                      isActive ? 'bg-primary/10 border-r-2 border-primary' : ''
                    }`}
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
                      <input
                        type="radio"
                        checked={isActive}
                        onChange={() => {}}
                        className="w-4 h-4 text-primary border-border focus:ring-primary"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {activeProfile && (
              <>
                <div className="border-t border-border my-2"></div>
                <div className="px-4 py-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Permissions du profil actuel ({activeProfilePermissions.length})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {BUSINESS_PROFILE_DESCRIPTIONS[activeProfileType]}
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