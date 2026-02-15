import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, AlertCircle, Smartphone, KeyRound, Loader2 } from 'lucide-react';

export default function MfaVerifyPage() {
  const { mfaFactors, verifyMfa, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isVerifyingRef = useRef(false);

  // Find the best factor to use - prefer TOTP, then phone
  const totpFactors = mfaFactors.filter(f => f.factor_type === 'totp' && f.status === 'verified');
  const phoneFactors = mfaFactors.filter(f => f.factor_type === 'phone' && f.status === 'verified');
  const allVerified = [...totpFactors, ...phoneFactors];
  const factor = allVerified[0] || mfaFactors[0]; // Fallback to first available

  const factorType = factor?.factor_type || 'totp';
  const isPhone = factorType === 'phone';

  useEffect(() => {
    console.log('[MFA Page] Factors available:', mfaFactors.length, mfaFactors.map(f => ({
      id: f.id, type: f.factor_type, status: f.status, friendly: f.friendly_name
    })));
  }, [mfaFactors]);

  const doVerify = useCallback(async (verifyCode) => {
    if (isVerifyingRef.current) {
      console.log('[MFA Page] Already verifying, skipping duplicate call');
      return;
    }
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    if (!factor) {
      setError('No MFA factor found. Please contact support.');
      console.error('[MFA] No factor available. All factors:', mfaFactors);
      return;
    }
    
    isVerifyingRef.current = true;
    setIsLoading(true);
    setError('');
    try {
      console.log('[MFA Page] Starting verification with code length:', verifyCode.length);
      await verifyMfa(factor.id, verifyCode);
      console.log('[MFA Page] Verification succeeded!');
    } catch (err) {
      console.error('[MFA Page] Verification failed:', err);
      const msg = err.message || 'Invalid code. Please try again.';
      setError(
        msg.includes('Invalid TOTP') ? 'Invalid code. Please check your authenticator app and try again.' :
        msg.includes('body stream') ? 'Verification failed. Please try again.' :
        msg.includes('expired') ? 'Code expired. Please enter a new code.' :
        msg
      );
      setCode('');
    } finally {
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  }, [factor, mfaFactors, verifyMfa]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    await doVerify(code);
  };

  // Auto-submit when 6 digits entered
  const handleCodeChange = (value) => {
    setCode(value);
    setError('');
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && factor && !isLoading && !isVerifyingRef.current) {
      console.log('[MFA Page] Auto-submitting code of length:', code.length);
      const timer = setTimeout(() => {
        doVerify(code);
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden" data-testid="mfa-verify-page">
      <div
        className="absolute top-0 left-0 right-0 h-[280px] pointer-events-none"
        style={{
          background: 'radial-gradient(600px circle at 20% 0%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(500px circle at 80% 10%, rgba(52,211,153,0.12), transparent 60%)'
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-[480px] mx-auto w-full">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--accent-teal)/0.12)] flex items-center justify-center mb-5">
            <ShieldCheck className="h-8 w-8 text-[hsl(var(--accent-teal))]" />
          </div>
          <h1 className="text-xl font-semibold mb-1">Two-factor authentication</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center">
            {isPhone
              ? 'Enter the 6-digit code sent to your phone'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
          {factor && (
            <div className="flex items-center gap-1.5 mt-2">
              {isPhone
                ? <Smartphone className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                : <KeyRound className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              }
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {factor.friendly_name || factorType.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <Card className="w-full bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-[0_10px_30px_hsl(var(--shadow-color)/0.35)]">
          <CardContent className="pt-6 pb-6 px-5">
            <form onSubmit={handleVerify} className="space-y-6">
              {error && (
                <div data-testid="mfa-error" className="flex items-center gap-2 text-sm text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.08)] border border-[hsl(var(--status-danger)/0.2)] rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {!factor && mfaFactors.length === 0 && (
                <div className="text-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))] mx-auto mb-2" />
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Loading MFA factors...</p>
                </div>
              )}

              <div className="flex justify-center" data-testid="mfa-otp-input">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-11 h-12 text-lg bg-[hsl(var(--surface-2))] border-[hsl(var(--border))] focus-visible:ring-[hsl(var(--ring))]"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                data-testid="mfa-verify-button"
                className="w-full h-11 font-semibold active:scale-[0.98] transition-[background-color,box-shadow,opacity] duration-150"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            data-testid="mfa-resend-button"
            className="text-sm text-[hsl(var(--accent-teal))] hover:underline"
          >
            Use a recovery code instead
          </button>
          <button
            data-testid="mfa-signout-button"
            onClick={signOut}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors duration-150"
          >
            Sign in with a different account
          </button>
        </div>

        {/* Debug info - remove in production */}
        {mfaFactors.length > 0 && (
          <div className="mt-6 text-[9px] text-[hsl(var(--text-3))] text-center space-y-0.5">
            <p>Factors: {mfaFactors.length} | Using: {factor?.factor_type || 'none'} ({factor?.status || 'none'})</p>
          </div>
        )}
      </div>
    </div>
  );
}
