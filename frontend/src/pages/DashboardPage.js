import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TopHeader } from '@/components/layout/TopHeader';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { ProviderBadge } from '@/components/shared/ProviderBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { DashboardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet, SendHorizontal, UserPlus, ChevronRight, ArrowDownLeft,
  ArrowUpRight, RefreshCw, Bell, ArrowLeftRight, TrendingUp
} from 'lucide-react';
import { formatCurrency, formatDate, getTxDisplayName, isTxIncoming, formatTxType } from '@/lib/formatters';

export default function DashboardPage() {
  const { customer, user, providers, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setError(null);
      // Fetch FR accounts
      const { data: frAccounts, error: frErr } = await supabase
        .from('fr_fiat_accounts')
        .select('*')
        .eq('customer_id', customer.id);

      // Fetch Rail accounts
      const { data: railAccounts, error: railErr } = await supabase
        .from('rail_accounts')
        .select('*')
        .eq('customer_id', customer.id);

      const allAccounts = [
        ...(frAccounts || []).map(a => ({ ...a, provider: 'fiat_republic' })),
        ...(railAccounts || []).map(a => ({ ...a, provider: 'rail_io' })),
      ];
      setAccounts(allAccounts);

      // Fetch recent transactions from both providers
      const { data: frTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: railTx } = await supabase
        .from('rail_transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const allTx = [
        ...(frTx || []).map(t => ({ ...t, provider: 'fiat_republic' })),
        ...(railTx || []).map(t => ({ ...t, provider: 'rail_io' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      setTransactions(allTx);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customer?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!customer?.id) return;
    const channel = supabase.channel(`dashboard-${customer.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fr_fiat_accounts', filter: `customer_id=eq.${customer.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rail_accounts', filter: `customer_id=eq.${customer.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `customer_id=eq.${customer.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rail_transactions', filter: `customer_id=eq.${customer.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [customer?.id, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate totals by currency
  const balanceByCurrency = accounts.reduce((acc, a) => {
    const cur = a.currency || 'USD';
    acc[cur] = (acc[cur] || 0) + (Number(a.balance) || 0);
    return acc;
  }, {});

  const primaryCurrency = Object.keys(balanceByCurrency)[0] || 'EUR';
  const totalBalance = Object.values(balanceByCurrency).reduce((s, v) => s + v, 0);

  if (loading) return (
    <>
      <TopHeader
        title="Dashboard"
        rightAction={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
        }
      />
      <DashboardSkeleton />
    </>
  );

  if (error) return (
    <>
      <TopHeader title="Dashboard" />
      <ErrorState message={error} onRetry={fetchData} />
    </>
  );

  const greeting = customer?.first_name
    ? `Hello, ${customer.first_name}`
    : (customer?.business_name ? customer.business_name : 'Welcome');

  return (
    <div data-testid="dashboard-page">
      <TopHeader
        title="Dashboard"
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            data-testid="refresh-dashboard"
            onClick={handleRefresh}
            className="h-9 w-9 rounded-full"
            disabled={refreshing}
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      <div className="px-4 pt-5 space-y-6">
        {/* Greeting */}
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{greeting}</p>
          <p className="text-xs text-[hsl(var(--text-3))] mt-0.5">
            {customer?.customer_type?.replace(/_/g, ' ') || 'Customer'}
          </p>
        </div>

        {/* Balance Card */}
        <Card className="relative overflow-hidden bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-[0_10px_30px_hsl(var(--shadow-color)/0.35)]">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 35%)' }}
          />
          <CardContent className="pt-5 pb-5 relative">
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium mb-2 uppercase tracking-wider">
              Total Balance
            </p>
            <div className="mb-4" data-testid="total-balance">
              <CurrencyDisplay amount={totalBalance} currency={primaryCurrency} size="xl" />
            </div>

            {/* Currency chips */}
            {Object.keys(balanceByCurrency).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(balanceByCurrency).map(([cur, bal]) => (
                  <div
                    key={cur}
                    className="flex items-center gap-1.5 bg-[hsl(var(--surface-2))] rounded-full px-3 py-1.5"
                  >
                    <span className="text-[10px] font-semibold text-[hsl(var(--accent-teal))]">{cur}</span>
                    <span className="text-xs tabular-nums text-[hsl(var(--foreground))]">
                      {Number(bal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: SendHorizontal, label: 'Send', path: '/payments', testId: 'quick-action-send' },
            { icon: ArrowDownLeft, label: 'Receive', path: '/accounts', testId: 'quick-action-receive' },
            { icon: UserPlus, label: 'Add Payee', path: '/payees', testId: 'quick-action-payee' },
          ].map(action => (
            <button
              key={action.label}
              data-testid={action.testId}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] active:scale-[0.98] transition-[background-color,transform] duration-150"
            >
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent-teal)/0.12)] flex items-center justify-center">
                <action.icon className="h-[18px] w-[18px] text-[hsl(var(--accent-teal))]" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-[hsl(var(--accent-teal))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Accounts</span>
            </div>
            <p className="text-lg font-semibold tabular-nums" data-testid="stats-accounts">{accounts.length}</p>
          </div>
          <div className="bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <ArrowLeftRight className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Transactions</span>
            </div>
            <p className="text-lg font-semibold tabular-nums" data-testid="stats-transactions">{transactions.length}</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold tracking-wide">Recent Activity</h3>
            <Button
              variant="ghost"
              size="sm"
              data-testid="view-all-transactions"
              onClick={() => navigate('/transactions')}
              className="text-xs text-[hsl(var(--accent-teal))] h-8 px-2"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transactions yet"
              description="Your activity will show up here"
            />
          ) : (
            <div className="space-y-1">
              {transactions.map((tx, i) => {
                const incoming = isTxIncoming(tx);
                return (
                  <div
                    key={tx.id || i}
                    data-testid={`transaction-row-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent)/0.7)] cursor-pointer transition-colors duration-150"
                    onClick={() => navigate('/transactions')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        incoming
                          ? 'bg-[hsl(var(--status-success)/0.12)]'
                          : 'bg-[hsl(var(--surface-2))]'
                      }`}>
                        {incoming
                          ? <ArrowDownLeft className="h-4 w-4 text-[hsl(var(--status-success))]" />
                          : <ArrowUpRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[140px]">
                          {getTxDisplayName(tx)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[hsl(var(--accent-teal))]">{formatTxType(tx.transaction_type || tx.type)}</span>
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
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
