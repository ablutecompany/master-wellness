import { UserProfile, HouseholdMember } from '../store/state-types';

/**
 * Returns an array of selectable profiles, always starting with the main user ("Eu"),
 * followed by any non-archived household members.
 * The primary profile uses the user's ID to prevent duplication.
 */
export const getAllSelectableProfiles = (
  user: UserProfile | null,
  householdMembers: HouseholdMember[] | undefined | null
) => {
  const profiles = [];

  // 1. Primary User
  if (user) {
    profiles.push({
      id: user.id,
      name: user.name || 'Eu',
      isPrimary: true,
      relationship: 'self',
      dateOfBirth: user.dateOfBirth,
      sex: user.sex,
      avatarUrl: user.avatarUrl,
    });
  }

  // 2. Household Members (not archived)
  if (householdMembers && Array.isArray(householdMembers)) {
    const activeMembers = householdMembers.filter(m => !m.archived);
    activeMembers.forEach(m => {
      profiles.push({
        id: m.id,
        name: m.name,
        isPrimary: false,
        relationship: m.relationship,
        dateOfBirth: m.dateOfBirth,
        sex: m.sex,
        avatarUrl: m.avatarUrl,
        heightCm: m.heightCm,
        weightKg: m.weightKg,
      });
    });
  }

  return profiles;
};

/**
 * Returns the currently active profile context based on activeMemberId.
 */
export const getActiveMemberContext = (
  activeMemberId: string | null,
  user: UserProfile | null,
  householdMembers: HouseholdMember[] | undefined | null
) => {
  const all = getAllSelectableProfiles(user, householdMembers);
  const active = all.find(p => p.id === activeMemberId) || all[0];
  
  if (!active) return null;

  return {
    activeMemberId: active.id,
    activeMemberName: active.name,
    activeMemberAge: calculateAge(active.dateOfBirth),
    activeMemberSex: active.sex || 'Não especificado',
    activeMemberRelationship: active.relationship,
  };
};

function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
