import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { supabase } from '../services/supabase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAdmin: boolean
  isConsultor: boolean
  isCliente: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return false

      const meta = data.user.user_metadata ?? {}
      setUser({
        id:             data.user.id,
        nome:           (meta.nome          as string) ?? data.user.email?.split('@')[0] ?? 'Usuário',
        login:          (meta.login         as string) ?? data.user.email?.split('@')[0] ?? '',
        senha:          '',
        email:          data.user.email ?? '',
        cargo:          (meta.cargo         as string) ?? '',
        perfil:         ((meta.perfil       as string) ?? 'consultor') as User['perfil'],
        especialidade:  (meta.especialidade as string) ?? '',
        ativo:          true,
        projectsLinked: [],
        permissions:    {},
      })
      return true
    } finally {
      setLoading(false)
    }
  }

  async function logout(): Promise<void> {
    setUser(null)
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin:     user?.perfil === 'admin',
        isConsultor: user?.perfil === 'consultor',
        isCliente:   user?.perfil === 'cliente',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
