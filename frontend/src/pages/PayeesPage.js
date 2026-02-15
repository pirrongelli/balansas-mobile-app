import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TopHeader } from '@/components/layout/TopHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPayeeName } from '@/lib/formatters';
import { ProviderBadge } from '@/components/shared/ProviderBadge';

export default function PayeesPage() {
  const { customer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payees, setPayees] = useState([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ 
    name: '', currency: 'EUR', iban: '', bic: '', accountNumber: '', sortCode: '', routingNumber: '',
    type: 'PERSON', line1: '', city: '', country: 'GB', postalCode: ''
  });

  const fetchPayees = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setError(null);
      // Fetch EU Rails payees
      const { data: frData } = await supabase
        .from('fr_payees')
        .select('*')
        .eq('customer_id', customer.id);
      
      // Fetch US Rails counterparties
      const { data: railData } = await supabase
        .from('rail_counterparties')
        .select('*')
        .eq('customer_id', customer.id);

      const allPayees = [
        ...(frData || []).map(p => ({ ...p, provider: 'fiat_republic' })),
        ...(railData || []).map(p => ({ ...p, provider: 'rail_io' })),
      ];
      setPayees(allPayees);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => { fetchPayees(); }, [fetchPayees]);

  const handleCreate = async () => {
    if (!form.name) {
      setCreateError('Name is required');
      return;
    }
    setIsCreating(true);
    setCreateError('');
    try {
      const body = {
        name: form.name,
        currency: form.currency,
        type: form.type,
        address: {
          line1: form.line1 || 'N/A',
          city: form.city || 'N/A',
          country: form.country || 'GB',
          postalCode: form.postalCode || 'N/A',
        },
        bankDetails: {},
      };

      if (form.currency === 'EUR') {
        body.bankDetails = {
          iban: form.iban,
          bic: form.bic || undefined,
        };
      } else if (form.currency === 'GBP') {
        body.bankDetails = {
          accountNumber: form.accountNumber,
          sortCode: form.sortCode,
        };
      } else {
        body.bankDetails = {
          accountNumber: form.accountNumber,
          routingNumber: form.routingNumber,
        };
      }

      console.log('[Payee] Create payload:', body);

      const response = await supabase.functions.invoke('fr-proxy', {
        body: {
          endpoint: '/api/v1/payees',
          method: 'POST',
          customerId: customer.id,
          body,
        },
      });

      if (response.error) {
        let errorDetail = response.error.message;
        if (response.error.context) {
          try {
            const errBody = await response.error.context.json();
            console.log('[Payee] Error body:', errBody);
            const warnings = errBody?.warnings?.map(w => `${w.position}: ${w.issue}`).join(', ');
            errorDetail = warnings || errBody?.message || errorDetail;
          } catch { /* ignore */ }
        }
        throw new Error(errorDetail);
      }

      if (response.data?.errorCode) {
        const warnings = response.data.warnings?.map(w => `${w.position}: ${w.issue}`).join(', ');
        throw new Error(warnings || response.data.message);
      }

      toast.success('Payee created successfully');
      setShowCreate(false);
      setForm({ 
        name: '', currency: 'EUR', iban: '', bic: '', accountNumber: '', sortCode: '', routingNumber: '',
        type: 'PERSON', line1: '', city: '', country: 'GB', postalCode: ''
      });
      fetchPayees();
    } catch (err) {
      setCreateError(err.message || 'Failed to create payee');
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = payees.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    // Search across both payee and counterparty fields
    return (p.payee_name || '').toLowerCase().includes(s) 
      || (p.name || '').toLowerCase().includes(s)
      || (p.bank_name || '').toLowerCase().includes(s) 
      || (p.account_number || '').toLowerCase().includes(s)
      || (p.currency || '').toLowerCase().includes(s)
      || (p.provider || '').toLowerCase().includes(s);
  });

  if (loading) return (
    <>
      <TopHeader title="Payees" showBack />
      <div className="px-4 pt-4 space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </>
  );

  if (error) return (
    <>
      <TopHeader title="Payees" showBack />
      <ErrorState message={error} onRetry={fetchPayees} />
    </>
  );

  return (
    <div data-testid="payees-page">
      <TopHeader
        title="Payees"
        showBack
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            data-testid="payees-create-button"
            onClick={() => setShowCreate(true)}
            className="h-9 w-9 rounded-full"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            data-testid="payees-search-input"
            placeholder="Search payees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </button>
          )}
        </div>

        <p className="text-xs text-[hsl(var(--muted-foreground))]">{filtered.length} payee{filtered.length !== 1 ? 's' : ''}</p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'No payees found' : 'No payees saved'}
            description={search ? 'Try a different search' : 'Add a payee to send money faster'}
            actionLabel={!search ? 'Add Payee' : undefined}
            onAction={!search ? () => setShowCreate(true) : undefined}
          />
        ) : (
          <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden divide-y divide-[hsl(var(--border))]">
            {filtered.map((payee, i) => (
              <div
                key={payee.id || i}
                data-testid={`payee-item-${i}`}
                className="flex items-center gap-3 px-4 py-4 bg-[hsl(var(--surface-1))] hover:bg-[hsl(var(--accent))] transition-colors duration-150"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  payee.provider === 'rail_io'
                    ? 'bg-[hsl(var(--provider-us)/0.12)] text-[hsl(var(--provider-us))]'
                    : 'bg-[hsl(var(--accent-teal)/0.12)] text-[hsl(var(--accent-teal))]'
                }`}>
                  {getPayeeName(payee).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getPayeeName(payee)}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <ProviderBadge provider={payee.provider} size="xs" />
                    {payee.currency && (
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{payee.currency}</span>
                    )}
                    {payee.status && (
                      <span className={`text-[10px] ${payee.status === 'active' || payee.status === 'ACTIVE' ? 'text-[hsl(var(--status-success))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                        {payee.status}
                      </span>
                    )}
                  </div>
                  {(payee.account_number || payee.bank_name) && (
                    <p className="text-[10px] text-[hsl(var(--text-3))] mt-0.5 tabular-nums">
                      {payee.bank_name ? `${payee.bank_name}` : ''}
                      {payee.account_number ? `${payee.bank_name ? ' • ' : ''}${payee.account_number.slice(0, 4)}...${payee.account_number.slice(-4)}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Payee Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="bottom" className="bg-[hsl(var(--card))] border-[hsl(var(--border))] rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add New Payee</SheetTitle>
            <SheetDescription>Enter the recipient's banking details</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            {createError && (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.08)] rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Payee Name <span className="text-[hsl(var(--status-danger))]">*</span></Label>
              <Input
                placeholder="Full name or company name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                data-testid="payee-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSON">Individual</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]" data-testid="payee-currency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="pt-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3 uppercase tracking-wider">Address</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Address Line <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                  <Input
                    placeholder="123 Main Street"
                    value={form.line1}
                    onChange={(e) => setForm(f => ({ ...f, line1: e.target.value }))}
                    className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">City</Label>
                    <Input
                      placeholder="London"
                      value={form.city}
                      onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                      className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Postal Code</Label>
                    <Input
                      placeholder="SW1A 1AA"
                      value={form.postalCode}
                      onChange={(e) => setForm(f => ({ ...f, postalCode: e.target.value }))}
                      className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Country</Label>
                  <Select value={form.country} onValueChange={(v) => setForm(f => ({ ...f, country: v }))}>
                    <SelectTrigger className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                      {[
                        { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
                        { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua & Barbuda' },
                        { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
                        { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
                        { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
                        { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
                        { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
                        { code: 'BA', name: 'Bosnia & Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
                        { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'KH', name: 'Cambodia' },
                        { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' },
                        { code: 'CN', name: 'China' }, { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' },
                        { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
                        { code: 'DK', name: 'Denmark' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
                        { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' }, { code: 'EE', name: 'Estonia' },
                        { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
                        { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
                        { code: 'GR', name: 'Greece' }, { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' },
                        { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' },
                        { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' }, { code: 'IE', name: 'Ireland' },
                        { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
                        { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
                        { code: 'KE', name: 'Kenya' }, { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' },
                        { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LI', name: 'Liechtenstein' },
                        { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MY', name: 'Malaysia' },
                        { code: 'MT', name: 'Malta' }, { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' },
                        { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' },
                        { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
                        { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
                        { code: 'NI', name: 'Nicaragua' }, { code: 'NG', name: 'Nigeria' }, { code: 'MK', name: 'North Macedonia' },
                        { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
                        { code: 'PA', name: 'Panama' }, { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' },
                        { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' },
                        { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' }, { code: 'RW', name: 'Rwanda' },
                        { code: 'SA', name: 'Saudi Arabia' }, { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' },
                        { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' },
                        { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SE', name: 'Sweden' },
                        { code: 'CH', name: 'Switzerland' }, { code: 'TW', name: 'Taiwan' }, { code: 'TZ', name: 'Tanzania' },
                        { code: 'TH', name: 'Thailand' }, { code: 'TT', name: 'Trinidad & Tobago' }, { code: 'TN', name: 'Tunisia' },
                        { code: 'TR', name: 'Turkey' }, { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' },
                        { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
                        { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
                        { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' }, { code: 'ZM', name: 'Zambia' },
                        { code: 'ZW', name: 'Zimbabwe' },
                      ].map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="pt-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3 uppercase tracking-wider">Bank Details</p>
              <div className="space-y-3">
                {form.currency === 'EUR' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm">IBAN <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                      <Input
                        placeholder="DE89 3704 0044 0532 0130 00"
                        value={form.iban}
                        onChange={(e) => setForm(f => ({ ...f, iban: e.target.value }))}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">BIC / SWIFT</Label>
                      <Input
                        placeholder="COBADEFFXXX"
                        value={form.bic}
                        onChange={(e) => setForm(f => ({ ...f, bic: e.target.value }))}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                      />
                    </div>
                  </>
                )}

                {form.currency === 'GBP' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm">Account Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                      <Input
                        placeholder="12345678"
                        value={form.accountNumber}
                        onChange={(e) => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Sort Code <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                      <Input
                        placeholder="12-34-56"
                        value={form.sortCode}
                        onChange={(e) => setForm(f => ({ ...f, sortCode: e.target.value }))}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                      />
                    </div>
                  </>
                )}

                {form.currency === 'USD' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm">Account Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                      <Input
                        placeholder="123456789"
                        value={form.accountNumber}
                        onChange={(e) => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Routing Number <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                      <Input
                        placeholder="021000021"
                        value={form.routingNumber}
                        onChange={(e) => setForm(f => ({ ...f, routingNumber: e.target.value }))}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !form.name}
              className="w-full h-11 font-semibold"
              data-testid="payee-create-submit"
            >
              {isCreating ? 'Creating...' : 'Create Payee'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
