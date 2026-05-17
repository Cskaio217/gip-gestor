import { Search, X } from 'lucide-react';
import type { ProjectFilters } from '../../hooks/useProjects';
import type { User } from '../../types';
import { PROJECT_STATUS_LIST } from '../../constants';

interface FiltersProps {
  filters: ProjectFilters;
  onChange: (f: Partial<ProjectFilters>) => void;
  consultores: User[];
  productTypes: string[];
}

export function Filters({ filters, onChange, consultores, productTypes }: FiltersProps) {
  const hasAny = filters.search || filters.status || filters.responsavelId || filters.produto;

  return (
    <div className="flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Buscar por cliente ou projeto…"
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#CC0000]/60 transition-colors"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value as ProjectFilters['status'] })}
        className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#CC0000]/60 transition-colors"
      >
        <option value="">Todos os status</option>
        {PROJECT_STATUS_LIST.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Responsável */}
      <select
        value={filters.responsavelId}
        onChange={(e) => onChange({ responsavelId: e.target.value })}
        className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#CC0000]/60 transition-colors"
      >
        <option value="">Todos os responsáveis</option>
        {consultores.map((u) => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </select>

      {/* Produto */}
      <select
        value={filters.produto}
        onChange={(e) => onChange({ produto: e.target.value })}
        className="bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#CC0000]/60 transition-colors"
      >
        <option value="">Todos os produtos</option>
        {productTypes.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {/* Clear */}
      {hasAny && (
        <button
          onClick={() => onChange({ search: '', status: '', responsavelId: '', produto: '' })}
          className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 transition-colors"
        >
          <X size={13} />
          Limpar
        </button>
      )}
    </div>
  );
}

