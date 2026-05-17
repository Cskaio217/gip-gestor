import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Logo } from '../shared/Logo';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const [loginStr, setLoginStr] = useState('');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const ok = login(loginStr, senha);
    if (ok) {
      navigate(from, { replace: true });
    } else {
      setError('Usuário ou senha inválidos.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#1E1E1E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit'] tracking-tight">
            GIP
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-sm mt-1 font-['DM_Sans']">Gestão Interna de Projetos</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white font-['Outfit'] mb-6">
            Acesso ao sistema
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 mt-[13px]" />
              <Input
                label="Usuário"
                type="text"
                value={loginStr}
                onChange={(e) => setLoginStr(e.target.value)}
                placeholder="Seu login"
                className="pl-9"
                autoComplete="username"
                required
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 mt-[13px]" />
              <Input
                label="Senha"
                type={showPwd ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="pl-9 pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 bottom-2 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70 transition-colors"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 dark:text-white/20 mt-6">
            GIP © {new Date().getFullYear()} — Gestão Interna de Projetos
          </p>
        </div>
      </div>
    </div>
  );
}


