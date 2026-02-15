import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => (
  <div data-testid="dashboard-skeleton" className="px-4 pt-6 space-y-6">
    <Skeleton className="h-40 rounded-2xl" />
    <div className="flex gap-3">
      <Skeleton className="h-16 flex-1 rounded-xl" />
      <Skeleton className="h-16 flex-1 rounded-xl" />
      <Skeleton className="h-16 flex-1 rounded-xl" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-5 w-32" />
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  </div>
);

export const AccountsSkeleton = () => (
  <div data-testid="accounts-skeleton" className="px-4 pt-4 space-y-3">
    {[1, 2, 3, 4, 5].map(i => (
      <Skeleton key={i} className="h-[72px] rounded-xl" />
    ))}
  </div>
);

export const TransactionsSkeleton = () => (
  <div data-testid="transactions-skeleton" className="px-4 pt-4 space-y-3">
    <Skeleton className="h-10 rounded-lg" />
    {[1, 2, 3, 4, 5, 6].map(i => (
      <Skeleton key={i} className="h-16 rounded-xl" />
    ))}
  </div>
);
