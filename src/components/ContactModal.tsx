import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, CheckCircle2, Loader2, Mail, MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendWeb3FormEmail } from '@/lib/web3forms';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subjectType, setSubjectType] = useState('inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t('contact.errorRequired'));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('newsletter.invalidEmail'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      try {
        const { error: insertError } = await supabase.from('contact_submissions').insert({
          name: name.trim(),
          email: email.trim(),
          subject_type: subjectType,
          message: message.trim(),
        });
        if (insertError) throw insertError;
      } catch (dbErr) {
        console.warn('[ContactModal] DB insert failed (non-blocking):', dbErr);
      }

      await sendWeb3FormEmail({
        subject: `AeroNotes Contact: ${subjectType} from ${name.trim()}`,
        from_name: name.trim(),
        email: email.trim(),
        inquiry_type: subjectType,
        message: message.trim(),
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setSubjectType('inquiry');
      setMessage('');
      setTimeout(() => { setSuccess(false); onClose(); }, 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ContactModal] Web3Forms email failed:', msg);
      setError(t('contact.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  }

  const subjectOptions = [
    { value: 'inquiry', label: t('contact.subjectInquiry') },
    { value: 'support', label: t('contact.subjectSupport') },
    { value: 'feedback', label: t('contact.subjectFeedback') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-20 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 pt-8 pb-4">
          <h2 className="text-xl font-bold text-white">{t('contact.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('contact.subtitle')}</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-12">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="mt-3 text-sm text-emerald-300">{t('contact.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 px-8 pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(null); }}
                placeholder={t('contact.namePlaceholder')}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 px-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
              />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder={t('contact.emailPlaceholder')}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 px-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
              />
            </div>
            <select
              value={subjectType}
              onChange={e => setSubjectType(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 px-3 text-sm text-slate-200 outline-none transition focus:border-slate-600"
            >
              {subjectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={e => { setMessage(e.target.value); setError(null); }}
              rows={4}
              placeholder={t('contact.messagePlaceholder')}
              className="w-full resize-y rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 px-3 text-sm leading-relaxed text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('contact.sending')}</>
              ) : (
                <><Send className="h-4 w-4" /> {t('contact.send')}</>
              )}
            </button>

            <div className="space-y-2 border-t border-slate-800/60 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>{t('contact.supportEmailLabel')}</span>
                <a href={`mailto:${t('contact.supportEmail')}`} className="font-medium text-sky-400 hover:text-sky-300">
                  {t('contact.supportEmail')}
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-600" />
                <span>{t('contact.campusContext')}</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
