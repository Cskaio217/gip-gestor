import { useState, useRef, type ChangeEvent } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, Check, X, Upload } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input, Textarea } from '../shared/Input';
import { Select } from '../shared/Select';
import type { Project, Label, Card, ProjectStatus } from '../../types';
import type { User } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatDate } from '../../utils/date';
import { PROJECT_STATUS_LIST } from '../../constants';

type SettingsTab = 'labels' | 'archived' | 'info';

const LABEL_PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#A855F7', '#EC4899', '#0EA5E9',
  '#14B8A6', '#CC0000', '#374151', '#1D4ED8',
];

interface ProjectSettingsProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  users: User[];
}

// ── Labels Tab ─────────────────────────────────────────────────────────────────

function LabelsTab({ project }: { project: Project }) {
  const { addLabel, updateLabel, deleteLabel } = useData();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_PRESET_COLORS[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const labels: Label[] = project.labels ?? [];

  const labelUsageCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const col of project.columns) {
      for (const card of col.cards) {
        if (card.labelId) counts[card.labelId] = (counts[card.labelId] ?? 0) + 1;
      }
    }
    return counts;
  };

  const usageCounts = labelUsageCounts();

  const startEdit = (l: Label) => {
    setEditId(l.id);
    setEditName(l.name);
    setEditColor(l.color);
  };

  const saveEdit = () => {
    if (!editId || !editName.trim()) return;
    updateLabel(project.id, editId, editName.trim(), editColor);
    setEditId(null);
  };

  const handleDelete = (l: Label) => {
    const count = usageCounts[l.id] ?? 0;
    const msg = count > 0
      ? `A etiqueta "${l.name}" está em uso em ${count} card(s). Excluir mesmo assim?`
      : `Excluir etiqueta "${l.name}"?`;
    if (confirm(msg)) deleteLabel(project.id, l.id);
  };

  return (
    <div className="space-y-4">
      {/* Label list */}
      {labels.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-white/30 italic">Nenhuma etiqueta criada neste projeto.</p>
      ) : (
        <div className="space-y-2">
          {labels.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
              {editId === l.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#CC0000]/50"
                  />
                  <div className="flex gap-1">
                    {LABEL_PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${editColor === c ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-white scale-110' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={saveEdit} className="text-green-500 hover:text-green-600 transition-colors"><Check size={15} /></button>
                  <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60 transition-colors"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <span className="flex-1 text-sm text-slate-700 dark:text-white/80">{l.name}</span>
                  {(usageCounts[l.id] ?? 0) > 0 && (
                    <span className="text-xs text-slate-400 dark:text-white/30">{usageCounts[l.id]} card{usageCounts[l.id] !== 1 ? 's' : ''}</span>
                  )}
                  <button onClick={() => startEdit(l)} className="p-1 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(l)} className="p-1 text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new label */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-3">
        <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase tracking-wide">Nova etiqueta</p>
        <Input
          placeholder="Nome da etiqueta (ex: Urgente)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <div>
          <p className="text-xs text-slate-400 dark:text-white/40 mb-2">Cor</p>
          <div className="flex flex-wrap gap-2">
            {LABEL_PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-white scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <Button
          size="sm"
          disabled={!newName.trim()}
          onClick={() => { addLabel(project.id, newName.trim(), newColor); setNewName(''); }}
        >
          <Plus size={14} />
          Criar etiqueta
        </Button>
      </div>
    </div>
  );
}

// ── Archived Cards Tab ─────────────────────────────────────────────────────────

function ArchivedTab({ project }: { project: Project }) {
  const { updateCard, deleteCard } = useData();

  const archivedCards: Array<{ card: Card; columnId: string; columnTitle: string }> = [];
  for (const col of project.columns) {
    for (const card of col.cards) {
      if (card.archived) {
        archivedCards.push({ card, columnId: col.id, columnTitle: col.title });
      }
    }
  }

  const handleRestore = (card: Card, columnId: string) => {
    updateCard(project.id, columnId, card.id, { archived: false, archivedAt: '' });
  };

  const handleDelete = (card: Card, columnId: string) => {
    if (confirm(`Excluir permanentemente "${card.title}"?`)) {
      deleteCard(project.id, columnId, card.id);
    }
  };

  if (archivedCards.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-white/30 italic">Nenhum card arquivado neste projeto.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-white/5">
            <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400 dark:text-white/40 uppercase">Título</th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400 dark:text-white/40 uppercase hidden sm:table-cell">Coluna</th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400 dark:text-white/40 uppercase hidden md:table-cell">Entrega</th>
            <th className="text-left py-2 pr-4 text-xs font-medium text-slate-400 dark:text-white/40 uppercase hidden lg:table-cell">Arquivado em</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {archivedCards.map(({ card, columnId, columnTitle }) => (
            <tr key={card.id} className="border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
              <td className="py-3 pr-4">
                <p className="font-medium text-slate-800 dark:text-white/80 line-clamp-1">{card.title}</p>
              </td>
              <td className="py-3 pr-4 text-slate-500 dark:text-white/40 hidden sm:table-cell">{columnTitle}</td>
              <td className="py-3 pr-4 text-slate-500 dark:text-white/40 hidden md:table-cell">
                {card.dataEntrega ? formatDate(card.dataEntrega) : '—'}
              </td>
              <td className="py-3 pr-4 text-slate-500 dark:text-white/40 hidden lg:table-cell">
                {card.archivedAt ? formatDate(card.archivedAt) : '—'}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => handleRestore(card, columnId)}
                    className="p-1.5 text-green-500 dark:text-green-400/70 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10 rounded-lg transition-colors"
                    title="Restaurar"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(card, columnId)}
                    className="p-1.5 text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Excluir permanentemente"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Info Tab ───────────────────────────────────────────────────────────────────

function InfoTab({ project, users }: { project: Project; users: User[] }) {
  const { updateProject } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const consultores = users.filter((u) => u.perfil !== 'cliente' && u.ativo);

  const [form, setForm] = useState({
    nome: project.nome,
    cliente: project.cliente,
    produto: project.produto,
    status: project.status as ProjectStatus,
    dataInicio: project.dataInicio,
    dataFim: project.dataFim,
    responsavelId: project.responsavelId,
    descricao: project.descricao,
    clientLogo: project.clientLogo ?? '',
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('clientLogo', (ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProject(project.id, form);
  };

  return (
    <div className="space-y-4">
      {/* Logo */}
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-2">Logo do cliente</p>
        <div className="flex items-center gap-4">
          {form.clientLogo ? (
            <div className="relative">
              <img src={form.clientLogo} alt="Logo" className="w-14 h-14 rounded-xl object-contain border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1" />
              <button type="button" onClick={() => set('clientLogo', '')} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"><X size={10} /></button>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/20 flex items-center justify-center text-slate-300 dark:text-white/20"><Upload size={18} /></div>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload size={13} />
            {form.clientLogo ? 'Trocar' : 'Upload'}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input label="Nome do cliente" value={form.cliente} onChange={(e) => set('cliente', e.target.value)} />
        </div>
        <div className="col-span-2">
          <Input label="Nome do projeto" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        </div>
        <Input label="Produto" value={form.produto} onChange={(e) => set('produto', e.target.value)} />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
          options={PROJECT_STATUS_LIST.map((s) => ({ value: s, label: s }))}
        />
        <Input label="Início" type="date" value={form.dataInicio} onChange={(e) => set('dataInicio', e.target.value)} />
        <Input label="Término previsto" type="date" value={form.dataFim} onChange={(e) => set('dataFim', e.target.value)} />
        <div className="col-span-2">
          <Select
            label="Responsável"
            value={form.responsavelId}
            onChange={(e) => set('responsavelId', e.target.value)}
            placeholder="Selecione o responsável"
            options={consultores.map((u) => ({ value: u.id, label: `${u.nome} — ${u.especialidade}` }))}
          />
        </div>
        <div className="col-span-2">
          <Textarea label="Descrição" value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={3} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave}>Salvar informações</Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const TAB_LABELS: Record<SettingsTab, string> = {
  labels: 'Etiquetas',
  archived: 'Cards Arquivados',
  info: 'Informações do Projeto',
};

export function ProjectSettings({ open, onClose, project, users }: ProjectSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('labels');

  return (
    <Modal open={open} onClose={onClose} title="Configurações do Projeto" size="xl">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 mb-6 w-fit">
        {(Object.keys(TAB_LABELS) as SettingsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-[#CC0000] text-white shadow'
                : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'labels' && <LabelsTab project={project} />}
      {tab === 'archived' && <ArchivedTab project={project} />}
      {tab === 'info' && <InfoTab project={project} users={users} />}
    </Modal>
  );
}

