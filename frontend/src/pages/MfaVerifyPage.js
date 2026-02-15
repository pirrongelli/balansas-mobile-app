import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function MfaVerifyPage() {
  const { mfaFactors, verifyMfa } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const factor = mfaFactors?.[0];

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    if (!factor) {
      setError('No MFA factor found');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await verifyMfa(factor.id, code);
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when 6 digits entered
  const handleCodeChange = (value) => {
    setCode(value);
    setError('');
    if (value.length === 6) {
      setTimeout(() => {
        handleVerify();
      }, 200);
    }
  };

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
            Enter the 6-digit code from your authenticator app
          </p>
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

        <button
          data-testid="mfa-resend-button"
          className="mt-6 text-sm text-[hsl(var(--accent-teal))] hover:underline"
        >
          Use a recovery code instead
        </button>
      </div>
    </div>
  );
}
