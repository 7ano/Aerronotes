import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Zap, ShieldCheck, Crown, Sparkles } from 'lucide-react';

interface ProUpgradeModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  isPro?: boolean;
  userEmail?: string | null;
  onUpgrade?: (billing: 'monthly' | 'yearly') => void;
}

// Stripe Payment Links (replace with live links in production)
const STRIPE_LINKS = {
  monthly: 'https://buy.stripe.com/test_dRm28t0Lj3C8fm22LW9k400',
  yearly: 'https://buy.stripe.com/test_5kA28t8Lj3C8fm00aF4k000',
};

const MONTHLY_RM = 15;
const YEARLY_RM = 150;
const YEARLY_OFF_RM = 180; // 12 × 15
const SAVINGS_PCT = Math.round((1 - YEARLY_RM / YEARLY_OFF_RM) * 100);

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  open,
  isOpen,
  onClose,
  isPro = false,
  userEmail = null,
  onUpgrade,
}) => {
  const { t } = useTranslation();
  const showModal = open ?? isOpen ?? false;
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  if (!showModal) return null;

  const features = [
    t('pricing.proFeatures.f1'),
    t('pricing.proFeatures.f2'),
    t('pricing.proFeatures.f3'),
    t('pricing.proFeatures.f4'),
    t('pricing.proFeatures.f5'),
    t('pricing.proFeatures.f6'),
  ];

  const handleUpgradeClick = () => {
    setRedirecting(true);
    if (onUpgrade) {
      onUpgrade(billing);
      return;
    }
    const link = billing === 'monthly' ? STRIPE_LINKS.monthly : STRIPE_LINKS.yearly;
    let finalUrl = link;
    if (userEmail) {
      finalUrl += `?prefilled_email=${encodeURIComponent(userEmail)}`;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => setRedirecting(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain transition-opacity duration-200 select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 rounded-2xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden my-auto animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10"
          aria-label={t('pricing.close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl border border-amber-500/30 text-amber-400 mb-3">
            <Crown className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            {isPro ? t('pricing.alreadyPro') : t('pricing.upgradeTitle')}
          </h3>
          <p className="text-sm text-amber-400/90 font-medium mt-1">
            {isPro ? t('pricing.alreadyProDesc') : t('pricing.upgradeSubtitle')}
          </p>
        </div>

        {isPro ? (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-300">{t('pricing.allUnlocked')}</p>
          </div>
        ) : (
          <>
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setBilling('monthly')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billing === 'monthly'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('pricing.monthly')}
                </button>
                <button
                  type="button"
                  onClick={() => setBilling('yearly')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billing === 'yearly'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('pricing.yearly')}
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                    −{SAVINGS_PCT}%
                  </span>
                </button>
              </div>
            </div>

            {/* Price card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 mb-5">
              <div className="flex items-end justify-center gap-1">
                <span className="text-3xl font-black text-white">RM</span>
                <span className="text-5xl font-black text-white tracking-tight">
                  {billing === 'monthly' ? MONTHLY_RM : YEARLY_RM}
                </span>
                <span className="text-sm text-slate-400 font-medium mb-2">
                  {billing === 'monthly' ? t('pricing.perMonth') : t('pricing.perYear')}
                </span>
              </div>
              {billing === 'yearly' && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs text-slate-500 line-through">RM{YEARLY_OFF_RM}</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t('pricing.saveLabel', { defaultValue: `Save RM${YEARLY_OFF_RM - YEARLY_RM}/yr` })}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded-full mt-0.5 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleUpgradeClick}
              disabled={redirecting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-70"
            >
              {redirecting ? (
                <>
                  <LoaderSpin /> {t('pricing.redirecting')}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> {t('pricing.ctaButton', { defaultValue: 'Get AeroNotes Pro Access' })}
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              {t('pricing.securePayment')}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

function LoaderSpin() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
  );
}

export default ProUpgradeModal;
