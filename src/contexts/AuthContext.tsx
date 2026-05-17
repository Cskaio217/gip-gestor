import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../services/supabase'
import { StorageService } from '../services/storage'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isConsultor: boolean
  isCliente: boolean
  login: (email: string, password: string) => Promise<unknown>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session on mount — Supabase persists the token; we look up the
    // matching app profile from localStorage so components get the right shape.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const users = StorageService.getUsers()
        const profile = users.find((u) => u.email === session.user.email) ?? null
        setUser(profile)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string) {
    setLoading(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, password }),
        },
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'E-mail ou senha inválidos')

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      // Prefer the profile returned by the edge function; fall back to
      // looking it up locally so all expected fields are guaranteed.
      const profile: User = data.profile ?? StorageService.getUsers().find(
        (u) => u.email === email,
      ) ?? null

      setUser(profile ? { ...profile, projectsLinked: profile.projectsLinked ?? [] } : null)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.perfil === 'admin',
        isConsultor: user?.perfil === 'consultor',
        isCliente: user?.perfil === 'cliente',
        login,
        logout,
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
