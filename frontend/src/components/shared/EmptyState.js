import { Button } from '@/components/ui/button';

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div data-testid="empty-state" className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--surface-2))] flex items-center justify-center mb-5">
          <Icon className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[hsl(var(--foreground))] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-[240px] mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button data-testid="empty-state-action" onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
