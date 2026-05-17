import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { Comment } from '../../types';
import { Avatar } from '../shared/Avatar';
import { formatDateTime } from '../../utils/date';

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  currentUserName: string;
  onAdd: (text: string) => void;
}

export function CommentList({ comments, currentUserId: _uid, currentUserName, onAdd }: CommentListProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-white/70">
        <MessageSquare size={14} />
        <span className="font-medium">Comentários</span>
        {comments.length > 0 && (
          <span className="text-slate-400 dark:text-white/30 text-xs">({comments.length})</span>
        )}
      </div>

      {comments.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-white/20 italic">Nenhum comentário ainda.</p>
      )}

      <div className="space-y-3 max-h-48 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar name={c.authorName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-700 dark:text-white/80">{c.authorName}</span>
                <span className="text-xs text-slate-400 dark:text-white/25">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed break-words">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Avatar name={currentUserName} size="sm" />
        <div className="flex-1 flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend();
            }}
            placeholder="Escreva um comentário… (Ctrl+Enter para enviar)"
            rows={2}
            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#CC0000]/50 resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2 bg-[#CC0000] hover:bg-[#AA0000] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors self-end"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

