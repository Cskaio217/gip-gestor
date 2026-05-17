import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
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

// Monta o User da app a partir do usuário autenticado do Supabase.
// maybeSingle() não lança erro quando a linha não existe.
// Fallback para metadados do auth se o perfil ainda não foi criado.
async function buildUser(authUser: AuthUser): Promise<User> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  const meta = authUser.user_metadata ?? {}

  if (!profile) {
    return {
      id:            authUser.id,
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
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Impede dupla inicialização no React 18 StrictMode (dev).
  // Em produção (GitHub Pages) useEffect só roda uma vez — sem impacto.
  const initialized = useRef(false)

  // Referência ao timeout de segurança para poder cancelá-lo quando
  // onAuthStateChange responder antes dos 3 segundos.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Timeout de segurança: desbloqueia o loading após 3s caso o Supabase
    // não responda (rede lenta, URL errada, etc.).
    timeoutRef.current = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // onAuthStateChange é a ÚNICA fonte de verdade sobre a sessão.
    // Dispara INITIAL_SESSION imediatamente com a sessão atual (ou null),
    // eliminando a necessidade de chamar getSession() separadamente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Cancelar o timeout de segurança — já temos resposta
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        if (!session?.user) {
          setUser(null)
          setLoading(false)
          return
        }

        const appUser = await buildUser(session.user)
        setUser(appUser)
        setLoading(false)
      }
    )

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    // ETAPA 1 — Autenticar com Supabase Auth.
    // false apenas se as credenciais estiverem erradas.
    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: senha,
    })
    if (error) return false

    // ETAPA 2 — onAuthStateChange dispara SIGNED_IN e chama buildUser().
    // Não duplicamos a busca de perfil aqui.
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
