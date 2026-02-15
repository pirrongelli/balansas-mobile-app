import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TopHeader } from '@/components/layout/TopHeader';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { ProviderBadge } from '@/components/shared/ProviderBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate, maskIban, getTxDisplayName, isTxIncoming } from '@/lib/formatters';
import { toast } from 'sonner';

export default function AccountDetailPage() {
  const { provider, accountId } = useParams();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [copiedField, setCopiedField] = useState(null);

  const fetchAccountDetails = useCallback(async () => {
    if (!customer?.id || !accountId) return;
    try {
      setError(null);
      const table = provider === 'fiat_republic' ? 'fr_fiat_accounts' : 'rail_accounts';
      const { data, error: fetchErr } = await supabase
        .from(table)
        .select('*')
        .eq('id', accountId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (data) setAccount({ ...data, provider });

      // Fetch transactions
      const txTable = provider === 'fiat_republic' ? 'transactions' : 'rail_transactions';
      const { data: txData } = await supabase
        .from(txTable)
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions((txData || []).map(t => ({ ...t, provider })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customer?.id, accountId, provider]);

  useEffect(() => { fetchAccountDetails(); }, [fetchAccountDetails]);

  const copyToClipboard = async (value, fieldName) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldName);
      toast.success('Copied to clipboard', { description: fieldName });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (loading) return (
    <>
      <TopHeader title="Account" showBack />
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </>
  );

  if (error || !account) return (
    <>
      <TopHeader title="Account" showBack />
      <ErrorState message={error || 'Account not found'} onRetry={fetchAccountDetails} />
    </>
  );

  // Build banking details array
  const bankingDetails = [];
  if (account.iban) bankingDetails.push({ label: 'IBAN', value: account.iban });
  if (account.bic) bankingDetails.push({ label: 'BIC / SWIFT', value: account.bic });
  if (account.sort_code) bankingDetails.push({ label: 'Sort Code', value: account.sort_code });
  if (account.account_number) bankingDetails.push({ label: 'Account Number', value: account.account_number });
  if (account.routing_number) bankingDetails.push({ label: 'Routing Number', value: account.routing_number });
  if (account.clabe) bankingDetails.push({ label: 'CLABE', value: account.clabe });

  return (
    <div data-testid="account-detail-page">
      <TopHeader
        title={account.label || account.name || `${account.currency} Account`}
        showBack
      />

      <div className="px-4 pt-5 space-y-4">
        {/* Balance Card */}
        <Card className="relative overflow-hidden bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-[0_10px_30px_hsl(var(--shadow-color)/0.35)]">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 35%)' }}
          />
          <CardContent className="pt-5 pb-5 relative">
            <div className="flex items-center justify-between mb-3">
              <ProviderBadge provider={account.provider} />
              {account.status && <StatusBadge status={account.status} />}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Available Balance</p>
            <CurrencyDisplay amount={account.balance} currency={account.currency} size="xl" />
            {account.pending_balance > 0 && (
              <p className="text-xs text-[hsl(var(--status-warning))] mt-2">
                Pending: {formatCurrency(account.pending_balance, account.currency)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Banking Details */}
        {bankingDetails.length > 0 && (
          <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
            <CardContent className="pt-4 pb-4">
              <h3 className="text-sm font-semibold mb-3">Banking Details</h3>
              <div className="space-y-4">
                {bankingDetails.map(detail => (
                  <div key={detail.label} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-0.5">{detail.label}</p>
                      <p className="text-sm font-medium tabular-nums truncate">{detail.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`copy-${detail.label.toLowerCase().replace(/\s+/g, '-')}-button`}
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => copyToClipboard(detail.value, detail.label)}
                    >
                      {copiedField === detail.label
                        ? <Check className="h-3.5 w-3.5 text-[hsl(var(--status-success))]" />
                        : <Copy className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No transactions yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden divide-y divide-[hsl(var(--border))]">
              {transactions.slice(0, 10).map((tx, i) => {
                const incoming = isTxIncoming(tx);
                return (
                  <div
                    key={tx.id || i}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 bg-[hsl(var(--surface-1))] hover:bg-[hsl(var(--accent))] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        incoming ? 'bg-[hsl(var(--status-success)/0.12)]' : 'bg-[hsl(var(--surface-2))]'
                      }`}>
                        {incoming
                          ? <ArrowDownLeft className="h-3.5 w-3.5 text-[hsl(var(--status-success))]" />
                          : <ArrowUpRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[140px]">
                          {getTxDisplayName(tx)}
                        </p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-semibold tabular-nums ${incoming ? 'text-[hsl(var(--status-success))]' : ''}`}>
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
