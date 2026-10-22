import { useState } from 'react';
import {
  X, Check, Sparkles, Crown, FileText, Brain, Download,
  Loader2, ShieldCheck,
} from 'lucide-react';

interface ProUpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<void>;
  isPro: boolean;
}

const freeFeatures = [
  'Basic lecture summaries',
  'Public formula sheets',
  'Acronym reference library',
];

const proFeatures = [
  'Full EASA Part-66 question banks (all 17 modules)',
  'Worked past paper solutions with step-by-step answers',
  'Downloadable PDF bundles for offline study',
  'Lab manuals and detailed technical guides',
  'Premium quiz modules (M7, M11A & more)',
  'Priority access to newly added materials',
];

export default function ProUpgradeModal({ open, onClose, onUpgrade, isPro }: ProUpgradeModalProps) {
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function handleUpgrade() {
    setProcessing(true);
    await onUpgrade();
    setProcessing(false);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />

      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">Welcome to Pro!</h2>
            <p className="mt-1 text-sm text-slate-400">All premium content is now unlocked.</p>
          </div>
        ) : isPro ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">You're already Pro</h2>
            <p className="mt-1 text-sm text-slate-400">You have full access to all premium content.</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-slate-800/60 px-8 pt-8 pb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                MIAT Central Pro
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white">Upgrade Your Study Game</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Unlock the full EASA Part-66 library and premium resources
              </p>
            </div>

            {/* Tier cards */}
            <div className="grid gap-4 px-8 py-6 sm:grid-cols-2">
              {/* Free Tier */}
              <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <h3 className="font-bold text-slate-200">Free Tier</h3>
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-300">
                  RM0<span className="text-sm font-normal text-slate-500">/month</span>
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

              {/* Pro Tier */}
              <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-slate-900/40 p-5 shadow-[0_0_40px_-15px] shadow-amber-500/30">
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white">Pro Tier</h3>
                  <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold text-white">
                  RM15<span className="text-sm font-normal text-slate-400">/month</span>
                  <span className="ml-2 text-sm font-normal text-slate-500">or $3/mo</span>
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

            {/* Feature icons row */}
            <div className="flex items-center justify-center gap-6 px-8 pb-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Brain className="h-4 w-4 text-amber-400/70" /> Full quiz banks
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileText className="h-4 w-4 text-amber-400/70" /> Worked solutions
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Download className="h-4 w-4 text-amber-400/70" /> PDF bundles
              </div>
            </div>

            {/* Action */}
            <div className="px-8 pb-8 pt-4">
              <button
                onClick={handleUpgrade}
                disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:shadow-amber-500/50 disabled:opacity-50"
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Crown className="h-4 w-4" /> Upgrade to Pro — RM15/month</>
                )}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">
                Demo mode — clicking upgrade instantly activates Pro access. No payment required.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
