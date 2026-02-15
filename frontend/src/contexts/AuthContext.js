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
      console.log('[MFA] Assurance level:', data, error);
      if (error) return false;
      if (data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        console.log('[MFA] Factors:', JSON.stringify(factorsData), factorsError);
        // Collect all verified factors - TOTP, phone, and any others
        const allFactors = [];
        if (factorsData?.totp?.length) allFactors.push(...factorsData.totp);
        if (factorsData?.phone?.length) allFactors.push(...factorsData.phone);
        // Also check the 'all' array for any other factor types
        if (factorsData?.all?.length) {
          factorsData.all.forEach(f => {
            if (!allFactors.find(existing => existing.id === f.id)) {
              allFactors.push(f);
            }
          });
        }
        console.log('[MFA] All factors collected:', allFactors.length, allFactors.map(f => ({ id: f.id, type: f.factor_type, status: f.status })));
        setMfaFactors(allFactors);
        setMfaRequired(true);
        return true;
      }
      setMfaRequired(false);
      return false;
    } catch (err) {
      console.error('[MFA] Check error:', err);
      return false;
    }
  }, []);

  // Track if MFA was already completed in this session
  const mfaCompletedRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check AAL level - if already aal2, skip MFA
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData?.currentLevel === 'aal2') {
            mfaCompletedRef.current = true;
            setMfaRequired(false);
            await resolveCustomerContext(currentSession.user.id);
          } else {
            const needsMfa = await checkMfaStatus();
            if (!needsMfa) {
              await resolveCustomerContext(currentSession.user.id);
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setCustomer(null);
        setOrgRole(null);
        setIsOwner(false);
        setProviders([]);
        setMfaRequired(false);
        setMfaFactors([]);
        mfaCompletedRef.current = false;
        return;
      }
      
      // For TOKEN_REFRESHED or other events, update session but DON'T re-check MFA
      // if it was already completed
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
        
        // If MFA was already completed, don't re-trigger MFA check
        if (mfaCompletedRef.current) {
          // Just make sure customer context is loaded
          if (!customer && newSession.user) {
            await resolveCustomerContext(newSession.user.id);
          }
        }
      }
    });

    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  const signIn = async (email, password) => {
    let data, error;
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      data = result.data;
      error = result.error;
    } catch (err) {
      throw new Error('Invalid email or password. Please try again.');
    }
    if (error) {
      const msg = error.message || 'Invalid email or password';
      throw new Error(
        msg.includes('Invalid login') ? 'Invalid email or password. Please try again.' :
        msg.includes('body stream') ? 'Invalid email or password. Please try again.' :
        msg
      );
    }
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
    try {
      console.log('[MFA] Step 1: Creating challenge for factor:', factorId);
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      console.log('[MFA] Step 1 result:', { challengeData, challengeError });
      if (challengeError) {
        console.error('[MFA] Challenge error:', challengeError);
        throw challengeError;
      }

      console.log('[MFA] Step 2: Verifying with challengeId:', challengeData.id);
      let verifyData = null;
      let verifyError = null;
      try {
        const result = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challengeData.id,
          code,
        });
        verifyData = result.data;
        verifyError = result.error;
      } catch (sdkError) {
        console.warn('[MFA] SDK threw during verify (may be body stream bug):', sdkError.message);
        // SDK might throw "body stream already read" even on success
        // Check if session was actually upgraded
        verifyError = sdkError;
      }

      console.log('[MFA] Step 2 result:', { verifyData, verifyError: verifyError?.message });

      // IMPORTANT: Even if verify returned an error, check if the session was
      // actually upgraded to AAL2 (Supabase SDK body-stream parsing bug workaround)
      const { data: aalCheck } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      console.log('[MFA] Step 3: AAL check after verify:', aalCheck);

      if (aalCheck?.currentLevel === 'aal2') {
        // Verification actually succeeded despite potential SDK error!
        console.log('[MFA] AAL2 confirmed! MFA verification succeeded.');
        setMfaRequired(false);

        const { data: { session: freshSession } } = await supabase.auth.getSession();
        console.log('[MFA] Step 4: Fresh session obtained:', !!freshSession);

        if (freshSession) {
          setSession(freshSession);
          setUser(freshSession.user);
          await resolveCustomerContext(freshSession.user.id);
        }

        console.log('[MFA] Step 5: Complete - redirecting to dashboard');
        return verifyData;
      }

      // If AAL is still aal1, the verification truly failed
      if (verifyError) {
        console.error('[MFA] Verification truly failed:', verifyError);
        throw verifyError;
      }

      // Fallback: no error but no AAL2 either
      throw new Error('Verification failed. Please try again with a new code.');
    } catch (err) {
      console.error('[MFA] verifyMfa caught error:', err);
      throw err;
    }
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
