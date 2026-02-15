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
    type: 'INDIVIDUAL', addressLine1: '', city: '', country: '', postalCode: ''
  });

  const fetchPayees = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setError(null);
      const { data } = await supabase
        .from('fr_payees')
        .select('*')
        .eq('customer_id', customer.id);
      setPayees(data || []);
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
          addressLine1: form.addressLine1 || 'N/A',
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
        type: 'INDIVIDUAL', addressLine1: '', city: '', country: '', postalCode: ''
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
    return (p.payee_name || '').toLowerCase().includes(s) || (p.bank_name || '').toLowerCase().includes(s) || (p.account_number || '').toLowerCase().includes(s);
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
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--surface-2))] flex items-center justify-center text-xs font-bold text-[hsl(var(--foreground))]">
                  {getPayeeName(payee).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getPayeeName(payee)}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    {payee.currency || ''}
                    {payee.account_number ? ` • ${payee.account_number.slice(0, 4)}...${payee.account_number.slice(-4)}` : ''}
                    {payee.bank_name ? ` • ${payee.bank_name}` : ''}
                  </p>
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
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
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
                  <Label className="text-sm">Address Line</Label>
                  <Input
                    placeholder="123 Main Street"
                    value={form.addressLine1}
                    onChange={(e) => setForm(f => ({ ...f, addressLine1: e.target.value }))}
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
                  <Label className="text-sm">Country Code</Label>
                  <Input
                    placeholder="GB, DE, US..."
                    value={form.country}
                    onChange={(e) => setForm(f => ({ ...f, country: e.target.value.toUpperCase() }))}
                    maxLength={2}
                    className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                  />
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
