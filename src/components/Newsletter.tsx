import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Variant = 'card' | 'compact';

interface NewsletterProps {
  variant?: Variant;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Newsletter({ variant = 'card' }: NewsletterProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(false);

  async function handleSubscribe(email: string) {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .insert([{ email: email, source: 'website_footer' }]);

      if (error) {
        if (error.code === '23505') {
          alert(t('newsletter.alreadySubscribed'));
        } else {
          console.error('Supabase Error:', error.message);
          alert(t('newsletter.subscribeSuccess'));
        }
        return;
      }

      alert(t('newsletter.subscribeSuccess'));
      setEmail('');
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_RE.test(trimmed)) {
      setValidationError(true);
      return;
    }

    setValidationError(false);
    setLoading(true);
    await handleSubscribe(trimmed);
    setLoading(false);
  }

  if (variant === 'compact') {
    return (
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setValidationError(false); }}
              placeholder={t('newsletter.emailPlaceholder')}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('newsletter.subscribe')}
          </button>
        </form>
        {validationError && (
          <div className="mt-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            <p className="text-xs text-red-400">{t('newsletter.invalidEmail')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-bold text-white">{t('newsletter.stayUpdated')}</h3>
            <p className="text-xs text-slate-400">{t('newsletter.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setValidationError(false); }}
              placeholder={t('newsletter.emailPlaceholder')}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('newsletter.subscribeButton')}
          </button>
        </form>

        {validationError && (
          <div className="mt-3 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            <p className="text-xs text-red-400">{t('newsletter.invalidEmail')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
