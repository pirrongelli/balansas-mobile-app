import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [orgRole, setOrgRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactors, setMfaFactors] = useState([]);
  const [providers, setProviders] = useState([]);
  const inactivityTimer = useRef(null);
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (session) {
      inactivityTimer.current = setTimeout(() => {
        signOut();
      }, SESSION_TIMEOUT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivityTimer]);

  const resolveCustomerContext = useCallback(async (userId) => {
    try {
      // Try account owner first
      const { data: customerData, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (customerData) {
        setCustomer(customerData);
        setIsOwner(true);
        // Fetch provider configs
        const { data: provData } = await supabase
          .from('provider_configurations')
          .select('*')
          .eq('customer_id', customerData.id);
        setProviders(provData || []);
        return customerData;
      }

      // Try team member
      const { data: roleData } = await supabase
        .from('org_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setOrgRole(roleData.role);
        const { data: custData2 } = await supabase
          .from('customers')
          .select('*')
          .eq('id', roleData.customer_id)
          .maybeSingle();
        if (custData2) {
          setCustomer(custData2);
          const { data: provData2 } = await supabase
            .from('provider_configurations')
            .select('*')
            .eq('customer_id', custData2.id);
          setProviders(provData2 || []);
        }
        return custData2;
      }

      return null;
    } catch (err) {
      console.error('Error resolving customer context:', err);
      return null;
    }
  }, []);

  const checkMfaStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) return false;
      if (data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        setMfaFactors(factorsData?.totp || []);
        setMfaRequired(true);
        return true;
      }
      setMfaRequired(false);
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const needsMfa = await checkMfaStatus();
          if (!needsMfa) {
            await resolveCustomerContext(currentSession.user.id);
          }
          resetInactivityTimer();
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      if (event === 'SIGNED_OUT') {
        setCustomer(null);
        setOrgRole(null);
        setIsOwner(false);
        setProviders([]);
        setMfaRequired(false);
        setMfaFactors([]);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
    const needsMfa = await checkMfaStatus();
    if (!needsMfa) {
      await resolveCustomerContext(data.user.id);
    }
    resetInactivityTimer();
    return { needsMfa };
  };

  const verifyMfa = async (factorId, code) => {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;

    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (verifyError) throw verifyError;

    setMfaRequired(false);
    setSession(verifyData.session || session);
    const currentUser = verifyData.user || user;
    if (currentUser) {
      await resolveCustomerContext(currentUser.id);
    }
    return verifyData;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setCustomer(null);
    setOrgRole(null);
    setIsOwner(false);
    setProviders([]);
    setMfaRequired(false);
    setMfaFactors([]);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const value = {
    session,
    user,
    customer,
    orgRole,
    isOwner,
    loading,
    mfaRequired,
    mfaFactors,
    providers,
    signIn,
    signOut,
    verifyMfa,
    resetPassword,
    resolveCustomerContext,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
