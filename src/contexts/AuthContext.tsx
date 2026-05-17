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
    perfil: 'consultor',
    ativo: true,
    permissions: {},
    projectsLinked: [],
  }
}

function mapSupabaseProfile(p: Record<string, unknown>, fallbackEmail: string): User {
  return {
    id: String(p.id ?? ''),
    nome: String(p.nome ?? fallbackEmail.split('@')[0] ?? 'Usuário'),
    email: String(p.email ?? fallbackEmail),
    login: String(p.login ?? p.email ?? fallbackEmail),
    senha: '',
    cargo: String(p.cargo ?? ''),
    especialidade: String(p.especialidade ?? ''),
    perfil: (p.perfil as User['perfil']) ?? 'consultor',
    ativo: Boolean(p.ativo ?? true),
    permissions: (p.permissions as Record<string, boolean>) ?? {},
    projectsLinked: Array.isArray(p.projectsLinked) ? (p.projectsLinked as string[]) : [],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email ?? ''
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser(
          profileData
            ? mapSupabaseProfile(profileData as Record<string, unknown>, email)
            : buildMinimalUser(session.user.id, email),
        )
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
