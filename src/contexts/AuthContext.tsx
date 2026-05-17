import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
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

// Busca perfil do usuário autenticado no Supabase e monta o objeto User da app.
// Chamado tanto no mount quanto em eventos onAuthStateChange.
async function fetchProfile(userId: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (error || !profile || !profile.ativo) return null

  const { data: members } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)
    .is('deleted_at', null)

  return {
    id: profile.id,
    nome: profile.nome,
    login: profile.login,
    senha: '',            // Senha nunca retornada — gerenciada pelo Supabase Auth
    email: profile.email,
    cargo: profile.cargo,
    perfil: profile.perfil as User['perfil'],
    especialidade: profile.especialidade,
    ativo: profile.ativo,
    projectsLinked: (members ?? []).map((m: { project_id: string }) => m.project_id),
    permissions: profile.permissions ?? {},
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurar sessão existente (token salvo pelo SDK no localStorage do browser)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setUser(profile)
      }
      setLoading(false)
    })

    // Reagir a mudanças de sessão: login em outra aba, expiração de token, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setLoading(false)
          return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const profile = await fetchProfile(session.user.id)
          setUser(profile)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })
    if (error || !data.user) return false

    const profile = await fetchProfile(data.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      return false
    }

    setUser(profile)
    return true
  }

  const logout = async (): Promise<void> => {
    setUser(null)               // Limpa imediatamente — permite navigate() sem await no chamador
    await supabase.auth.signOut() // Invalida token no servidor
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
