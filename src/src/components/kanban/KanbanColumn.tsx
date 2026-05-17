import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column, Card, User } from '../../types';
import type { Label } from '../../types';
import { KanbanCard } from './KanbanCard';
import { usePermissions } from '../../hooks/usePermissions';
import { PERM } from '../../constants';

interface AddCardFormProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
}

function AddCardForm({ onAdd, onCancel }: AddCardFormProps) {
  const [val, setVal] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (val.trim()) onAdd(val.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Título do card…"
        rows={2}
        className="w-full bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/20 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => val.trim() && onAdd(val.trim())}
          className="px-3 py-1.5 bg-[#CC0000] hover:bg-[#AA0000] text-white text-xs font-medium rounded-lg transition-colors"
        >
          Adicionar
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: Column;
  projectId: string;
  users: User[];
  labels: Label[];
  onAddCard: (colId: string, title: string) => void;
  onUpdateCard: (colId: string, cardId: string, patch: Partial<Card>) => void;
  onDeleteCard: (colId: string, cardId: string) => void;
  onRenameColumn: (colId: string, title: string) => void;
  onDeleteColumn: (colId: string) => void;
  onAddComment: (colId: string, cardId: string, text: string) => void;
  onAddChecklistItem: (colId: string, cardId: string, text: string) => void;
  onToggleChecklist: (colId: string, cardId: string, itemId: string) => void;
  onDeleteChecklist: (colId: string, cardId: string, itemId: string) => void;
  onAddLink: (colId: string, cardId: string, title: string, url: string) => void;
  onDeleteLink: (colId: string, cardId: string, linkId: string) => void;
}

export function KanbanColumn({
  column,
  projectId,
  users,
  labels,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onRenameColumn,
  onDeleteColumn,
  onAddComment,
  onAddChecklistItem,
  onToggleChecklist,
  onDeleteChecklist,
  onAddLink,
  onDeleteLink,
}: KanbanColumnProps) {
  const canEdit = usePermissions(PERM.KANBAN_EDIT);

  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(column.title);
  const [addingCard, setAddingCard] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setColRef,
    transform,
    transition,
    isDragging: isColDragging,
  } = useSortable({ id: column.id, data: { type: 'column' } });

  const colStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isColDragging ? 0.5 : 1,
  };

  const { setNodeRef: setDropRef } = useDroppable({ id: column.id });

  const activeCards = column.cards.filter((c) => !c.archived).sort((a, b) => a.order - b.order);

  const handleTitleBlur = () => {
    setEditTitle(false);
    if (titleVal.trim() && titleVal !== column.title) {
      onRenameColumn(column.id, titleVal.trim());
    }
  };

  return (
    <div
      ref={setColRef}
      style={colStyle}
      className="flex flex-col w-72 flex-shrink-0 bg-slate-100 dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/8 rounded-2xl"
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/5">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="text-slate-300 dark:text-white/20 hover:text-slate-500 dark:hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical size={14} />
          </button>
        )}

        {editTitle && canEdit ? (
          <input
            autoFocus
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleBlur();
              if (e.key === 'Escape') { setTitleVal(column.title); setEditTitle(false); }
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-[#CC0000]"
          />
        ) : (
          <h3
            className={`flex-1 text-sm font-semibold text-slate-700 dark:text-white/80 truncate ${canEdit ? 'cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors' : ''}`}
            onDoubleClick={() => canEdit && setEditTitle(true)}
          >
            {column.title}
          </h3>
        )}

        <span className="text-xs text-slate-400 dark:text-white/25 tabular-nums">{activeCards.length}</span>

        {canEdit && (
          <button
            onClick={() => {
              if (confirm(`Excluir a coluna "${column.title}"? Os cards serão perdidos.`)) {
                onDeleteColumn(column.id);
              }
            }}
            className="text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Cards */}
      <div ref={setDropRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[80px]">
        <SortableContext items={activeCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {activeCards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              projectId={projectId}
              users={users}
              labels={labels}
              onUpdate={(patch) => onUpdateCard(column.id, card.id, patch)}
              onDelete={() => onDeleteCard(column.id, card.id)}
              onAddComment={(text) => onAddComment(column.id, card.id, text)}
              onAddChecklistItem={(text) => onAddChecklistItem(column.id, card.id, text)}
              onToggleChecklist={(id) => onToggleChecklist(column.id, card.id, id)}
              onDeleteChecklist={(id) => onDeleteChecklist(column.id, card.id, id)}
              onAddLink={(t, u) => onAddLink(column.id, card.id, t, u)}
              onDeleteLink={(id) => onDeleteLink(column.id, card.id, id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      {canEdit && (
        <div className="px-3 pb-3">
          {addingCard ? (
            <AddCardForm
              onAdd={(title) => { onAddCard(column.id, title); setAddingCard(false); }}
              onCancel={() => setAddingCard(false)}
            />
          ) : (
            <button
              onClick={() => setAddingCard(true)}
              className="w-full flex items-center gap-2 text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg px-3 py-2 transition-all"
            >
              <Plus size={14} />
              Adicionar card
            </button>
          )}
        </div>
      )}
    </div>
  );
}

