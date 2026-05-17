import { useState } from 'react';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { TrashModal } from './TrashModal';
import { Filters } from './Filters';
import { Button } from '../shared/Button';
import { useProjects, type ProjectFilters } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../contexts/DataContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PERM } from '../../constants';
import type { CreateProjectInput, Project } from '../../types';

export function ProjectList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { consultores } = useUsers();
  const { settings, projects: allProjects, trashProject } = useData();
  const canManage = usePermissions(PERM.PROJECTS_CREATE);
  const canDelete = usePermissions(PERM.PROJECTS_DELETE);
  const canTrashView = usePermissions(PERM.ADMIN_TRASH);

  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: '',
    responsavelId: '',
    produto: '',
  });
  const { projects, createProject, updateProject } = useProjects(filters);
  const [showModal, setShowModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | undefined>();

  const trashedCount = allProjects.filter((p) => !!p.deletedAt).length;

  const handleSave = (data: CreateProjectInput) => {
    if (editTarget) {
      updateProject(editTarget.id, data);
    } else {
      createProject(data);
    }
    setEditTarget(undefined);
  };

  const handleEdit = (p: Project) => {
    setEditTarget(p);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Mover projeto para a lixeira?')) {
      trashProject(id, user?.id ?? '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex-1">
          <Filters
            filters={filters}
            onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
            consultores={consultores}
            productTypes={settings.productTypes}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(canTrashView || canDelete) && (
            <button
              onClick={() => setShowTrash(true)}
              className="relative flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-3 py-2 transition-all"
              title="Lixeira de projetos"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Lixeira</span>
              {trashedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#CC0000] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {trashedCount}
                </span>
              )}
            </button>
          )}
          {canManage && (
            <Button onClick={() => { setEditTarget(undefined); setShowModal(true); }}>
              <Plus size={16} />
              Novo Projeto
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 dark:text-white/20">
          <FolderOpen size={48} strokeWidth={1} />
          <p className="mt-4 text-sm">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              canManage={canManage}
              onEnter={() => navigate(`/projeto/${p.id}`)}
              onEdit={() => handleEdit(p)}
              onDelete={canDelete ? () => handleDelete(p.id) : undefined}
            />
          ))}
        </div>
      )}

      <ProjectModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(undefined); }}
        onSave={handleSave}
        productTypes={settings.productTypes}
        consultores={consultores}
        initial={editTarget}
      />

      <TrashModal open={showTrash} onClose={() => setShowTrash(false)} />
    </div>
  );
}
