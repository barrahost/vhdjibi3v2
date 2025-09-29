import { useState } from 'react';
import { BusinessProfile, BusinessProfileType, BUSINESS_PROFILE_LABELS, BUSINESS_PROFILE_DESCRIPTIONS } from '../../types/businessProfile.types';

interface BusinessProfileAssignmentProps {
  selectedProfiles: BusinessProfile[];
  onChange: (profiles: BusinessProfile[]) => void;
}

export function BusinessProfileAssignment({ selectedProfiles, onChange }: BusinessProfileAssignmentProps) {
  const availableProfileTypes: BusinessProfileType[] = ['shepherd', 'department_leader', 'adn', 'admin'];
  
  const isProfileSelected = (profileType: BusinessProfileType): boolean => {
    return selectedProfiles.some(profile => profile.type === profileType);
  };

  const toggleProfile = (profileType: BusinessProfileType) => {
    if (isProfileSelected(profileType)) {
      // Remove profile
      onChange(selectedProfiles.filter(profile => profile.type !== profileType));
    } else {
      // Add profile
      const newProfile: BusinessProfile = {
        type: profileType,
        isActive: selectedProfiles.length === 0 // First profile is active by default
      };
      onChange([...selectedProfiles, newProfile]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        Sélectionnez les profils métier pour cet utilisateur. Il pourra basculer entre ses profils selon le contexte.
      </div>
      
      <div className="space-y-3 border border-gray-200 rounded-md p-4">
        {availableProfileTypes.map(profileType => (
          <div key={profileType} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={`profile-${profileType}`}
                type="checkbox"
                checked={isProfileSelected(profileType)}
                onChange={() => toggleProfile(profileType)}
                className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={`profile-${profileType}`} className="font-medium text-gray-700">
                {BUSINESS_PROFILE_LABELS[profileType]}
              </label>
              <p className="text-gray-500 mt-1">
                {BUSINESS_PROFILE_DESCRIPTIONS[profileType]}
              </p>
            </div>
          </div>
        ))}
        
        {selectedProfiles.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2">
            Aucun profil sélectionné. L'utilisateur n'aura aucun accès au système.
          </p>
        )}
      </div>
      
      {selectedProfiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="text-sm font-medium text-blue-800 mb-1">
            Profils sélectionnés ({selectedProfiles.length}) :
          </div>
          <div className="text-sm text-blue-700">
            {selectedProfiles.map(profile => BUSINESS_PROFILE_LABELS[profile.type]).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}