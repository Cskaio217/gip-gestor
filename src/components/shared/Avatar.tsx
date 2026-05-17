interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const COLORS = [
  'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
  'bg-blue-500', 'bg-teal-500', 'bg-green-500',
  'bg-yellow-500', 'bg-orange-500', 'bg-red-500',
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 ${SIZES[size]} ${colorForName(name)} ${className}`}
      title={name}
    >
      {initials}
    </span>
  );
}
