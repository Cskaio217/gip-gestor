import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { StorageService } from '../services/storage';
import { AUTH_KEY } from '../constants';

interface AuthContextValue {
  user: User | null;
  login: (loginStr: string, senha: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isConsultor: boolean;
  isCliente: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (!saved) return null;
      const id = JSON.parse(saved) as string;
      const users = StorageService.getUsers();
      return users.find((u) => u.id === id) ?? null;
    } catch {
      return null;
    }
  });

  const login = (loginStr: string, senha: string): boolean => {
    const users = StorageService.getUsers();
    const found = users.find(
      (u) => u.login === loginStr.trim() && u.senha === senha && u.ativo,
    );
    if (found) {
      setUser(found);
      localStorage.setItem(AUTH_KEY, JSON.stringify(found.id));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.perfil === 'admin',
        isConsultor: user?.perfil === 'consultor',
        isCliente: user?.perfil === 'cliente',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
