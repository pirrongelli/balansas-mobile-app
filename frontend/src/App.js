import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from '@/pages/LoginPage';
import MfaVerifyPage from '@/pages/MfaVerifyPage';
import DashboardPage from '@/pages/DashboardPage';
import AccountsPage from '@/pages/AccountsPage';
import AccountDetailPage from '@/pages/AccountDetailPage';
import TransactionsPage from '@/pages/TransactionsPage';
import PaymentsPage from '@/pages/PaymentsPage';
import PayeesPage from '@/pages/PayeesPage';
import MorePage from '@/pages/MorePage';
import ProfilePage from '@/pages/ProfilePage';
import TeamPage from '@/pages/TeamPage';

const ProtectedRoute = ({ children }) => {
  const { session, loading, mfaRequired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[hsl(var(--accent-teal))] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (mfaRequired) {
    return <Navigate to="/mfa-verify" replace />;
  }

  return children;
};

const AuthRoute = ({ children }) => {
  const { session, loading, mfaRequired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-[hsl(var(--accent-teal))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session && !mfaRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/mfa-verify'].includes(location.pathname);

  return (
    <>
      <Routes>
        {/* Auth routes - no shell */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/mfa-verify" element={<MfaVerifyPage />} />

        {/* Protected routes - with shell */}
        <Route path="/" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><AppShell><AccountsPage /></AppShell></ProtectedRoute>} />
        <Route path="/accounts/:provider/:accountId" element={<ProtectedRoute><AppShell><AccountDetailPage /></AppShell></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><AppShell><TransactionsPage /></AppShell></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><AppShell><PaymentsPage /></AppShell></ProtectedRoute>} />
        <Route path="/payees" element={<ProtectedRoute><AppShell><PayeesPage /></AppShell></ProtectedRoute>} />
        <Route path="/more" element={<ProtectedRoute><AppShell><MorePage /></AppShell></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><AppShell><TeamPage /></AppShell></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]',
        }}
      />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
