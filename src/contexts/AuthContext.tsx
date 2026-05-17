import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { signIn as apiSignIn, signOut as apiSignOut, getSessionUser } from '../services/api'
import { supabase } from '../services/supabase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => Promise<void>
  isAdmin: boolean
  isConsultor: boolean
  isCliente: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurar sessão existente ao carregar
    getSessionUser().then((u) => {
      setUser(u)
      setLoading(false)
    })

    // Sincronizar com mudanças de sessão (outra aba, token expirado)
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

  const login = async (email: string, senha: string): Promise<boolean> => {
    const found = await apiSignIn(email, senha)
    if (found) {
      setUser(found)
      return true
    }
    return false
  }

  const logout = async (): Promise<void> => {
    setUser(null)      // Imediato — limpa antes do async para que navigate() no App funcione sem await
    await apiSignOut() // Invalida token no servidor em background
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
