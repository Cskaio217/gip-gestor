import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as AuthUser } from '@supabase/supabase-js'
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

// Monta o objeto User da app a partir do usuário autenticado.
// Usa maybeSingle() — não lança erro quando o perfil ainda não existe.
// Se não houver perfil na tabela, faz fallback nos metadados do Supabase Auth.
async function buildUser(authUser: AuthUser): Promise<User> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()                     // ← nunca lança erro por 0 linhas

  const meta = authUser.user_metadata ?? {}

  if (!profile) {
    // Perfil ainda não existe na tabela (seed não rodou, trigger pendente…)
    // Usa metadados do auth como fallback para não bloquear o acesso.
    return {
      id: authUser.id,
      nome:          (meta.nome          as string) ?? authUser.email?.split('@')[0] ?? 'Usuário',
      login:         (meta.login         as string) ?? authUser.email?.split('@')[0] ?? '',
      senha:         '',
      email:         authUser.email ?? '',
      cargo:         (meta.cargo         as string) ?? '',
      perfil:       ((meta.perfil        as string) ?? 'consultor') as User['perfil'],
      especialidade: (meta.especialidade as string) ?? '',
      ativo:         true,
      projectsLinked: [],
      permissions:   {},
    }
  }

  const { data: members } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', authUser.id)
    .is('deleted_at', null)

  return {
    id:            profile.id,
    nome:          profile.nome,
    login:         profile.login,
    senha:         '',
    email:         profile.email ?? authUser.email ?? '',
    cargo:         profile.cargo,
    perfil:        profile.perfil as User['perfil'],
    especialidade: profile.especialidade,
    ativo:         profile.ativo ?? true,
    projectsLinked: (members ?? []).map((m: { project_id: string }) => m.project_id),
    permissions:   profile.permissions ?? {},
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange é a ÚNICA fonte de verdade sobre sessão.
    // Dispara INITIAL_SESSION imediatamente com a sessão atual (ou null).
    // Isso elimina a race condition de chamar getSession() em paralelo.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null)
          setLoading(false)
          return
        }
        // INITIAL_SESSION, SIGNED_IN e TOKEN_REFRESHED com sessão válida
        const appUser = await buildUser(session.user)
        setUser(appUser)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    // ETAPA 1 — Autenticar com Supabase Auth.
    // Retorna false apenas se as credenciais estiverem erradas.
    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: senha,
    })

    if (error) return false

    // ETAPA 2 — O onAuthStateChange dispara SIGNED_IN e chama buildUser().
    // Não buscamos o perfil aqui para evitar chamada duplicada.
    return true
  }

  const logout = async (): Promise<void> => {
    setUser(null)                  // Imediato — permite navigate() sem await
    await supabase.auth.signOut()  // Invalida token no servidor
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
