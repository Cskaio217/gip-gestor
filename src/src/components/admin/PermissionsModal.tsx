import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { PERM, ALL_PERMS, DEFAULT_PROFILE_PERMISSIONS, type PermKey } from '../../constants';
import type { User } from '../../types';

interface PermissionsModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSave: (permissions: Record<string, boolean>) => void;
}

const PERM_GROUPS: { label: string; perms: { key: PermKey; label: string }[] }[] = [
  {
    label: 'Projetos',
    perms: [
      { key: PERM.PROJECTS_VIEW,   label: 'Visualizar projetos' },
      { key: PERM.PROJECTS_CREATE, label: 'Criar projetos' },
      { key: PERM.PROJECTS_EDIT,   label: 'Editar projetos' },
      { key: PERM.PROJECTS_DELETE, label: 'Mover projetos para lixeira' },
    ],
  },
  {
    label: 'Kanban',
    perms: [
      { key: PERM.KANBAN_EDIT,    label: 'Editar cartões' },
      { key: PERM.KANBAN_COLUMNS, label: 'Gerenciar colunas' },
    ],
  },
  {
    label: 'Usuários',
    perms: [
      { key: PERM.USERS_VIEW,   label: 'Visualizar lista de usuários' },
      { key: PERM.USERS_MANAGE, label: 'Criar e editar usuários' },
    ],
  },
  {
    label: 'Administração',
    perms: [
      { key: PERM.ADMIN_SETTINGS, label: 'Configurações do sistema' },
      { key: PERM.ADMIN_TRASH,    label: 'Lixeira de projetos' },
    ],
  },
];

type Preset = 'admin' | 'consultor' | 'cliente' | 'custom';

function detectPreset(perms: Record<string, boolean>): Preset {
  for (const profile of ['admin', 'consultor', 'cliente'] as const) {
    const defaults = DEFAULT_PROFILE_PERMISSIONS[profile];
    const matches = ALL_PERMS.every((k) => perms[k] === defaults[k]);
    if (matches) return profile;
  }
  return 'custom';
}

export function PermissionsModal({ open, onClose, user, onSave }: PermissionsModalProps) {
  const initialPerms: Record<string, boolean> = {
    ...DEFAULT_PROFILE_PERMISSIONS[user.perfil],
    ...(user.permissions ?? {}),
  };
  const [perms, setPerms] = useState<Record<string, boolean>>(initialPerms);

  const activePreset = detectPreset(perms);

  const applyPreset = (profile: 'admin' | 'consultor' | 'cliente') => {
    setPerms({ ...DEFAULT_PROFILE_PERMISSIONS[profile] });
  };

  const toggle = (key: string) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    onSave(perms);
    onClose();
  };

  const PRESET_LABELS: Record<string, string> = { admin: 'Admin', consultor: 'Consultor', cliente: 'Cliente', custom: 'Personalizado' };

  return (
    <Modal open={open} onClose={onClose} title={`Permissões — ${user.nome}`} size="md">
      <div className="space-y-5">
        {/* Preset buttons */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2">Perfil base</p>
          <div className="flex gap-2 flex-wrap">
            {(['admin', 'consultor', 'cliente', 'custom'] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => p !== 'custom' ? applyPreset(p) : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  activePreset === p
                    ? 'bg-[#CC0000] border-[#CC0000] text-white'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:border-[#CC0000]/50'
                } ${p === 'custom' ? 'cursor-default' : ''}`}
              >
                <Shield size={11} className="inline mr-1" />
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Permission checkboxes */}
        <div className="space-y-4">
          {PERM_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="space-y-1.5">
                {group.perms.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={perms[key] ?? false}
                      onChange={() => toggle(key)}
                      className="w-4 h-4 accent-[#CC0000] cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar permissões</Button>
        </div>
      </div>
    </Modal>
  );
}
