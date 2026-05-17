import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../services/supabase'
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

function buildMinimalUser(id: string, email: string): User {
  return {
    id,
    nome: email.split('@')[0] ?? 'Usuário',
    email,
    login: email,
    senha: '',
    cargo: '',
    especialidade: '',
    perfil: 'admin',
    ativo: true,
    permissions: {},
    projectsLinked: [],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const minimalUser = buildMinimalUser(
          session.user.id,
          session.user.email ?? '',
        )
        setUser(minimalUser)
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

      const profile: User = data.profile ?? buildMinimalUser(
        data.user?.id ?? '',
        data.user?.email ?? email,
      )

      setUser({ ...profile, projectsLinked: profile.projectsLinked ?? [] })
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
