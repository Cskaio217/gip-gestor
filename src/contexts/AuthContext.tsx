import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { signIn as apiSignIn, signOut as apiSignOut, getSessionUser } from '../services/api'
import { supabase } from '../services/supabase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (loginStr: string, senha: string) => Promise<boolean>
  logout: () => Promise<void>
  isAdmin: boolean
  isConsultor: boolean
  isCliente: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restaurar sessão ao carregar
  useEffect(() => {
    getSessionUser().then((u) => {
      setUser(u)
      setLoading(false)
    })

    // Escutar mudanças de sessão (ex: token expirado, login em outra aba)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const u = await getSessionUser()
        setUser(u)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (loginStr: string, senha: string): Promise<boolean> => {
    const found = await apiSignIn(loginStr, senha)
    if (found) {
      setUser(found)
      return true
    }
    return false
  }

  const logout = async (): Promise<void> => {
    await apiSignOut()
    setUser(null)
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
