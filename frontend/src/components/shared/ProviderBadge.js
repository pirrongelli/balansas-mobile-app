import { Badge } from '@/components/ui/badge';

export const ProviderBadge = ({ provider, size = 'sm' }) => {
  const isEU = provider === 'fiat_republic' || provider === 'eu';
  const label = isEU ? 'EU Rails' : 'US Rails';

  const classes = isEU
    ? 'bg-[hsl(var(--provider-eu)/0.12)] text-[hsl(var(--provider-eu))] border-[hsl(var(--provider-eu)/0.25)]'
    : 'bg-[hsl(var(--provider-us)/0.12)] text-[hsl(var(--provider-us))] border-[hsl(var(--provider-us)/0.25)]';

  return (
    <Badge
      variant="outline"
      data-testid="accounts-provider-badge"
      className={`${classes} ${size === 'xs' ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5'} font-medium border rounded-full`}
    >
      {label}
    </Badge>
  );
};
