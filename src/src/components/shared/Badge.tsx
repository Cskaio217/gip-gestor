import type { ProjectStatus } from '../../types';
import { STATUS_CONFIG } from '../../constants';

interface BadgeProps {
  status: ProjectStatus;
}

const STATUS_EMOJI: Record<ProjectStatus, string> = {
  'Em Andamento': '🟢',
  'Aguardando Cliente': '🟡',
  Concluído: '✅',
  Pausado: '⏸',
};

export function StatusBadge({ status }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}
    >
      <span>{STATUS_EMOJI[status]}</span>
      {status}
    </span>
  );
}

interface LabelDotProps {
  color: string;
  size?: number;
}

export function LabelDot({ color, size = 10 }: LabelDotProps) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}
