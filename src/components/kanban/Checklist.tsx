import { useState } from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import type { ChecklistItem } from '../../types';
import { calcChecklistProgress } from '../../utils/progress';
import { ProgressBar } from '../shared/ProgressBar';

interface ChecklistProps {
  items: ChecklistItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  readonly?: boolean;
}

export function Checklist({ items, onAdd, onToggle, onDelete, readonly = false }: ChecklistProps) {
  const [newText, setNewText] = useState('');
  const { done, total, pct } = calcChecklistProgress({ checklist: items } as Parameters<typeof calcChecklistProgress>[0]);

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/70">
          <CheckSquare size={14} />
          <span className="font-medium">Checklist</span>
          {total > 0 && (
            <span className="text-slate-400 dark:text-white/30 text-xs">
              {done}/{total}
            </span>
          )}
        </div>
      </div>

      {total > 0 && <ProgressBar value={pct} size="sm" />}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 group">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => !readonly && onToggle(item.id)}
              disabled={readonly}
              className="mt-0.5 w-4 h-4 accent-[#CC0000] cursor-pointer flex-shrink-0"
            />
            <span
              className={`text-sm flex-1 ${item.done ? 'line-through text-slate-400 dark:text-white/30' : 'text-slate-700 dark:text-white/80'}`}
            >
              {item.text}
            </span>
            {!readonly && (
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readonly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Novo item…"
            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#CC0000]/50 transition-colors"
          />
          <button
            onClick={handleAdd}
            className="p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-[#CC0000]/10 dark:hover:bg-[#CC0000]/20 text-slate-400 dark:text-white/50 hover:text-[#CC0000] rounded-lg transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

