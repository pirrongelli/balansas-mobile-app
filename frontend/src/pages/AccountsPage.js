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
import { AccountsSkeleton } from '@/components/shared/LoadingSkeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronRight, Plus, Bitcoin } from 'lucide-react';

export default function AccountsPage() {
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fiatAccounts, setFiatAccounts] = useState([]);
  const [cryptoAccounts, setCryptoAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('fiat');

  const fetchAccounts = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setError(null);
      const { data: frAccounts } = await supabase
        .from('fr_fiat_accounts')
        .select('*')
        .eq('customer_id', customer.id);

      const { data: railAccounts } = await supabase
        .from('rail_accounts')
        .select('*')
        .eq('customer_id', customer.id);

      const allFiat = [
        ...(frAccounts || []).map(a => ({ ...a, provider: 'fiat_republic' })),
        ...(railAccounts || []).map(a => ({ ...a, provider: 'rail_io' })),
      ];
      setFiatAccounts(allFiat);

      const { data: cryptoData } = await supabase
        .from('rail_crypto_accounts')
        .select('*')
        .eq('customer_id', customer.id);
      setCryptoAccounts(cryptoData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const getCurrencyFlag = (currency) => {
    const flags = { EUR: 'EU', GBP: 'GB', USD: 'US', MXN: 'MX', AED: 'AE' };
    return flags[currency] || currency?.slice(0, 2) || '??';
  };

  const getCryptoIcon = (asset) => {
    const icons = { BTC: 'BT', ETH: 'ET', USDC: 'UC', USDT: 'UT' };
    return icons[asset] || asset?.slice(0, 2) || '??';
  };

  if (loading) return (
    <>
      <TopHeader title="Accounts" />
      <AccountsSkeleton />
    </>
  );

  if (error) return (
    <>
      <TopHeader title="Accounts" />
      <ErrorState message={error} onRetry={fetchAccounts} />
    </>
  );

  return (
    <div data-testid="accounts-page">
      <TopHeader title="Accounts" />

      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 bg-[hsl(var(--surface-2))] mb-4">
            <TabsTrigger value="fiat" data-testid="accounts-tab-fiat" className="text-xs">
              Fiat ({fiatAccounts.length})
            </TabsTrigger>
            <TabsTrigger value="crypto" data-testid="accounts-tab-crypto" className="text-xs">
              Crypto ({cryptoAccounts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fiat">
            {fiatAccounts.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No fiat accounts"
                description="Your fiat accounts will appear here"
              />
            ) : (
              <div className="space-y-2">
                {fiatAccounts.map((account, i) => (
                  <div
                    key={account.id || i}
                    data-testid={`account-row-${i}`}
                    onClick={() => navigate(`/accounts/${account.provider}/${account.id}`)}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent)/0.7)] cursor-pointer transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent-teal)/0.12)] flex items-center justify-center text-xs font-bold text-[hsl(var(--accent-teal))]">
                        {getCurrencyFlag(account.currency)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[150px]">
                          {account.label || account.name || `${account.currency} Account`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ProviderBadge provider={account.provider} size="xs" />
                          {account.status && <StatusBadge status={account.status} />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencyDisplay amount={account.balance} currency={account.currency} size="sm" />
                      <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="crypto">
            {cryptoAccounts.length === 0 ? (
              <EmptyState
                icon={Bitcoin}
                title="No crypto accounts"
                description="Crypto accounts from US Rails will appear here"
              />
            ) : (
              <div className="space-y-2">
                {cryptoAccounts.map((account, i) => (
                  <div
                    key={account.id || i}
                    data-testid={`crypto-account-row-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent)/0.7)] cursor-pointer transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--provider-us)/0.12)] flex items-center justify-center text-xs font-bold text-[hsl(var(--provider-us))]">
                        {getCryptoIcon(account.asset_type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{account.asset_type || 'Crypto'}</p>
                        <ProviderBadge provider="rail_io" size="xs" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {Number(account.balance || 0).toFixed(8)}
                      </p>
                      {account.pending_balance > 0 && (
                        <p className="text-[10px] text-[hsl(var(--status-warning))]">Pending: {Number(account.pending_balance).toFixed(8)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
