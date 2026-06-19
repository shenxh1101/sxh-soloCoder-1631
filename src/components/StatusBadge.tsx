import { ClothingStatus, CLOTHING_STATUS_LABELS, STATUS_COLORS } from '../../shared/types';

interface StatusBadgeProps {
  status: ClothingStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];
  const label = CLOTHING_STATUS_LABELS[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`status-badge ${sizeClasses}`}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}
