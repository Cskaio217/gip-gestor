import type { User, UserProfile } from '../types';

/** Returns true if the user has any of the specified profiles */
export function hasProfile(user: User | null, ...profiles: UserProfile[]): boolean {
  if (!user) return false;
  return profiles.includes(user.perfil);
}

export const canManageProjects = (user: User | null): boolean =>
  hasProfile(user, 'admin', 'consultor');

export const canManageUsers = (user: User | null): boolean =>
  hasProfile(user, 'admin');

export const canViewProject = (user: User | null, projectId: string): boolean => {
  if (!user) return false;
  if (hasProfile(user, 'admin', 'consultor')) return true;
  return user.projectsLinked.includes(projectId);
};

export const canEditCard = (user: User | null): boolean =>
  hasProfile(user, 'admin', 'consultor');
