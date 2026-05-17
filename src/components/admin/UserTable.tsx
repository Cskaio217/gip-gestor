import { useState, useEffect } from 'react';
import { Plus, Pencil, PowerOff, Shield } from 'lucide-react';
import { UserModal } from './UserModal';
import { PermissionsModal } from './PermissionsModal';
import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../services/supabase';
import type { User, CreateUserInput } from '../../types';

const PROFILE_LABEL: Record<string, string> = {
  admin: 'Admin',
  consultor: 'Consultor',
  cliente: 'Cliente',
};

const PROFILE_COLOR: Record<string, string> = {
  admin: 'text-[#CC0000] bg-[#CC0000]/10 border-[#CC0000]/20',
  consultor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20',
  cliente: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10 border-green-200 dark:border-green-400/20',
};

function mapProfile(p: Record<string, unknown>): User {
  return {
    id: String(p.id ?? ''),
    nome: String(p.nome ?? ''),
    login: String(p.login ?? p.email ?? ''),
    senha: '',
    email: String(p.email ?? ''),
    cargo: String(p.cargo ?? ''),
    perfil: (p.perfil as User['perfil']) ?? 'consultor',
    especialidade: String(p.especialidade ?? ''),
    ativo: Boolean(p.ativo ?? true),
    projectsLinked: Array.isArray(p.projectsLinked) ? (p.projectsLinked as string[]) : [],
    permissions: (p.permissions as Record<string, boolean>) ?? {},
  };
}

export function UserTable() {
  const { projects } = useData();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | undefined>();
  const [permTarget, setPermTarget] = useState<User | undefined>();

  async function fetchUsers() {
    setLoading(true);
    const { data, error: err } = await supabase.from('profiles').select('*');
    if (err) setError(err.message);
    else setUsers((data ?? []).map(mapProfile));
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (data: CreateUserInput) => {
    setError('');
    setSaving(true);
    try {
      if (editTarget) {
        const { error: err } = await supabase
          .from('profiles')
          .update({
            nome: data.nome,
            login: data.login,
            email: data.email,
            cargo: data.cargo,
            perfil: data.perfil,
            especialidade: data.especialidade,
            projectsLinked: data.projectsLinked,
          })
          .eq('id', editTarget.id);
        if (err) throw new Error(err.message);
        setUsers((prev) =>
          prev.map((u) => u.id === editTarget.id ? { ...u, ...data, senha: '' } : u),
        );
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(data),
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'Erro ao criar usuário');
        await fetchUsers();
      }
      setEditTarget(undefined);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    const { error: err } = await supabase
      .from('profiles')
      .update({ ativo: !u.ativo })
      .eq('id', u.id);
    if (!err) setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, ativo: !x.ativo } : x));
  };

  const updatePermissions = async (permissions: Record<string, boolean>) => {
    if (!permTarget) return;
    const { error: err } = await supabase
      .from('profiles')
      .update({ permissions })
      .eq('id', permTarget.id);
    if (!err) setUsers((prev) => prev.map((u) => u.id === permTarget.id ? { ...u, permissions } : u));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">
          Usuários do sistema
        </h3>
        <Button size="sm" onClick={() => { setEditTarget(undefined); setShowModal(true); }}>
          <Plus size={14} />
          Novo usuário
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 dark:text-white/40 uppercase">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 dark:text-white/40 uppercase hidden md:table-cell">Cargo</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 dark:text-white/40 uppercase">Perfil</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 dark:text-white/40 uppercase hidden sm:table-cell">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-white/30 text-sm">
                  Carregando usuários...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400 dark:text-white/30 text-sm">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.nome} size="md" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{u.nome}</p>
                      <p className="text-xs text-slate-400 dark:text-white/35">{u.email || u.login}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-white/60 hidden md:table-cell">{u.cargo || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${PROFILE_COLOR[u.perfil] ?? ''}`}>
                    {PROFILE_LABEL[u.perfil] ?? u.perfil}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${u.ativo ? 'bg-green-50 dark:bg-green-400/10 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-gray-500/10 text-slate-500 dark:text-gray-400'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setPermTarget(u)}
                      className="p-1.5 text-slate-400 dark:text-white/30 hover:text-[#CC0000] hover:bg-[#CC0000]/10 rounded-lg transition-colors"
                      title="Permissões"
                    >
                      <Shield size={13} />
                    </button>
                    <button
                      onClick={() => { setEditTarget(u); setShowModal(true); }}
                      className="p-1.5 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`p-1.5 rounded-lg transition-colors ${u.ativo ? 'text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10' : 'text-green-500 dark:text-green-400/50 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10'}`}
                    >
                      <PowerOff size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {saving && (
        <p className="text-xs text-slate-400 dark:text-white/40 text-center">Salvando...</p>
      )}

      <UserModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(undefined); }}
        onSave={handleSave}
        projects={projects}
        initial={editTarget}
      />

      {permTarget && (
        <PermissionsModal
          open
          onClose={() => setPermTarget(undefined)}
          user={permTarget}
          onSave={updatePermissions}
        />
      )}
    </div>
  );
}
