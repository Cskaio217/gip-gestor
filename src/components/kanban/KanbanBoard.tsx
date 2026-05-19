import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ArrowLeft, Plus, ChevronDown, Settings, CalendarDays } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { CalendarView } from './CalendarView';
import { ProjectSettings } from './ProjectSettings';
import { StatusBadge } from '../shared/Badge';
import { ProgressBar } from '../shared/ProgressBar';
import { Button } from '../shared/Button';
import { Select } from '../shared/Select';
import { useKanban } from '../../hooks/useKanban';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PERM } from '../../constants';
import type { Card, Column, ProjectStatus } from '../../types';
import { PROJECT_STATUS_LIST } from '../../constants';

interface KanbanBoardProps {
  projectId: string;
  showCalendar?: boolean;
}

export function KanbanBoard({ projectId, showCalendar = false }: KanbanBoardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = usePermissions(PERM.PROJECTS_EDIT);
  const canEdit = usePermissions(PERM.KANBAN_EDIT);
  const {
    project,
    sortedColumns,
    users,
    labels,
    progress,
    updateProject,
    addColumn,
    updateColumnTitle,
    deleteColumn,
    reorderColumns,
    addCard,
    updateCard,
    moveCard,
    deleteCard,
    addComment,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addLink,
    deleteLink,
  } = useKanban(projectId);

  const [newColName, setNewColName] = useState('');
  const [addingCol, setAddingCol] = useState(false);
  const [activeCard, setActiveCard] = useState<{ card: Card; columnId: string } | null>(null);
  const [editStatus, setEditStatus] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-white/30">
        Projeto não encontrado.
      </div>
    );
  }

  // ── DnD handlers ───────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'card') {
      setActiveCard({ card: active.data.current.card as Card, columnId: active.data.current.columnId as string });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'column') {
      const oldIdx = sortedColumns.findIndex((c) => c.id === active.id);
      const newIdx = sortedColumns.findIndex((c) => c.id === over.id);
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(sortedColumns, oldIdx, newIdx).map((c, i) => ({
          ...c,
          order: i,
        })) as Column[];
        reorderColumns(reordered);
      }
      return;
    }

    if (activeType === 'card') {
      const fromColId = active.data.current?.columnId as string;
      let toColId: string;
      let insertAt: number;

      if (overType === 'card') {
        toColId = over.data.current?.columnId as string;
        const toCol = sortedColumns.find((c) => c.id === toColId);
        const overIdx = toCol?.cards.findIndex((k) => k.id === over.id) ?? 0;
        insertAt = overIdx;
      } else {
        toColId = over.id as string;
        const toCol = sortedColumns.find((c) => c.id === toColId);
        insertAt = (toCol?.cards.filter((k) => !k.archived).length) ?? 0;
      }

      if (active.id !== over.id || fromColId !== toColId) {
        moveCard(active.id as string, fromColId, toColId, insertAt);
      }
    }
  };

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    addColumn(newColName.trim());
    setNewColName('');
    setAddingCol(false);
  };

  const responsavel = users.find((u) => u.id === project.responsavelId);

  // ── Calendar view ───────────────────────────────────────────────────────────

  if (showCalendar) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#1E1E1E]">
        <CalendarView
          columns={sortedColumns}
          users={users}
          labels={labels}
          projectId={projectId}
          onClose={() => navigate(`/projeto/${projectId}`)}
          onUpdateCard={(colId, cardId, patch) => updateCard(colId, cardId, patch)}
          onDeleteCard={(colId, cardId) => deleteCard(colId, cardId)}
          onAddComment={(colId, cardId, text) => addComment(colId, cardId, text, user?.id ?? '', user?.nome ?? '')}
          onAddChecklistItem={(colId, cardId, text) => addChecklistItem(colId, cardId, text)}
          onToggleChecklist={(colId, cardId, itemId) => toggleChecklistItem(colId, cardId, itemId)}
          onDeleteChecklist={(colId, cardId, itemId) => deleteChecklistItem(colId, cardId, itemId)}
          onAddLink={(colId, cardId, t, u) => addLink(colId, cardId, t, u)}
          onDeleteLink={(colId, cardId, id) => deleteLink(colId, cardId, id)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50 dark:bg-[#1E1E1E]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1E1E1E] border-b border-slate-200 dark:border-white/10 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Client logo or initials */}
            {project.clientLogo ? (
              <img
                src={project.clientLogo}
                alt={project.cliente}
                className="w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#CC0000]/10 dark:bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#CC0000] font-['Outfit']">
                  {project.cliente.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 dark:text-white font-['Outfit'] text-lg truncate">
                {project.cliente}
              </h1>
              <p className="text-xs text-[#CC0000]">{project.produto}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="w-28 sm:w-36 hidden xs:block sm:block">
              <ProgressBar value={progress} showLabel size="md" />
            </div>

            {/* Status selector */}
            {canManage ? (
              <div className="relative">
                {editStatus ? (
                  <Select
                    value={project.status}
                    onChange={(e) => {
                      updateProject({ status: e.target.value as ProjectStatus });
                      setEditStatus(false);
                    }}
                    options={PROJECT_STATUS_LIST.map((s) => ({ value: s, label: s }))}
                    className="min-w-[160px]"
                  />
                ) : (
                  <button
                    onClick={() => setEditStatus(true)}
                    className="flex items-center gap-1.5 group"
                  >
                    <StatusBadge status={project.status} />
                    <ChevronDown size={12} className="text-slate-300 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors" />
                  </button>
                )}
              </div>
            ) : (
              <StatusBadge status={project.status} />
            )}

            {responsavel && (
              <p className="text-xs text-slate-400 dark:text-white/40 hidden sm:block">{responsavel.nome}</p>
            )}

            {/* Calendar button */}
            <button
              onClick={() => navigate(`/projeto/${projectId}/calendario`)}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 transition-all"
              title="Visualização de calendário"
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">Calendário</span>
            </button>

            {/* Settings button */}
            {canManage && (
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 transition-all"
                title="Configurações do projeto"
              >
                <Settings size={14} />
                <span className="hidden sm:inline">Configurações</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-2 sm:px-6 py-3 sm:py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedColumns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 items-start w-max min-h-full">
              {sortedColumns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  projectId={projectId}
                  users={users}
                  labels={labels}
                  onAddCard={(colId, title) =>
                    addCard(colId, {
                      title,
                      description: '',
                      responsavelId: '',
                      dataEntrega: '',
                      label: '',
                      labelId: '',
                    })
                  }
                  onUpdateCard={(colId, cardId, patch) => updateCard(colId, cardId, patch)}
                  onDeleteCard={(colId, cardId) => deleteCard(colId, cardId)}
                  onRenameColumn={(colId, title) => updateColumnTitle(colId, title)}
                  onDeleteColumn={(colId) => deleteColumn(colId)}
                  onAddComment={(colId, cardId, text) =>
                    addComment(colId, cardId, text, user?.id ?? '', user?.nome ?? '')
                  }
                  onAddChecklistItem={(colId, cardId, text) => addChecklistItem(colId, cardId, text)}
                  onToggleChecklist={(colId, cardId, itemId) => toggleChecklistItem(colId, cardId, itemId)}
                  onDeleteChecklist={(colId, cardId, itemId) => deleteChecklistItem(colId, cardId, itemId)}
                  onAddLink={(colId, cardId, t, u) => addLink(colId, cardId, t, u)}
                  onDeleteLink={(colId, cardId, id) => deleteLink(colId, cardId, id)}
                />
              ))}

              {/* Add column */}
              {canEdit && (
                <div className="w-[280px] sm:w-72 flex-shrink-0">
                  {addingCol ? (
                    <div className="bg-white dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                      <input
                        autoFocus
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddColumn();
                          if (e.key === 'Escape') setAddingCol(false);
                        }}
                        placeholder="Nome da coluna…"
                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white border-b border-slate-300 dark:border-white/20 pb-1 focus:outline-none focus:border-[#CC0000]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddColumn}>Criar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingCol(false)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCol(true)}
                      className="w-full flex items-center gap-2 text-sm text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 hover:bg-white/50 dark:hover:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-2xl px-4 py-3 transition-all"
                    >
                      <Plus size={16} />
                      Nova coluna
                    </button>
                  )}
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeCard && (
              <div className="bg-white dark:bg-[#2D2D2D] border border-[#CC0000]/50 rounded-xl p-3.5 shadow-2xl w-72 opacity-90">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{activeCard.card.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Project Settings modal */}
      {showSettings && project && user && (
        <ProjectSettings
          open={showSettings}
          onClose={() => setShowSettings(false)}
          project={project}
          users={users}
        />
      )}
    </div>
  );
}

