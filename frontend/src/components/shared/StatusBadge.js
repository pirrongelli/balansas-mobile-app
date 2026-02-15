import { Badge } from '@/components/ui/badge';

const statusConfig = {
  completed: {
    label: 'Completed',
    classes: 'bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.25)]',
    dot: 'bg-[hsl(var(--status-success))]',
  },
  settled: {
    label: 'Settled',
    classes: 'bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.25)]',
    dot: 'bg-[hsl(var(--status-success))]',
  },
  processing: {
    label: 'Processing',
    classes: 'bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.25)]',
    dot: 'bg-[hsl(var(--status-warning))]',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.25)]',
    dot: 'bg-[hsl(var(--status-warning))]',
  },
  failed: {
    label: 'Failed',
    classes: 'bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))] border-[hsl(var(--status-danger)/0.25)]',
    dot: 'bg-[hsl(var(--status-danger))]',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))] border-[hsl(var(--status-danger)/0.25)]',
    dot: 'bg-[hsl(var(--status-danger))]',
  },
  active: {
    label: 'Active',
    classes: 'bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.25)]',
    dot: 'bg-[hsl(var(--status-success))]',
  },
};

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  const config = statusConfig[normalized] || {
    label: status || 'Unknown',
    classes: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]',
    dot: 'bg-[hsl(var(--muted-foreground))]',
  };

  return (
    <Badge
      variant="outline"
      data-testid="transaction-status-badge"
      className={`${config.classes} text-[10px] px-2 py-0.5 font-medium border rounded-full inline-flex items-center gap-1.5`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
};
