import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
      if (data) {
        setProfile(data as Profile);
      } else {
        const { data: created } = await supabase
          .from('profiles')
          .insert({ is_pro: false })
          .select('*')
          .single();
        if (created) setProfile(created as Profile);
      }
      setLoading(false);
    })();
  }, []);

  const upgradeToPro = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (data) setProfile(data as Profile);
  }, [profile]);

  const downgradeToFree = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .update({ is_pro: false })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (data) setProfile(data as Profile);
  }, [profile]);

  return { profile, loading, isPro: profile?.is_pro ?? false, upgradeToPro, downgradeToFree };
}
