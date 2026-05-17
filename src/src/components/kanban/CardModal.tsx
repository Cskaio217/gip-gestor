import { useState, useRef, type ChangeEvent } from 'react';
import { Trash2, Archive, Calendar, Tag, Palette, Image, Plus, X, Check } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { Checklist } from './Checklist';
import { LinkList } from './LinkList';
import { CommentList } from './CommentList';
import type { Card, User, Label } from '../../types';
import { formatDate, isOverdue } from '../../utils/date';
import { useData } from '../../contexts/DataContext';

// ── Card cover colors (Trello-style palette aligned to GDR brand) ─────────────

const CARD_COLORS = [
  '#CC0000', // GDR red
  '#0F3460', // GDR deep blue
  '#2D2D2D', // GDR navy
  '#1A6B3A', // forest green
  '#7C3AED', // violet
  '#DB7C00', // amber
  '#0E7490', // teal
  '#BE185D', // pink
  '#374151', // slate
  '#1D4ED8', // blue
];

// ── Default label colors for new labels ──────────────────────────────────────

const LABEL_PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#A855F7', '#EC4899', '#0EA5E9',
  '#14B8A6', '#CC0000',
];

interface CardModalProps {
  card: Card;
  columnId: string;
  projectId: string;
  users: User[];
  labels: Label[];
  currentUser: User;
  onUpdate: (patch: Partial<Card>) => void;
  onDelete: () => void;
  onAddComment: (text: string) => void;
  onAddChecklistItem: (text: string) => void;
  onToggleChecklist: (id: string) => void;
  onDeleteChecklist: (id: string) => void;
  onAddLink: (title: string, url: string) => void;
  onDeleteLink: (id: string) => void;
  onClose: () => void;
  open: boolean;
  canEdit: boolean;
}

export function CardModal({
  card,
  projectId,
  users,
  labels,
  currentUser,
  onUpdate,
  onDelete,
  onAddComment,
  onAddChecklistItem,
  onToggleChecklist,
  onDeleteChecklist,
  onAddLink,
  onDeleteLink,
  onClose,
  open,
  canEdit,
}: CardModalProps) {
  const { addLabel } = useData();
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(card.title);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_PRESET_COLORS[0]);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const overdue = card.dataEntrega && isOverdue(card.dataEntrega) && !card.archived;
  const activeLabel = labels.find((l) => l.id === card.labelId);

  const handleTitleBlur = () => {
    setEditTitle(false);
    if (titleVal.trim() && titleVal !== card.title) {
      onUpdate({ title: titleVal.trim() });
    }
  };

  const handleCoverUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({ coverImage: (ev.target?.result as string) ?? '' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do card" size="xl">
      {/* Cover image strip */}
      {card.coverImage && (
        <div className="relative -mx-6 -mt-4 mb-4 h-32">
          <img src={card.coverImage} alt="" className="w-full h-full object-cover" />
          {canEdit && (
            <button
              onClick={() => onUpdate({ coverImage: '' })}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Color banner strip (when no cover) */}
      {!card.coverImage && card.cardColor && (
        <div
          className="relative -mx-6 -mt-4 mb-4 h-10 flex items-center justify-end px-4"
          style={{ backgroundColor: card.cardColor }}
        >
          {canEdit && (
            <button
              onClick={() => onUpdate({ cardColor: '' })}
              className="w-6 h-6 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-5">
          {/* Title */}
          {editTitle && canEdit ? (
            <input
              autoFocus
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
              className="w-full text-xl font-semibold text-slate-900 dark:text-white bg-transparent border-b border-[#CC0000] focus:outline-none pb-1 font-['Outfit']"
            />
          ) : (
            <h3
              className={`text-xl font-semibold text-slate-900 dark:text-white font-['Outfit'] transition-colors ${canEdit ? 'cursor-pointer hover:text-[#CC0000]' : 'cursor-default'}`}
              onClick={() => canEdit && setEditTitle(true)}
            >
              {card.title}
            </h3>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-1.5">Descrição</p>
            {canEdit ? (
              <textarea
                value={card.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Descreva esta tarefa, adicione contexto, links, detalhes..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#CC0000]/50 resize-none transition-colors"
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-white/60 whitespace-pre-wrap">
                {card.description || <span className="italic text-slate-300 dark:text-white/20">Sem descrição</span>}
              </p>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5" />

          {/* Checklist */}
          <Checklist
            items={card.checklist}
            onAdd={onAddChecklistItem}
            onToggle={onToggleChecklist}
            onDelete={onDeleteChecklist}
            readonly={!canEdit}
          />

          <div className="h-px bg-slate-100 dark:bg-white/5" />

          {/* Links */}
          <LinkList
            links={card.links}
            onAdd={onAddLink}
            onDelete={onDeleteLink}
            readonly={!canEdit}
          />

          <div className="h-px bg-slate-100 dark:bg-white/5" />

          {/* Comments */}
          <CommentList
            comments={card.comments}
            currentUserId={currentUser.id}
            currentUserName={currentUser.nome}
            onAdd={onAddComment}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Responsável */}
          {canEdit ? (
            <Select
              label="Responsável"
              value={card.responsavelId}
              onChange={(e) => onUpdate({ responsavelId: e.target.value })}
              placeholder="Sem responsável"
              options={users.filter((u) => u.ativo).map((u) => ({ value: u.id, label: u.nome }))}
            />
          ) : (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-1">Responsável</p>
              <p className="text-sm text-slate-700 dark:text-white/70">
                {users.find((u) => u.id === card.responsavelId)?.nome ?? '—'}
              </p>
            </div>
          )}

          {/* Data de entrega */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-1 flex items-center gap-1.5">
              <Calendar size={12} />
              Data de entrega
            </p>
            {canEdit ? (
              <input
                type="date"
                value={card.dataEntrega}
                onChange={(e) => onUpdate({ dataEntrega: e.target.value })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#CC0000]/50 transition-colors"
              />
            ) : (
              <p className={`text-sm ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-white/70'}`}>
                {card.dataEntrega ? formatDate(card.dataEntrega) : '—'}
                {overdue && ' ⚠ Vencido'}
              </p>
            )}
          </div>

          {/* Label picker */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2 flex items-center gap-1.5">
              <Tag size={12} />
              Etiqueta
            </p>

            {/* Active label */}
            {activeLabel && (
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: activeLabel.color }}
                >
                  {activeLabel.name}
                </span>
                {canEdit && (
                  <button
                    onClick={() => onUpdate({ labelId: '' })}
                    className="text-xs text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {canEdit && (
              <div className="relative">
                <button
                  onClick={() => setShowLabelPicker((v) => !v)}
                  className="text-xs text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white border border-dashed border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/40 rounded-lg px-3 py-1.5 transition-all w-full flex items-center gap-1.5"
                >
                  <Tag size={11} />
                  {activeLabel ? 'Trocar etiqueta' : 'Escolher etiqueta'}
                </button>

                {showLabelPicker && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-3 space-y-1">
                    {/* Existing labels */}
                    {labels.length === 0 && !creatingLabel && (
                      <p className="text-xs text-slate-400 dark:text-white/30 italic py-1">Nenhuma etiqueta criada.</p>
                    )}
                    {labels.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          onUpdate({ labelId: card.labelId === l.id ? '' : l.id });
                          setShowLabelPicker(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                        <span className="text-sm text-slate-700 dark:text-white/80 flex-1 text-left">{l.name}</span>
                        {card.labelId === l.id && <Check size={13} className="text-[#CC0000]" />}
                      </button>
                    ))}

                    {/* Create new label */}
                    {creatingLabel ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                        <input
                          autoFocus
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Nome da etiqueta"
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#CC0000]/50"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {LABEL_PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setNewLabelColor(c)}
                              className={`w-5 h-5 rounded-full transition-all ${newLabelColor === c ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-white scale-110' : ''}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!newLabelName.trim()}
                            onClick={() => {
                              const created = addLabel(projectId, newLabelName.trim(), newLabelColor);
                              onUpdate({ labelId: created.id });
                              setNewLabelName('');
                              setCreatingLabel(false);
                              setShowLabelPicker(false);
                            }}
                          >
                            Criar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setCreatingLabel(false)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCreatingLabel(true)}
                        className="w-full flex items-center gap-1.5 text-xs text-[#CC0000] hover:text-[#AA0000] pt-1.5 border-t border-slate-100 dark:border-white/5 mt-1 transition-colors"
                      >
                        <Plus size={11} />
                        Nova etiqueta
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card color picker */}
          {canEdit && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2 flex items-center gap-1.5">
                <Palette size={12} />
                Cor de fundo
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowColorPicker((v) => !v)}
                  className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white border border-dashed border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/40 rounded-lg px-3 py-1.5 transition-all w-full"
                >
                  {card.cardColor ? (
                    <>
                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: card.cardColor }} />
                      Trocar cor
                    </>
                  ) : (
                    <>
                      <Palette size={11} />
                      Escolher cor
                    </>
                  )}
                </button>

                {showColorPicker && (
                  <div className="absolute z-10 mt-1 bg-white dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg p-3 w-full">
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {CARD_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => { onUpdate({ cardColor: c }); setShowColorPicker(false); }}
                          className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${card.cardColor === c ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-white' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    {card.cardColor && (
                      <button
                        onClick={() => { onUpdate({ cardColor: '' }); setShowColorPicker(false); }}
                        className="text-xs text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors"
                      >
                        Sem cor
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cover image */}
          {canEdit && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2 flex items-center gap-1.5">
                <Image size={12} />
                Imagem de capa
              </p>
              <button
                onClick={() => coverRef.current?.click()}
                className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white border border-dashed border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/40 rounded-lg px-3 py-1.5 transition-all w-full"
              >
                <Image size={11} />
                {card.coverImage ? 'Trocar imagem' : 'Upload de capa'}
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => { onUpdate({ archived: !card.archived, archivedAt: card.archived ? '' : new Date().toISOString() }); onClose(); }}
              >
                <Archive size={14} />
                {card.archived ? 'Desarquivar' : 'Arquivar card'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm('Excluir este card permanentemente?')) {
                    onDelete();
                    onClose();
                  }
                }}
              >
                <Trash2 size={14} />
                Excluir card
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

