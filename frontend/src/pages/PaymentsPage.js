import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TopHeader } from '@/components/layout/TopHeader';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { ProviderBadge } from '@/components/shared/ProviderBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  SendHorizontal, ChevronRight, Users, ArrowRight,
  Check, AlertCircle, Loader2
} from 'lucide-react';
import { formatCurrency, getPayeeName } from '@/lib/formatters';
import { toast } from 'sonner';

const STEPS = ['Select Payee', 'Amount', 'Review', 'Confirm'];

export default function PaymentsPage() {
  const { customer, providers } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payees, setPayees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedPayee, setSelectedPayee] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [feeData, setFeeData] = useState(null);

  const fetchData = useCallback(async () => {
    if (!customer?.id) return;
    try {
      setError(null);
      const { data: payeeData } = await supabase
        .from('fr_payees')
        .select('*')
        .eq('customer_id', customer.id);
      setPayees(payeeData || []);

      const { data: frAccounts } = await supabase
        .from('fr_fiat_accounts')
        .select('*')
        .eq('customer_id', customer.id);
      const { data: railAccounts } = await supabase
        .from('rail_accounts')
        .select('*')
        .eq('customer_id', customer.id);
      setAccounts([
        ...(frAccounts || []).map(a => ({ ...a, provider: 'fiat_republic' })),
        ...(railAccounts || []).map(a => ({ ...a, provider: 'rail_io' })),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Format amount as proper decimal string: "500.00"
  const formatAmountForApi = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const calculateFee = async () => {
    if (!selectedAccount || !amount) return;
    try {
      const { data, error: feeErr } = await supabase.functions.invoke('calculate-fee', {
        body: {
          customer_id: customer.id,
          transaction_type: 'PAYMENT',
          currency: selectedAccount.currency,
          amount: formatAmountForApi(amount),
          provider: selectedAccount.provider === 'fiat_republic' ? 'fiat_republic' : 'rail_io',
        },
      });
      if (feeErr || data?.error) {
        console.warn('[Fee] Fee calculation unavailable:', feeErr || data?.error);
        setFeeData(null);
      } else {
        setFeeData(data);
      }
    } catch (err) {
      console.warn('[Fee] Fee calculation error:', err);
      setFeeData(null);
    }
  };

  // Determine payment scheme based on currency
  const getPaymentScheme = (currency) => {
    switch ((currency || '').toUpperCase()) {
      case 'EUR': return 'SCT';
      case 'GBP': return 'FPS';
      case 'USD': return 'ACH'; // ACH is more permissive than DOMESTIC_WIRE for references
      case 'AUD': return 'NPP';
      case 'CAD': return 'EMT_EAGLE_NET';
      default: return 'SWIFT';
    }
  };

  // Validate reference based on payment scheme
  const getReferenceHint = (currency) => {
    switch ((currency || '').toUpperCase()) {
      case 'USD': return 'Min 6 alphanumeric chars, max 17. Not all the same character.';
      case 'GBP': return 'Min 6 alphanumeric chars, max 17. Not all the same character.';
      case 'EUR': return 'Max 140 characters';
      default: return '';
    }
  };

  const isReferenceValid = (ref, currency) => {
    if (!ref || !ref.trim()) return false;
    const cur = (currency || '').toUpperCase();
    if (cur === 'USD' || cur === 'GBP') {
      // Strip optional chars (space, hyphen, dot, ampersand, slash) to count alphanumeric
      const alphanumOnly = ref.replace(/[\s\-\.&\/]/g, '');
      if (alphanumOnly.length < 6) return false;
      if (ref.length > 17) return false;
      // Check not all the same character
      if (new Set(alphanumOnly.toLowerCase()).size <= 1) return false;
      // Check alphanumeric only (plus allowed special chars)
      if (!/^[a-zA-Z0-9\s\-\.&\/]+$/.test(ref)) return false;
      return true;
    }
    return ref.trim().length > 0;
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    try {
      if (selectedAccount.provider === 'fiat_republic') {
        // EU Rails - Fiat Republic
        const paymentBody = {
          fromId: selectedAccount.fr_account_id || selectedAccount.id,
          toId: selectedPayee.fr_payee_id || selectedPayee.id,
          amount: formatAmountForApi(amount),
          currency: selectedAccount.currency,
          reference: reference.trim(),
          paymentScheme: getPaymentScheme(selectedAccount.currency),
        };

        console.log('[Payment] FR full request:', {
          endpoint: '/api/v1/payments',
          method: 'POST',
          customerId: customer.id,
          body: paymentBody,
        });

        const response = await supabase.functions.invoke('fr-proxy', {
          body: {
            endpoint: '/api/v1/payments',
            method: 'POST',
            customerId: customer.id,
            body: paymentBody,
          },
        });
        
        console.log('[Payment] FR response:', response);
        
        // Handle edge function errors - try to get response body
        if (response.error) {
          let errorDetail = response.error.message;
          // Try to read the response context for more details
          if (response.error.context) {
            try {
              const body = await response.error.context.json();
              console.log('[Payment] FR error body:', body);
              errorDetail = body?.message || body?.error || JSON.stringify(body?.warnings || body);
            } catch { /* ignore */ }
          }
          throw new Error(errorDetail);
        }
        
        if (response.data?.error || response.data?.errorCode) {
          const msg = response.data.message || response.data.error;
          const warnings = response.data.warnings?.map(w => `${w.position}: ${w.issue}`).join(', ');
          throw new Error(warnings || msg || 'Payment failed');
        }
        
        setSubmitResult({ success: true, data: response.data });
      } else {
        // US Rails - Rail.io withdrawal
        const withdrawalBody = {
          source_account_id: selectedAccount.rail_account_id || selectedAccount.id,
          amount: formatAmountForApi(amount),
          currency: selectedAccount.currency,
          reference: reference.trim(),
          purpose: reference.trim(),
        };

        console.log('[Payment] Rail full request:', {
          customerId: customer.id,
          endpoint: '/withdrawals',
          method: 'POST',
          body: withdrawalBody,
        });

        const response = await supabase.functions.invoke('rail-proxy', {
          body: {
            customerId: customer.id,
            endpoint: '/withdrawals',
            method: 'POST',
            body: withdrawalBody,
          },
        });
        
        console.log('[Payment] Rail response:', response);
        
        if (response.error) {
          let errorDetail = response.error.message;
          if (response.error.context) {
            try {
              const body = await response.error.context.json();
              console.log('[Payment] Rail error body:', body);
              errorDetail = body?.message || body?.error || JSON.stringify(body);
            } catch { /* ignore */ }
          }
          throw new Error(errorDetail);
        }
        
        if (response.data?.error || response.data?.errorCode) {
          throw new Error(response.data.message || response.data.error || 'Payment failed');
        }
        
        setSubmitResult({ success: true, data: response.data });
      }
      toast.success('Payment created successfully');
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err.message || 'Payment failed');
      console.error('[Payment] Error:', errorMsg);
      setSubmitResult({ success: false, error: errorMsg });
      toast.error('Payment failed', { description: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setShowWizard(false);
    setStep(0);
    setSelectedPayee(null);
    setSelectedAccount(null);
    setAmount('');
    setReference('');
    setSubmitResult(null);
    setFeeData(null);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedPayee;
      case 1: return !!selectedAccount && !!amount && parseFloat(amount) > 0 && isReferenceValid(reference, selectedPayee?.currency);
      case 2: return true;
      default: return false;
    }
  };

  // Filter accounts to match the selected payee's currency
  const matchingAccounts = selectedPayee
    ? accounts.filter(a => a.currency === selectedPayee.currency)
    : accounts;

  const handleNext = () => {
    if (step === 1) calculateFee();
    if (step === 2) {
      handleSubmitPayment();
      setStep(3);
      return;
    }
    setStep(s => s + 1);
  };

  if (loading) return (
    <>
      <TopHeader title="Payments" />
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </>
  );

  if (error) return (
    <>
      <TopHeader title="Payments" />
      <ErrorState message={error} onRetry={fetchData} />
    </>
  );

  return (
    <div data-testid="payments-page">
      <TopHeader title="Payments" />

      <div className="px-4 pt-5 space-y-5">
        {/* Create Payment Card */}
        <Card
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--accent))] active:scale-[0.98] transition-[background-color,transform] duration-150"
          onClick={() => setShowWizard(true)}
          data-testid="create-payment-card"
        >
          <CardContent className="pt-5 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[hsl(var(--accent-teal)/0.12)] flex items-center justify-center">
                <SendHorizontal className="h-5 w-5 text-[hsl(var(--accent-teal))]" />
              </div>
              <div>
                <p className="text-sm font-semibold">New Payment</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Send money to a payee</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-[hsl(var(--accent-teal))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Payees</span>
            </div>
            <p className="text-lg font-semibold tabular-nums">{payees.length}</p>
          </div>
          <div className="bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <SendHorizontal className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Accounts</span>
            </div>
            <p className="text-lg font-semibold tabular-nums">{accounts.length}</p>
          </div>
        </div>

        {/* Recent Payees */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Your Payees</h3>
          {payees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No payees saved"
              description="Add a payee to send faster"
              actionLabel="Add Payee"
              onAction={() => {}}
            />
          ) : (
            <div className="space-y-2.5">
              {payees.map((payee, i) => (
                <div
                  key={payee.id || i}
                  data-testid={`payee-row-${i}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3.5 bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent-teal)/0.1)] flex items-center justify-center text-xs font-bold text-[hsl(var(--accent-teal))] flex-shrink-0">
                      {getPayeeName(payee).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[160px]">
                        {getPayeeName(payee)}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        <span className="font-medium text-[hsl(var(--foreground)/0.7)]">{payee.currency || ''}</span>
                        {payee.bank_name ? ` • ${payee.bank_name}` : ''}
                      </p>
                      {payee.account_number && (
                        <p className="text-[10px] text-[hsl(var(--text-3))] tabular-nums">
                          {payee.account_number.slice(0, 4)}...{payee.account_number.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[hsl(var(--accent-teal))] text-xs"
                    onClick={() => {
                      setSelectedPayee(payee);
                      setShowWizard(true);
                      setStep(1);
                    }}
                    data-testid={`send-to-payee-${i}`}
                  >
                    Send
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) resetWizard(); }}>
        <DialogContent className="max-w-[420px] bg-[hsl(var(--card))] border-[hsl(var(--border))] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Payment</DialogTitle>
            <DialogDescription>
              {STEPS[step]}
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />

          <div className="space-y-4 py-2">
            {/* Step 0: Select Payee */}
            {step === 0 && (
              <div className="space-y-3">
                <Label className="text-sm">Choose a payee</Label>
                {payees.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">No payees available</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {payees.map((payee, i) => (
                      <div
                        key={payee.id || i}
                        data-testid={`wizard-payee-${i}`}
                        onClick={() => {
                          setSelectedPayee(payee);
                          // Reset account if currency changed
                          if (selectedAccount && selectedAccount.currency !== payee.currency) {
                            setSelectedAccount(null);
                          }
                        }}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3.5 border cursor-pointer transition-colors duration-150 ${
                          selectedPayee?.id === payee.id
                            ? 'border-[hsl(var(--accent-teal))] bg-[hsl(var(--accent-teal)/0.08)]'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] hover:bg-[hsl(var(--accent))]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--surface-2))] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getPayeeName(payee).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getPayeeName(payee)}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                            {payee.currency}{payee.bank_name ? ` • ${payee.bank_name}` : ''}
                            {payee.account_number ? ` • ${payee.account_number.slice(0, 4)}...${payee.account_number.slice(-4)}` : ''}
                          </p>
                        </div>
                        {selectedPayee?.id === payee.id && (
                          <Check className="h-5 w-5 text-[hsl(var(--accent-teal))] flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Amount */}
            {step === 1 && (
              <div className="space-y-4">
                {selectedPayee && (
                  <div className="bg-[hsl(var(--accent-teal)/0.06)] border border-[hsl(var(--accent-teal)/0.15)] rounded-lg px-3 py-2 text-xs text-[hsl(var(--accent-teal))]">
                    Sending to <span className="font-semibold">{getPayeeName(selectedPayee)}</span> in <span className="font-semibold">{selectedPayee.currency}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm">Source Account ({selectedPayee?.currency || ''})</Label>
                  {matchingAccounts.length === 0 ? (
                    <p className="text-sm text-[hsl(var(--status-warning))] py-2">No accounts available in {selectedPayee?.currency}</p>
                  ) : (
                    <Select
                      value={selectedAccount?.id || ''}
                      onValueChange={(val) => setSelectedAccount(matchingAccounts.find(a => a.id === val))}
                    >
                      <SelectTrigger className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]" data-testid="payment-account-select">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchingAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.label || acc.name || acc.currency} - {formatCurrency(acc.balance, acc.currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    data-testid="payment-amount-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 text-2xl font-semibold tabular-nums text-center bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                  />
                  {selectedAccount && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                      Available: {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Reference <span className="text-[hsl(var(--status-danger))]">*</span></Label>
                  <Input
                    data-testid="payment-reference-input"
                    placeholder="Payment reference (required)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    maxLength={selectedPayee?.currency === 'USD' ? 17 : 140}
                    className={`h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))] ${!reference.trim() && amount ? 'border-[hsl(var(--status-warning)/0.5)]' : ''}`}
                  />
                  {getReferenceHint(selectedPayee?.currency) && (
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{getReferenceHint(selectedPayee?.currency)}</p>
                  )}
                  {!reference.trim() && amount && (
                    <p className="text-[10px] text-[hsl(var(--status-warning))]">Reference is required to proceed</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-[hsl(var(--surface-2))] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">To</span>
                    <span className="text-sm font-medium">{getPayeeName(selectedPayee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">From</span>
                    <span className="text-sm font-medium">{selectedAccount?.label || selectedAccount?.name || selectedAccount?.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Amount</span>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(parseFloat(amount), selectedAccount?.currency)}</span>
                  </div>
                  {feeData?.fee > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Fee</span>
                        <span className="text-sm tabular-nums">{formatCurrency(feeData.fee, feeData.feeCurrency || selectedAccount?.currency)}</span>
                      </div>
                      <div className="border-t border-[hsl(var(--border))] pt-2 flex justify-between">
                        <span className="text-xs font-medium">Total</span>
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(parseFloat(amount) + (feeData.fee || 0), selectedAccount?.currency)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Reference</span>
                    <span className="text-sm">{reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Payment Scheme</span>
                    <span className="text-xs font-medium text-[hsl(var(--foreground))]">{getPaymentScheme(selectedAccount?.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Provider</span>
                    <ProviderBadge provider={selectedAccount?.provider} size="xs" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Result */}
            {step === 3 && (
              <div className="text-center py-4">
                {isSubmitting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--accent-teal))]" />
                    <p className="text-sm">Processing payment...</p>
                  </div>
                ) : submitResult?.success ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[hsl(var(--status-success)/0.12)] flex items-center justify-center">
                      <Check className="h-7 w-7 text-[hsl(var(--status-success))]" />
                    </div>
                    <p className="text-base font-semibold">Payment Created</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Your payment is being processed</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[hsl(var(--status-danger)/0.12)] flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-[hsl(var(--status-danger))]" />
                    </div>
                    <p className="text-base font-semibold">Payment Failed</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{submitResult?.error || 'Something went wrong'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {step < 3 && (
              <>
                {step > 0 && (
                  <Button variant="secondary" onClick={() => setStep(s => s - 1)}>
                    Back
                  </Button>
                )}
                <Button
                  data-testid="payment-confirm-button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  {step === 2 ? 'Confirm Payment' : 'Continue'}
                </Button>
              </>
            )}
            {step === 3 && !isSubmitting && (
              <Button onClick={resetWizard} className="flex-1">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
