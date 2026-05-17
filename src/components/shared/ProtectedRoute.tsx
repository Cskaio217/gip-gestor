import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Aguarda verificação de sessão antes de redirecionar.
  // Sem isso, usuários autenticados seriam enviados ao /login em cada reload.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#1E1E1E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
