import { useState } from 'react';
import { Link2, Plus, Trash2, ExternalLink } from 'lucide-react';
import type { CardLink } from '../../types';

interface LinkListProps {
  links: CardLink[];
  onAdd: (title: string, url: string) => void;
  onDelete: (id: string) => void;
  readonly?: boolean;
}

export function LinkList({ links, onAdd, onDelete, readonly = false }: LinkListProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!title.trim() || !url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    onAdd(title.trim(), fullUrl);
    setTitle('');
    setUrl('');
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/70">
          <Link2 size={14} />
          <span className="font-medium">Links</span>
        </div>
        {!readonly && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-xs text-slate-400 dark:text-white/30 hover:text-[#CC0000] transition-colors flex items-center gap-1"
          >
            <Plus size={12} />
            Adicionar
          </button>
        )}
      </div>

      {links.map((link) => (
        <div key={link.id} className="flex items-center gap-2 group">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 truncate flex-1 transition-colors"
          >
            <ExternalLink size={12} className="flex-shrink-0" />
            {link.title}
          </a>
          {!readonly && (
            <button
              onClick={() => onDelete(link.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}

      {adding && (
        <div className="space-y-2 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do link"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none border-b border-slate-200 dark:border-white/10 pb-1"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="https://..."
            className="w-full bg-transparent text-sm text-slate-600 dark:text-white/60 placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setAdding(false)}
              className="text-xs text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              className="text-xs text-[#CC0000] hover:text-[#AA0000] transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

