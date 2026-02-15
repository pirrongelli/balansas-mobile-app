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
      
      // Debug: log first payee to see field names
      if (payeeData?.length > 0) {
        console.log('[DEBUG] Sample payee fields:', Object.keys(payeeData[0]));
        console.log('[DEBUG] Sample payee data:', JSON.stringify(payeeData[0], null, 2));
      }

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

  const calculateFee = async () => {
    if (!selectedAccount || !amount) return;
    try {
      const { data, error: feeErr } = await supabase.functions.invoke('calculate-fee', {
        body: {
          amount: parseFloat(amount),
          currency: selectedAccount.currency,
          transactionType: 'PAYMENT',
          provider: selectedAccount.provider === 'fiat_republic' ? 'fiat_republic' : 'rail_io',
          customerId: customer.id,
        },
      });
      if (feeErr) {
        setFeeData(null);
      } else {
        setFeeData(data);
      }
    } catch {
      setFeeData(null);
    }
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    try {
      if (selectedAccount.provider === 'fiat_republic') {
        const { data, error: payErr } = await supabase.functions.invoke('fr-proxy', {
          body: {
            endpoint: '/api/v1/payments',
            method: 'POST',
            customerId: customer.id,
            body: {
              sourceAccountId: selectedAccount.fr_account_id || selectedAccount.id,
              payeeId: selectedPayee.fr_payee_id || selectedPayee.id,
              amount: parseFloat(amount),
              currency: selectedAccount.currency,
              reference: reference || 'Payment',
            },
          },
        });
        if (payErr) throw payErr;
        setSubmitResult({ success: true, data });
      } else {
        const { data, error: payErr } = await supabase.functions.invoke('rail-proxy', {
          body: {
            customerId: customer.id,
            endpoint: '/withdrawals',
            method: 'POST',
            body: {
              source_account_id: selectedAccount.rail_account_id || selectedAccount.id,
              amount: parseFloat(amount),
              reference: reference || 'Payment',
            },
          },
        });
        if (payErr) throw payErr;
        setSubmitResult({ success: true, data });
      }
      toast.success('Payment created successfully');
    } catch (err) {
      setSubmitResult({ success: false, error: err.message });
      toast.error('Payment failed', { description: err.message });
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
      case 1: return !!selectedAccount && !!amount && parseFloat(amount) > 0;
      case 2: return true;
      default: return false;
    }
  };

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
            <div className="space-y-2">
              {payees.map((payee, i) => (
                <div
                  key={payee.id || i}
                  data-testid={`payee-row-${i}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[hsl(var(--surface-2))] flex items-center justify-center text-xs font-bold text-[hsl(var(--foreground))]">
                      {(payee.name || payee.label || '??').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate max-w-[180px]">
                        {payee.name || payee.label || 'Payee'}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {payee.currency || ''} {payee.iban ? `• ${payee.iban.slice(0, 4)}...${payee.iban.slice(-4)}` : ''}
                      </p>
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
              <div className="space-y-2">
                <Label className="text-sm">Choose a payee</Label>
                {payees.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">No payees available</p>
                ) : (
                  payees.map((payee, i) => (
                    <div
                      key={payee.id || i}
                      data-testid={`wizard-payee-${i}`}
                      onClick={() => setSelectedPayee(payee)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 border cursor-pointer transition-colors duration-150 ${
                        selectedPayee?.id === payee.id
                          ? 'border-[hsl(var(--accent-teal))] bg-[hsl(var(--accent-teal)/0.08)]'
                          : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[hsl(var(--surface-2))] flex items-center justify-center text-xs font-bold">
                        {(payee.name || '??').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{payee.name || payee.label}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{payee.currency}</p>
                      </div>
                      {selectedPayee?.id === payee.id && (
                        <Check className="h-5 w-5 text-[hsl(var(--accent-teal))]" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 1: Amount */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Source Account</Label>
                  <Select
                    value={selectedAccount?.id || ''}
                    onValueChange={(val) => setSelectedAccount(accounts.find(a => a.id === val))}
                  >
                    <SelectTrigger className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]" data-testid="payment-account-select">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.label || acc.name || acc.currency} - {formatCurrency(acc.balance, acc.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label className="text-sm">Reference (optional)</Label>
                  <Input
                    data-testid="payment-reference-input"
                    placeholder="Payment reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-[hsl(var(--surface-2))] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">To</span>
                    <span className="text-sm font-medium">{selectedPayee?.name || selectedPayee?.label}</span>
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
                  {reference && (
                    <div className="flex justify-between">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Reference</span>
                      <span className="text-sm">{reference}</span>
                    </div>
                  )}
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
