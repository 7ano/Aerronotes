import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, BookOpen, Send, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendWeb3FormEmail } from '@/lib/web3forms';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PartnerSection() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t('partner.errorRequired'));
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
        const { error: insertError } = await supabase.from('partner_inquiries').insert({
          name: name.trim(),
          email: email.trim(),
          role,
          organization: organization.trim() || null,
          message: message.trim(),
        });
        if (insertError) throw insertError;
      } catch (dbErr) {
        console.warn('[PartnerSection] DB insert failed (non-blocking):', dbErr);
      }

      await sendWeb3FormEmail({
        subject: `AeroNotes Partner Application: ${name.trim()} (${role})`,
        from_name: name.trim(),
        email: email.trim(),
        role,
        organization: organization.trim() || 'N/A',
        message: message.trim(),
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setOrganization('');
      setMessage('');
      setRole('student');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[PartnerSection] Web3Forms email failed:', msg);
      setError(t('partner.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  }

  const roleOptions = [
    { value: 'student', label: t('partner.roleStudent'), icon: GraduationCap },
    { value: 'club', label: t('partner.roleClub'), icon: Users },
    { value: 'lecturer', label: t('partner.roleLecturer'), icon: BookOpen },
    { value: 'study_group', label: t('partner.roleStudyGroup'), icon: Users },
    { value: 'other', label: t('partner.roleOther'), icon: Sparkles },
  ];

  const benefits = [
    t('partner.benefitNotes'),
    t('partner.benefitQuiz'),
    t('partner.benefitAccess'),
    t('partner.benefitCommunity'),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Users className="h-6 w-6 text-sky-400" />
          {t('partner.title')}
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">{t('partner.subtitle')}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{t('partner.intro')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Benefits */}
        <div className="space-y-3">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 backdrop-blur-sm transition hover:border-slate-700"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <p className="text-sm text-slate-300">{benefit}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-sm">
          {success && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-sm text-emerald-300">{t('partner.success')}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-800/50 bg-red-950/30 p-3.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(null); }}
                placeholder={t('partner.namePlaceholder')}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
              />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder={t('partner.emailPlaceholder')}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {roleOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      role === opt.value
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                        : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              placeholder={t('partner.organizationPlaceholder')}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />

            <textarea
              value={message}
              onChange={e => { setMessage(e.target.value); setError(null); }}
              rows={4}
              placeholder={t('partner.messagePlaceholder')}
              className="w-full resize-y rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('partner.submitting')}</>
              ) : (
                <><Send className="h-4 w-4" /> {t('partner.submit')}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
