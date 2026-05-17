import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_PROFILE_PERMISSIONS } from '../constants';

export function usePermissions(permission: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.perfil === 'admin') return true;
  // Explicit permissions override profile defaults; fall back to profile defaults if not set
  return user.permissions?.[permission] ?? DEFAULT_PROFILE_PERMISSIONS[user.perfil]?.[permission] ?? false;
}
