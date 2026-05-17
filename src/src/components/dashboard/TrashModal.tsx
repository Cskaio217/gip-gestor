import { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

interface TrashModalProps {
  open: boolean;
  onClose: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function TrashModal({ open, onClose }: TrashModalProps) {
  const { projects, users, restoreProject, deleteProject } = useData();
  const { user } = useAuth();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [emptyText, setEmptyText] = useState('');

  const trashed = projects.filter((p) => !!p.deletedAt);

  const isExpired = (deletedAt: string) =>
    Date.now() - new Date(deletedAt).getTime() > THIRTY_DAYS_MS;

  const deletedByName = (id?: string) => {
    if (!id) return '—';
    return users.find((u) => u.id === id)?.nome ?? '—';
  };

  const handlePermanentDelete = (id: string) => {
    if (confirmText.trim().toUpperCase() !== 'CONFIRMAR') return;
    deleteProject(id);
    setConfirmId(null);
    setConfirmText('');
  };

  const handleEmptyTrash = () => {
    if (emptyText.trim().toUpperCase() !== 'CONFIRMAR') return;
    trashed.forEach((p) => deleteProject(p.id));
    setEmptyConfirm(false);
    setEmptyText('');
  };

  const isAdmin = user?.perfil === 'admin';

  return (
    <Modal open={open} onClose={onClose} title="Lixeira de Projetos" size="lg">
      <div className="space-y-4">
        {trashed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300 dark:text-white/20">
            <Trash2 size={40} strokeWidth={1} />
            <p className="mt-3 text-sm">A lixeira está vazia</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trashed.map((p) => {
              const expired = isExpired(p.deletedAt!);
              const isConfirming = confirmId === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    expired
                      ? 'border-orange-200 dark:border-orange-400/20 bg-orange-50 dark:bg-orange-400/5'
                      : 'border-slate-200 dark:border-white/8 bg-white dark:bg-[#2D2D2D]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Logo / initials */}
                    <div className="w-9 h-9 rounded-lg bg-[#CC0000]/10 dark:bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                      {p.clientLogo ? (
                        <img src={p.clientLogo} alt={p.cliente} className="w-9 h-9 rounded-lg object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-[#CC0000]">{p.cliente.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 dark:text-white text-sm truncate">{p.nome}</span>
                        {expired && (
                          <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle size={11} />
                            Mais de 30 dias
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{p.produto}</p>
                      <p className="text-xs text-slate-400 dark:text-white/30 mt-1">
                        Excluído em {p.deletedAt ? formatDate(p.deletedAt) : '—'} por {deletedByName(p.deletedBy)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => restoreProject(p.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 dark:text-white/50 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10 border border-slate-200 dark:border-white/10 hover:border-green-200 dark:hover:border-green-400/20 rounded-lg px-2.5 py-1.5 transition-all"
                        title="Restaurar projeto"
                      >
                        <RotateCcw size={12} />
                        Restaurar
                      </button>
                      <button
                        onClick={() => { setConfirmId(p.id); setConfirmText(''); }}
                        className="flex items-center gap-1 text-xs text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 border border-slate-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-400/20 rounded-lg px-2.5 py-1.5 transition-all"
                        title="Excluir permanentemente"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Permanent delete confirmation */}
                  {isConfirming && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
                      <p className="text-xs text-slate-500 dark:text-white/50">
                        Digite <strong>CONFIRMAR</strong> para excluir permanentemente:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="CONFIRMAR"
                          className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:border-red-400/50"
                        />
                        <button
                          onClick={() => handlePermanentDelete(p.id)}
                          disabled={confirmText.trim().toUpperCase() !== 'CONFIRMAR'}
                          className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="p-1.5 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
          <p className="text-xs text-slate-400 dark:text-white/30">
            {trashed.length} {trashed.length === 1 ? 'projeto' : 'projetos'} na lixeira
          </p>
          <div className="flex gap-2">
            {isAdmin && trashed.length > 0 && (
              emptyConfirm ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={emptyText}
                    onChange={(e) => setEmptyText(e.target.value)}
                    placeholder="CONFIRMAR"
                    className="w-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none"
                  />
                  <button
                    onClick={handleEmptyTrash}
                    disabled={emptyText.trim().toUpperCase() !== 'CONFIRMAR'}
                    className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Confirmar
                  </button>
                  <button onClick={() => setEmptyConfirm(false)} className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white">
                    Cancelar
                  </button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => { setEmptyConfirm(true); setEmptyText(''); }}>
                  <Trash2 size={13} />
                  Esvaziar lixeira
                </Button>
              )
            )}
            <Button variant="secondary" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
