import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { LoginForm } from './components/auth/LoginForm';
import { ProjectList } from './components/dashboard/ProjectList';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { UserTable } from './components/admin/UserTable';
import { GeneralSettings } from './components/admin/GeneralSettings';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { Logo } from './components/shared/Logo';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './contexts/ThemeContext';
import { usePermissions } from './hooks/usePermissions';
import { PERM } from './constants';
import { Avatar } from './components/shared/Avatar';

type AdminTab = 'users' | 'settings';

function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const canAdmin = usePermissions(PERM.ADMIN_SETTINGS);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex-shrink-0 h-14 bg-white dark:bg-[#1E1E1E] border-b border-slate-200 dark:border-white/10 px-6 flex items-center justify-between gap-4 shadow-sm dark:shadow-none">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5">
        <Logo size="md" showText />
      </button>

      {user && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            title="Dashboard"
          >
            <LayoutDashboard size={16} />
          </button>

          {canAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              title="Administração"
            >
              <Settings size={16} />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-200 dark:border-white/10">
            <Avatar name={user.nome} size="sm" />
            <span className="text-xs text-slate-600 dark:text-white/60 hidden sm:block">{user.nome}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#1E1E1E]">
      <AppHeader />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();

  // Clientes são redirecionados direto para o projeto vinculado
  if (user?.perfil === 'cliente' && (user.projectsLinked?.length ?? 0) > 0) {
    return <Navigate to={`/projeto/${user.projectsLinked[0]}`} replace />;
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">Projetos</h2>
        <p className="text-sm text-slate-400 dark:text-white/40 mt-1">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
      <ProjectList />
    </div>
  );
}

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const showCalendar = location.pathname.endsWith('/calendario');

  if (!id) return <Navigate to="/dashboard" replace />;
  return (
    <div className="h-full overflow-hidden">
      <KanbanBoard projectId={id} showCalendar={showCalendar} />
    </div>
  );
}

function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('users');
  const canAdmin = usePermissions(PERM.ADMIN_SETTINGS);

  if (!canAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Outfit']">Administração</h2>
        <p className="text-sm text-slate-400 dark:text-white/40 mt-1">Gerencie usuários e configurações do sistema.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
        {(['users', 'settings'] as AdminTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-[#CC0000] text-white shadow' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            {t === 'users' ? 'Usuários' : 'Configurações'}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UserTable /> : <GeneralSettings />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
        <Route
          path="/projeto/:id"
          element={
            <AppShell>
              <ProjectPage />
            </AppShell>
          }
        />
        <Route
          path="/projeto/:id/calendario"
          element={
            <AppShell>
              <ProjectPage />
            </AppShell>
          }
        />
        <Route
          path="/projeto/:id/configuracoes"
          element={
            <AppShell>
              <ProjectPage />
            </AppShell>
          }
        />
        <Route
          path="/admin"
          element={
            <AppShell>
              <div className="h-full overflow-y-auto">
                <AdminPanel />
              </div>
            </AppShell>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
