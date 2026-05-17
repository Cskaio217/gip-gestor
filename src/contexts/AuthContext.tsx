import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import type { User as AuthUser } from '@supabase/supabase-js'
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

async function fetchProfile(authUser: AuthUser): Promise<User> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    const { data: members } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', authUser.id)
      .is('deleted_at', null)

    if (profile) {
      return {
        id:             profile.id,
        nome:           profile.nome,
        login:          profile.login,
        senha:          '',
        email:          profile.email ?? authUser.email ?? '',
        cargo:          profile.cargo,
        perfil:         profile.perfil as User['perfil'],
        especialidade:  profile.especialidade,
        ativo:          profile.ativo ?? true,
        projectsLinked: (members ?? []).map((m: { project_id: string }) => m.project_id),
        permissions:    profile.permissions ?? {},
      }
    }
  } catch {
    console.log('Perfil não encontrado, continuando sem perfil')
  }

  const meta = authUser.user_metadata ?? {}
  return {
    id:             authUser.id,
    nome:           (meta.nome           as string) ?? authUser.email?.split('@')[0] ?? 'Usuário',
    login:          (meta.login          as string) ?? authUser.email?.split('@')[0] ?? '',
    senha:          '',
    email:          authUser.email ?? '',
    cargo:          (meta.cargo          as string) ?? '',
    perfil:         ((meta.perfil        as string) ?? 'consultor') as User['perfil'],
    especialidade:  (meta.especialidade  as string) ?? '',
    ativo:          true,
    projectsLinked: [],
    permissions:    {},
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized           = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await fetchProfile(session.user)
        setUser(appUser)
      }
      clearTimeout(timeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const appUser = await fetchProfile(session.user)
          setUser(appUser)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('E-mail ou senha inválidos')
    return true
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
