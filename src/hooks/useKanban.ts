import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import type { Project } from '../types';
import { calcProjectProgress } from '../utils/progress';

/** Provides all kanban operations scoped to a single project */
export function useKanban(projectId: string) {
  const {
    projects,
    users,
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
    addLabel,
    updateLabel,
    deleteLabel,
  } = useData();

  const project: Project | undefined = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const progress = useMemo(
    () => (project ? calcProjectProgress(project) : 0),
    [project],
  );

  const sortedColumns = useMemo(
    () => project ? [...project.columns].sort((a, b) => a.order - b.order) : [],
    [project],
  );

  const labels = useMemo(() => project?.labels ?? [], [project]);

  return {
    project,
    sortedColumns,
    users,
    progress,
    labels,
    updateProject: (patch: Partial<Project>) => updateProject(projectId, patch),
    addColumn: (title: string) => addColumn(projectId, title),
    updateColumnTitle: (colId: string, title: string) => updateColumnTitle(projectId, colId, title),
    deleteColumn: (colId: string) => deleteColumn(projectId, colId),
    reorderColumns: (cols: typeof sortedColumns) => reorderColumns(projectId, cols),
    addCard: (colId: string, data: Parameters<typeof addCard>[2]) => addCard(projectId, colId, data),
    updateCard: (colId: string, cardId: string, patch: Parameters<typeof updateCard>[3]) =>
      updateCard(projectId, colId, cardId, patch),
    moveCard: (cardId: string, fromColId: string, toColId: string, insertAt: number) =>
      moveCard(projectId, cardId, fromColId, toColId, insertAt),
    deleteCard: (colId: string, cardId: string) => deleteCard(projectId, colId, cardId),
    addComment: (colId: string, cardId: string, text: string, authorId: string, authorName: string) =>
      addComment(projectId, colId, cardId, text, authorId, authorName),
    addChecklistItem: (colId: string, cardId: string, text: string) =>
      addChecklistItem(projectId, colId, cardId, text),
    toggleChecklistItem: (colId: string, cardId: string, itemId: string) =>
      toggleChecklistItem(projectId, colId, cardId, itemId),
    deleteChecklistItem: (colId: string, cardId: string, itemId: string) =>
      deleteChecklistItem(projectId, colId, cardId, itemId),
    addLink: (colId: string, cardId: string, title: string, url: string) =>
      addLink(projectId, colId, cardId, title, url),
    deleteLink: (colId: string, cardId: string, linkId: string) =>
      deleteLink(projectId, colId, cardId, linkId),
    addLabel: (name: string, color: string) => addLabel(projectId, name, color),
    updateLabel: (labelId: string, name: string, color: string) => updateLabel(projectId, labelId, name, color),
    deleteLabel: (labelId: string) => deleteLabel(projectId, labelId),
  };
}
