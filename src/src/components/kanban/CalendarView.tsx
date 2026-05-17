import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Card, Column, User, Label } from '../../types';
import { Avatar } from '../shared/Avatar';
import { CardModal } from './CardModal';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PERM, CARD_LABEL_COLORS } from '../../constants';

interface CalendarEvent {
  card: Card;
  columnId: string;
  columnTitle: string;
  label: Label | null;
  color: string;
}

interface CalendarViewProps {
  columns: Column[];
  users: User[];
  labels: Label[];
  onUpdateCard: (colId: string, cardId: string, patch: Partial<Card>) => void;
  onDeleteCard: (colId: string, cardId: string) => void;
  onAddComment: (colId: string, cardId: string, text: string) => void;
  onAddChecklistItem: (colId: string, cardId: string, text: string) => void;
  onToggleChecklist: (colId: string, cardId: string, itemId: string) => void;
  onDeleteChecklist: (colId: string, cardId: string, itemId: string) => void;
  onAddLink: (colId: string, cardId: string, title: string, url: string) => void;
  onDeleteLink: (colId: string, cardId: string, linkId: string) => void;
  projectId: string;
  onClose: () => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ACCENT_COLORS = [
  '#CC0000', '#3B82F6', '#22C55E', '#EAB308', '#A855F7',
  '#F97316', '#0EA5E9', '#EC4899', '#14B8A6',
];

function colorForColumn(_columnTitle: string, index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

export function CalendarView({
  columns,
  users,
  labels,
  onUpdateCard,
  onDeleteCard,
  onAddComment,
  onAddChecklistItem,
  onToggleChecklist,
  onDeleteChecklist,
  onAddLink,
  onDeleteLink,
  projectId,
  onClose,
}: CalendarViewProps) {
  const { user } = useAuth();
  const canEdit = usePermissions(PERM.KANBAN_EDIT);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterUserId, setFilterUserId] = useState('');
  const [filterLabelId, setFilterLabelId] = useState('');
  const [filterColumnId, setFilterColumnId] = useState('');
  const [expandDay, setExpandDay] = useState<string | null>(null);
  const [openCard, setOpenCard] = useState<{ card: Card; columnId: string } | null>(null);

  // Build events map: day → events[]
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    columns.forEach((col, idx) => {
      col.cards
        .filter((card) => {
          if (card.archived || !card.dataEntrega) return false;
          if (filterUserId && card.responsavelId !== filterUserId) return false;
          if (filterLabelId && card.labelId !== filterLabelId) return false;
          if (filterColumnId && col.id !== filterColumnId) return false;
          return true;
        })
        .forEach((card) => {
          const day = card.dataEntrega; // YYYY-MM-DD
          const label = labels.find((l) => l.id === card.labelId) ?? null;
          const color = card.cardColor || label?.color || (card.label ? CARD_LABEL_COLORS[card.label] : null) || colorForColumn(col.title, idx);
          const event: CalendarEvent = { card, columnId: col.id, columnTitle: col.title, label, color };
          // columnTitle kept on CalendarEvent for potential future display use
          if (!map.has(day)) map.set(day, []);
          map.get(day)!.push(event);
        });
    });

    return map;
  }, [columns, labels, filterUserId, filterLabelId, filterColumnId]);

  // Calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  // Pad grid to complete weeks
  const gridCells: Array<number | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (gridCells.length % 7 !== 0) gridCells.push(null);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const fmtDay = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const MAX_VISIBLE = 2;

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1E1E1E] border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          {/* Month navigation */}
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Outfit'] min-w-[180px] text-center">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="text-xs bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-white focus:outline-none focus:border-[#CC0000]/50"
            >
              <option value="">Todos os responsáveis</option>
              {users.filter((u) => u.ativo).map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>

            <select
              value={filterLabelId}
              onChange={(e) => setFilterLabelId(e.target.value)}
              className="text-xs bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-white focus:outline-none focus:border-[#CC0000]/50"
            >
              <option value="">Todas as etiquetas</option>
              {labels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <select
              value={filterColumnId}
              onChange={(e) => setFilterColumnId(e.target.value)}
              className="text-xs bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-white focus:outline-none focus:border-[#CC0000]/50"
            >
              <option value="">Todos os status</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <button onClick={onClose} className="p-1.5 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Fechar calendário">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-white/30 uppercase py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-white/10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
          {gridCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="bg-slate-50 dark:bg-[#1E1E1E]/60 min-h-[90px]" />;
            }

            const dayStr = fmtDay(day);
            const events = eventsByDay.get(dayStr) ?? [];
            const isToday = dayStr === todayStr;
            const visible = events.slice(0, MAX_VISIBLE);
            const overflow = events.length - MAX_VISIBLE;
            const isExpanded = expandDay === dayStr;

            return (
              <div
                key={dayStr}
                className="bg-white dark:bg-[#2D2D2D] min-h-[90px] p-1.5 flex flex-col gap-1 relative"
              >
                {/* Day number */}
                <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${isToday ? 'bg-[#CC0000] text-white' : 'text-slate-500 dark:text-white/40'}`}>
                  {day}
                </div>

                {/* Events */}
                {(isExpanded ? events : visible).map((ev) => {
                  const resp = users.find((u) => u.id === ev.card.responsavelId);
                  return (
                    <button
                      key={ev.card.id}
                      onClick={() => setOpenCard({ card: ev.card, columnId: ev.columnId })}
                      className="w-full text-left rounded overflow-hidden flex items-center gap-1.5 text-xs font-medium text-white truncate px-1.5 py-0.5 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: ev.color }}
                      title={ev.card.title}
                    >
                      <span className="truncate flex-1">{ev.card.title}</span>
                      {resp && <Avatar name={resp.nome} size="sm" className="flex-shrink-0 !w-4 !h-4 !text-[9px]" />}
                    </button>
                  );
                })}

                {/* Overflow */}
                {!isExpanded && overflow > 0 && (
                  <button
                    onClick={() => setExpandDay(isExpanded ? null : dayStr)}
                    className="text-[10px] text-slate-500 dark:text-white/40 hover:text-[#CC0000] dark:hover:text-[#CC0000] text-left pl-1 transition-colors"
                  >
                    +{overflow} mais
                  </button>
                )}
                {isExpanded && (
                  <button
                    onClick={() => setExpandDay(null)}
                    className="text-[10px] text-slate-500 dark:text-white/40 hover:text-[#CC0000] dark:hover:text-[#CC0000] text-left pl-1 transition-colors"
                  >
                    Mostrar menos
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card modal */}
      {openCard && user && (
        <CardModal
          open
          card={openCard.card}
          columnId={openCard.columnId}
          projectId={projectId}
          users={users}
          labels={labels}
          currentUser={user}
          canEdit={canEdit}
          onClose={() => setOpenCard(null)}
          onUpdate={(patch) => { onUpdateCard(openCard.columnId, openCard.card.id, patch); setOpenCard(null); }}
          onDelete={() => { onDeleteCard(openCard.columnId, openCard.card.id); setOpenCard(null); }}
          onAddComment={(text) => onAddComment(openCard.columnId, openCard.card.id, text)}
          onAddChecklistItem={(text) => onAddChecklistItem(openCard.columnId, openCard.card.id, text)}
          onToggleChecklist={(id) => onToggleChecklist(openCard.columnId, openCard.card.id, id)}
          onDeleteChecklist={(id) => onDeleteChecklist(openCard.columnId, openCard.card.id, id)}
          onAddLink={(t, url) => onAddLink(openCard.columnId, openCard.card.id, t, url)}
          onDeleteLink={(id) => onDeleteLink(openCard.columnId, openCard.card.id, id)}
        />
      )}
    </div>
  );
}

