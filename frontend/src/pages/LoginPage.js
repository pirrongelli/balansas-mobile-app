import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden" data-testid="login-page">
      {/* Decorative top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[280px] pointer-events-none"
        style={{
          background: 'radial-gradient(600px circle at 20% 0%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(500px circle at 80% 10%, rgba(52,211,153,0.12), transparent 60%)'
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-[480px] mx-auto w-full">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <img
            src="https://sandbox.balansas.com/assets/balansas-logo-B5IOxKL2.png"
            alt="Balansas"
            className="h-10 mb-4"
            data-testid="login-logo"
          />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Multi-currency banking platform
          </p>
        </div>

        <Card className="w-full bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-[0_10px_30px_hsl(var(--shadow-color)/0.35)]">
          <CardContent className="pt-6 pb-6 px-5">
            {!showReset ? (
              <>
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                  Sign in to your account
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                  Enter your credentials to access your accounts
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div data-testid="login-error" className="flex items-center gap-2 text-sm text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.08)] border border-[hsl(var(--status-danger)/0.2)] rounded-lg px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <Input
                        id="email"
                        type="email"
                        data-testid="login-email-input"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))] focus-visible:ring-[hsl(var(--ring))]"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <button
                        type="button"
                        data-testid="forgot-password-link"
                        onClick={() => { setShowReset(true); setError(''); }}
                        className="text-xs text-[hsl(var(--accent-teal))] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        data-testid="login-password-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))] focus-visible:ring-[hsl(var(--ring))]"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors duration-150"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    data-testid="login-submit-button"
                    className="w-full h-11 font-semibold active:scale-[0.98] transition-[background-color,box-shadow,opacity] duration-150"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : 'Sign In'}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                  Reset your password
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                  We'll send a reset link to your email
                </p>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-[hsl(var(--status-success)/0.12)] flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-6 w-6 text-[hsl(var(--status-success))]" />
                    </div>
                    <p className="text-sm text-[hsl(var(--foreground))] mb-1">Check your inbox</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">We sent a reset link to {email}</p>
                    <Button variant="secondary" size="sm" onClick={() => { setShowReset(false); setResetSent(false); }}>
                      Back to sign in
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.08)] border border-[hsl(var(--status-danger)/0.2)] rounded-lg px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                        disabled={isLoading}
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => { setShowReset(false); setError(''); }}
                    >
                      Back to sign in
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-[hsl(var(--text-3))]">
            Protected by enterprise-grade security
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Lock className="h-3 w-3 text-[hsl(var(--text-3))]" />
            <span className="text-[10px] text-[hsl(var(--text-3))]">End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
