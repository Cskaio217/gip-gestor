import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckSquare, Link2, MessageSquare } from 'lucide-react';
import type { Card, User, Label } from '../../types';
import { CardModal } from './CardModal';
import { Avatar } from '../shared/Avatar';
import { CARD_LABEL_COLORS } from '../../constants';
import { formatDate, isOverdue } from '../../utils/date';
import { calcChecklistProgress } from '../../utils/progress';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PERM } from '../../constants';

interface KanbanCardProps {
  card: Card;
  columnId: string;
  projectId: string;
  users: User[];
  labels: Label[];
  onUpdate: (patch: Partial<Card>) => void;
  onDelete: () => void;
  onAddComment: (text: string) => void;
  onAddChecklistItem: (text: string) => void;
  onToggleChecklist: (id: string) => void;
  onDeleteChecklist: (id: string) => void;
  onAddLink: (title: string, url: string) => void;
  onDeleteLink: (id: string) => void;
}

export function KanbanCard({
  card,
  columnId,
  projectId,
  users,
  labels,
  onUpdate,
  onDelete,
  onAddComment,
  onAddChecklistItem,
  onToggleChecklist,
  onDeleteChecklist,
  onAddLink,
  onDeleteLink,
}: KanbanCardProps) {
  const { user } = useAuth();
  const canEdit = usePermissions(PERM.KANBAN_EDIT);
  const [modalOpen, setModalOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card, columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const responsible = users.find((u) => u.id === card.responsavelId);
  const overdue = card.dataEntrega && isOverdue(card.dataEntrega);
  const { done: clDone, total: clTotal } = calcChecklistProgress(card);
  // Resolve label — prefer new labelId system, fall back to legacy label color
  const activeLabel = labels.find((l) => l.id === card.labelId);
  const legacyLabelColor = !activeLabel && card.label ? CARD_LABEL_COLORS[card.label] : null;
  const labelBannerColor = !card.cardColor ? (activeLabel?.color || legacyLabelColor || null) : null;

  if (card.archived) return null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setModalOpen(true)}
        className="bg-white dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-white/25 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 group select-none"
      >
        {/* Cover image */}
        {card.coverImage && (
          <div className="w-full h-20 overflow-hidden">
            <img src={card.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Card color cover (full height, only when no image) */}
        {!card.coverImage && card.cardColor && (
          <div className="w-full h-20" style={{ backgroundColor: card.cardColor }} />
        )}

        {/* Label color thin stripe (only when no cover image and no card color) */}
        {!card.coverImage && !card.cardColor && labelBannerColor && (
          <div className="w-full h-1.5" style={{ backgroundColor: labelBannerColor }} />
        )}

        <div className="p-3.5">
          {/* Label pill */}
          {activeLabel && (
            <div className="inline-flex items-center gap-1.5 mb-2">
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: activeLabel.color }}
              >
                {activeLabel.name}
              </span>
            </div>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug mb-2">{card.title}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-white/35">
            {card.dataEntrega && (
              <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 dark:text-red-400' : ''}`}>
                <Calendar size={11} />
                {formatDate(card.dataEntrega)}
              </span>
            )}
            {clTotal > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare size={11} />
                {clDone}/{clTotal}
              </span>
            )}
            {card.links.length > 0 && (
              <span className="flex items-center gap-1">
                <Link2 size={11} />
                {card.links.length}
              </span>
            )}
            {card.comments.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare size={11} />
                {card.comments.length}
              </span>
            )}
          </div>

          {/* Responsible */}
          {responsible && (
            <div className="flex justify-end mt-2">
              <Avatar name={responsible.nome} size="sm" />
            </div>
          )}
        </div>
      </div>

      {modalOpen && user && (
        <CardModal
          open={modalOpen}
          card={card}
          columnId={columnId}
          projectId={projectId}
          users={users}
          labels={labels}
          currentUser={user}
          canEdit={canEdit}
          onClose={() => setModalOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddComment={onAddComment}
          onAddChecklistItem={onAddChecklistItem}
          onToggleChecklist={onToggleChecklist}
          onDeleteChecklist={onDeleteChecklist}
          onAddLink={onAddLink}
          onDeleteLink={onDeleteLink}
        />
      )}
    </>
  );
}

