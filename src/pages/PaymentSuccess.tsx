import { useTranslation } from 'react-i18next';
import { CheckCircle2, Crown, ArrowLeft } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900/60 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-white">{t('payment.success')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{t('payment.successDesc')}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
          <Crown className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">{t('payment.proActivated')}</span>
        </div>
        <a
          href="/"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-amber-500 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-sky-500/25"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('payment.startStudying')}
        </a>
      </div>
    </div>
  );
}
