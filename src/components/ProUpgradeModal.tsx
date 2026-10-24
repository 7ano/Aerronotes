import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Check, Sparkles, Crown, FileText, Brain, Download,
  Loader2, ShieldCheck, AlertCircle, CreditCard,
} from 'lucide-react';

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/5kQ0010Lo3Uoc7F0gu4gg00';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
  userEmail: string | null;
}

export default function ProUpgradeModal({
  open, onClose, isPro, userEmail,
}: ProUpgradeModalProps) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  function handleCheckout() {
    setProcessing(true);
    window.location.href = STRIPE_PAYMENT_LINK;
  }

  const freeFeatures = [t('pricing.freeFeatures.f1'), t('pricing.freeFeatures.f2'), t('pricing.freeFeatures.f3')];
  const proFeatures = [
    t('pricing.proFeatures.f1'), t('pricing.proFeatures.f2'), t('pricing.proFeatures.f3'),
    t('pricing.proFeatures.f4'), t('pricing.proFeatures.f5'), t('pricing.proFeatures.f6'),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />

      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {isPro ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{t('pricing.alreadyPro')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('pricing.alreadyProDesc')}</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              {t('pricing.continue')}
            </button>
          </div>
        ) : !userEmail ? (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{t('pricing.signInToUpgrade')}</h2>
            <p className="mt-1 text-sm text-slate-400">{t('pricing.signInToUpgradeDesc')}</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              {t('pricing.close')}
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-800/60 px-8 pt-8 pb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                {t('pricing.proBadge')}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">{t('pricing.upgradeTitle')}</h2>
              <p className="mt-1.5 text-sm text-slate-400">{t('pricing.upgradeSubtitle')}</p>
            </div>

            <div className="grid gap-4 px-8 py-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <h3 className="font-bold text-slate-200">{t('pricing.freeTier')}</h3>
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-300">
                  {t('pricing.freePrice')}<span className="text-sm font-normal text-slate-500">{t('pricing.perMonth')}</span>
                </p>
                <ul className="mt-4 space-y-2.5">
                  {freeFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-900/40 p-5 shadow-[0_0_40px_-15px] shadow-amber-500/30">
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white">{t('pricing.proTier')}</h3>
                  <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {t('pricing.recommended')}
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold text-white">
                  {t('pricing.proPrice')}<span className="text-sm font-normal text-slate-400">{t('pricing.perMonth')}</span>
                  <span className="ml-2 text-sm font-normal text-slate-500">{t('pricing.orDollar')}</span>
                </p>
                <ul className="mt-4 space-y-2.5">
                  {proFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 px-8 pb-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Brain className="h-4 w-4 text-amber-400/70" /> {t('pricing.fullQuizBanks')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-4 w-4 text-amber-400/70" /> {t('pricing.workedSolutions')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Download className="h-4 w-4 text-amber-400/70" /> {t('pricing.pdfBundles')}
              </div>
            </div>

            <div className="px-8 pb-8 pt-4">
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/50 disabled:opacity-50"
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('pricing.redirecting')}</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> {t('pricing.payStripe')}</>
                )}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">{t('pricing.securePayment')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
