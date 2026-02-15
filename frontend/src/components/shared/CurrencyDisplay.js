import { formatCurrency } from '@/lib/formatters';

export const CurrencyDisplay = ({ amount, currency, size = 'md', className = '' }) => {
  const formatted = formatCurrency(amount, currency);
  const parts = formatted.split(' ');
  const cur = parts[0];
  const num = parts.slice(1).join(' ');

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <span data-testid="account-balance-amount" className={`tabular-nums font-semibold ${className}`}>
      <span className="text-[hsl(var(--muted-foreground))] text-[0.7em] font-medium mr-1">{cur}</span>
      <span className={sizeClasses[size] || sizeClasses.md}>{num}</span>
    </span>
  );
};
