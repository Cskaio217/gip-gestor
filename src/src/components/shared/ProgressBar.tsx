interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  color?: string;
}

export function ProgressBar({
  value,
  showLabel = false,
  size = 'sm',
  color = '#CC0000',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-400 dark:text-white/50">Progresso</span>
          <span className="text-xs font-semibold text-slate-600 dark:text-white/70">{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-200 dark:bg-white/10 rounded-full ${height} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

