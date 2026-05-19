import { Calendar, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import type { Project, User as UserType } from '../../types';
import { StatusBadge } from '../shared/Badge';
import { ProgressBar } from '../shared/ProgressBar';
import { Avatar } from '../shared/Avatar';
import { formatDate } from '../../utils/date';

interface ProjectCardProps {
  project: Project & { progress: number; responsavel?: UserType };
  onEnter: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  canManage: boolean;
}

export function ProjectCard({ project, onEnter, onEdit, onDelete, canManage }: ProjectCardProps) {
  const clientInitials = (project.cliente ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 group shadow-sm dark:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white font-['Outfit'] truncate">{project.cliente}</h3>
          {project.nome && (
            <p className="text-xs text-slate-400 dark:text-white/40 truncate mt-0.5">{project.nome}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={project.status} />
          {/* Client logo or initials avatar */}
          {project.clientLogo ? (
            <img
              src={project.clientLogo}
              alt={project.cliente}
              className="w-10 h-10 rounded-lg object-contain border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#CC0000]/10 dark:bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#CC0000] font-['Outfit']">{clientInitials}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product */}
      <p className="text-xs text-[#CC0000] font-medium">{project.produto}</p>

      {/* Progress */}
      <ProgressBar value={project.progress} showLabel />

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-white/40">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} />
          {formatDate(project.dataInicio)}
          {project.dataFim && <> — {formatDate(project.dataFim)}</>}
        </span>
      </div>

      {/* Responsável */}
      {project.responsavel && (
        <div className="flex items-center gap-2">
          <Avatar name={project.responsavel.nome} size="sm" />
          <div>
            <p className="text-xs text-slate-700 dark:text-white/70">{project.responsavel.nome}</p>
            <p className="text-xs text-slate-400 dark:text-white/30">{project.responsavel.especialidade}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
        {canManage && (
          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <Pencil size={13} />
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-slate-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
        <button
          onClick={onEnter}
          className="ml-auto flex items-center gap-1.5 text-xs text-[#CC0000] hover:text-white hover:bg-[#CC0000] rounded-lg px-3 py-1.5 transition-all duration-200 font-medium"
        >
          Entrar no projeto
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

