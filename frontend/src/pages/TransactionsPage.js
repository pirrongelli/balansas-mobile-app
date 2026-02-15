import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TopHeader } from '@/components/layout/TopHeader';
import { ProviderBadge } from '@/components/shared/ProviderBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { TransactionsSkeleton } from '@/components/shared/LoadingSkeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Search, Filter, X } from 'lucide-react';
import { formatCurrency, formatDate, getTxDisplayName, isTxIncoming, formatTxType, normalizeStatus } from '@/lib/formatters';

export default function TransactionsPage() {
  const { customer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchTransactions = useCallback(async (offset = 0, append = false) => {
    if (!customer?.id) return;
    try {
      setError(null);
      if (!append) setLoading(true);

      const { data: frTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      const { data: railTx } = await supabase
        .from('rail_transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      const newTx = [
        ...(frTx || []).map(t => ({ ...t, provider: 'fiat_republic' })),
        ...(railTx || []).map(t => ({ ...t, provider: 'rail_io' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (append) {
        setTransactions(prev => [...prev, ...newTx]);
      } else {
        setTransactions(newTx);
      }
      setHasMore(newTx.length >= PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [customer?.id]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchTransactions(transactions.length, true);
  };

  // Filter transactions
  const filtered = transactions.filter(tx => {
    if (statusFilter !== 'all' && normalizeStatus(tx.status) !== statusFilter) return false;
    if (providerFilter !== 'all' && tx.provider !== providerFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const matchName = (tx.counterparty_name || '').toLowerCase().includes(searchLower);
      const matchDesc = (tx.description || '').toLowerCase().includes(searchLower);
      const matchRef = (tx.reference || '').toLowerCase().includes(searchLower);
      const matchType = (tx.transaction_type || tx.type || '').toLowerCase().includes(searchLower);
      if (!matchName && !matchDesc && !matchRef && !matchType) return false;
    }
    return true;
  });

  if (loading) return (
    <>
      <TopHeader title="Transactions" />
      <TransactionsSkeleton />
    </>
  );

  if (error) return (
    <>
      <TopHeader title="Transactions" />
      <ErrorState message={error} onRetry={() => fetchTransactions()} />
    </>
  );

  return (
    <div data-testid="transactions-page">
      <TopHeader
        title="Transactions"
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            data-testid="toggle-filters"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 w-9 rounded-full ${showFilters ? 'text-[hsl(var(--accent-teal))]' : ''}`}
          >
            <Filter className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            data-testid="transactions-search"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full grid grid-cols-4 bg-[hsl(var(--surface-2))]">
            <TabsTrigger value="all" className="text-[10px]" data-testid="filter-all">All</TabsTrigger>
            <TabsTrigger value="completed" className="text-[10px]" data-testid="filter-completed">Completed</TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px]" data-testid="filter-pending">Pending</TabsTrigger>
            <TabsTrigger value="failed" className="text-[10px]" data-testid="filter-failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="flex gap-2">
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="h-9 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))] text-xs" data-testid="filter-provider">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="fiat_republic">EU Rails</SelectItem>
                <SelectItem value="rail_io">US Rails</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results count */}
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Transaction List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title={search ? 'No results found' : 'No transactions yet'}
            description={search ? 'Try a different search term' : 'Your activity will show up here'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const incoming = isTxIncoming(tx);
              return (
                <div
                  key={tx.id || i}
                  data-testid={`transaction-item-${i}`}
                  className="flex items-start justify-between gap-3 rounded-xl px-3.5 py-3.5 hover:bg-[hsl(var(--accent))] bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] transition-colors duration-150"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      incoming ? 'bg-[hsl(var(--status-success)/0.12)]' : 'bg-[hsl(var(--surface-2))]'
                    }`}>
                      {incoming
                        ? <ArrowDownLeft className="h-4 w-4 text-[hsl(var(--status-success))]" />
                        : <ArrowUpRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[160px]">
                        {getTxDisplayName(tx)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-[hsl(var(--accent-teal))] font-medium">{formatTxType(tx.transaction_type || tx.type)}</span>
                        <ProviderBadge provider={tx.provider} size="xs" />
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {formatDate(tx.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold tabular-nums ${
                      incoming ? 'text-[hsl(var(--status-success))]' : ''
                    }`}>
                      {incoming ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4 pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="load-more-transactions"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
