import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createBill, verifyBill } from '@/lib/toyyibpay';
import type { StudentProfile } from '@/types';

const ALLOWED_DOMAINS = ['@s.unikl.edu.my', '@student.unikl.edu.my'];

export interface AuthState {
  user: User | null;
  profile: StudentProfile | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  signUp: (email: string, password: string, fullName: string, studentId: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  startCheckout: () => Promise<{ error: string | null }>;
  verifyPayment: (billCode: string) => Promise<{ status: string; isPro: boolean } | null>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    setProfile(data as StudentProfile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        (async () => { await loadProfile(data.session!.user.id); })();
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        (async () => { await loadProfile(newSession.user.id); })();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    studentId: string,
  ): Promise<{ error: string | null }> => {
    const lowerEmail = email.toLowerCase();
    if (!ALLOWED_DOMAINS.some(d => lowerEmail.endsWith(d))) {
      return { error: 'Please use a valid UniKL student email address (@s.unikl.edu.my).' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, student_id: studentId } },
    });

    if (error) return { error: error.message };

    return { error: null };
  }, []);

  const signIn = useCallback(async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const upgradeToPro = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('student_profiles')
      .update({ is_pro: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('*')
      .maybeSingle();
    if (data) setProfile(data as StudentProfile);
  }, [user]);

  const startCheckout = useCallback(async (): Promise<{ error: string | null }> => {
    if (!session?.user) return { error: 'Please sign in to upgrade to Pro' };

    const returnUrl = `${window.location.origin}/payment-success`;
    const callbackUrl = `${window.location.origin}/api/toyyibpay-callback`;

    const result = await createBill({
      userId: session.user.id,
      userEmail: session.user.email ?? '',
      userFullName: profile?.full_name ?? '',
      returnUrl,
      callbackUrl,
    });

    if ('error' in result) {
      console.error('[startCheckout] createBill error:', result);
      return { error: result.error };
    }

    // Store the billCode in the transactions table
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        bill_code: result.billCode,
        bill_amount: 1500,
        status: 'pending',
      });
    if (insertError) {
      console.error('[startCheckout] Failed to store transaction:', insertError.message);
    }

    window.location.href = `https://toyyibpay.com/${result.billCode}`;
    return { error: null };
  }, [session, profile]);

  const verifyPayment = useCallback(async (
    billCode: string,
  ): Promise<{ status: string; isPro: boolean } | null> => {
    if (!session) return null;

    const result = await verifyBill(billCode);

    if ('error' in result) {
      console.error('[verifyPayment] verifyBill error:', result);
      return null;
    }

    if (result.isPro && user) {
      // Update profile locally and in the database
      const { error: profileError } = await supabase
        .from('student_profiles')
        .update({ is_pro: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (profileError) {
        console.error('[verifyPayment] Failed to update profile:', profileError.message);
      }
      await loadProfile(user.id);

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('bill_code', billCode);
    }

    return { status: result.status, isPro: result.isPro };
  }, [session, user]);

  return {
    user,
    profile,
    session,
    loading,
    isPro: profile?.is_pro ?? false,
    signUp,
    signIn,
    signOut,
    upgradeToPro,
    startCheckout,
    verifyPayment,
  };
}
