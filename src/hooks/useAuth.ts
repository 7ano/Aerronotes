import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { StudentProfile } from '@/types';

const ALLOWED_DOMAIN = '@student.unikl.edu.my';

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
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return { error: `Email must end with ${ALLOWED_DOMAIN}` };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, student_id: studentId } },
    });

    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          student_id: studentId,
          is_pro: false,
        });
      if (profileError) return { error: profileError.message };
    }

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
    if (!session) return { error: 'Please sign in to upgrade to Pro' };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toyyibpay-create-bill`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        return { error: errBody.error ?? 'Failed to start checkout' };
      }

      const { billCode } = await response.json();
      if (!billCode) return { error: 'No bill code returned from ToyyibPay' };

      // Redirect to ToyyibPay payment page
      window.location.href = `https://toyyibpay.com/${billCode}`;
      return { error: null };
    } catch {
      return { error: 'Network error — please try again' };
    }
  }, [session]);

  const verifyPayment = useCallback(async (
    billCode: string,
  ): Promise<{ status: string; isPro: boolean } | null> => {
    if (!session) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toyyibpay-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ billCode }),
        },
      );

      if (!response.ok) return null;

      const result = await response.json();

      if (result.isPro) {
        // Reload the profile to reflect the updated is_pro status
        if (user) await loadProfile(user.id);
      }

      return { status: result.status ?? 'pending', isPro: result.isPro ?? false };
    } catch {
      return null;
    }
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
