import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import type { Project, ProjectStatus } from '../types';
import { calcProjectProgress } from '../utils/progress';

export interface ProjectFilters {
  search: string;
  status: ProjectStatus | '';
  responsavelId: string;
  produto: string;
}

/** Returns filtered + enriched project list with computed progress */
export function useProjects(filters?: Partial<ProjectFilters>) {
  const { projects, users, createProject, updateProject, deleteProject, trashProject, restoreProject } = useData();

  const filtered = useMemo(() => {
    let result = projects.filter((p) => !p.deletedAt);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => p.cliente.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q));
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.responsavelId) {
      result = result.filter((p) => p.responsavelId === filters.responsavelId);
    }
    if (filters?.produto) {
      result = result.filter((p) => p.produto === filters.produto);
    }
    return result;
  }, [projects, filters]);

  const withProgress = useMemo(
    () =>
      filtered.map((p) => ({
        ...p,
        progress: calcProjectProgress(p),
        responsavel: users.find((u) => u.id === p.responsavelId),
      })),
    [filtered, users],
  );

  const getProject = (id: string): Project | undefined => projects.find((p) => p.id === id);

  return { projects: withProgress, getProject, createProject, updateProject, deleteProject, trashProject, restoreProject };
}
