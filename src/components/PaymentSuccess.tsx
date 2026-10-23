import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle, Crown } from 'lucide-react';

interface PaymentSuccessProps {
  billCode: string | null;
  isPro: boolean;
  onVerify: (billCode: string) => Promise<{ status: string; isPro: boolean } | null>;
  onBack: () => void;
}

type VerifyState = 'verifying' | 'success' | 'pending' | 'error';

export default function PaymentSuccess({ billCode, isPro, onVerify, onBack }: PaymentSuccessProps) {
  const [state, setState] = useState<VerifyState>('verifying');

  useEffect(() => {
    if (!billCode) {
      setState('error');
      return;
    }
    if (isPro) {
      setState('success');
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 5;

    async function attemptVerify() {
      if (cancelled) return;
      const result = await onVerify(billCode!);
      if (cancelled) return;

      if (!result) {
        attempts++;
        if (attempts >= maxAttempts) {
          setState('error');
          return;
        }
        setState('pending');
        setTimeout(attemptVerify, 3000);
        return;
      }

      if (result.status === 'paid' || result.isPro) {
        setState('success');
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          setState('pending');
          return;
        }
        setTimeout(attemptVerify, 3000);
      }
    }

    attemptVerify();
    return () => { cancelled = true; };
  }, [billCode, isPro, onVerify]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-900/40 p-8 text-center backdrop-blur-sm">
        {state === 'verifying' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15">
              <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">Verifying Payment</h2>
            <p className="mt-2 text-sm text-slate-400">
              Please wait while we confirm your payment with ToyyibPay...
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">Payment Successful!</h2>
            <p className="mt-2 text-sm text-slate-400">
              Welcome to MIAT Central Pro! You now have full access to all premium content.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">Pro Tier Activated</span>
            </div>
            <button
              onClick={onBack}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 py-3 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-amber-500/25"
            >
              Start Studying
            </button>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">Payment Processing</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your payment is still being processed. We'll check again shortly.
              If you've completed payment, please try refreshing in a moment.
            </p>
            <button
              onClick={onBack}
              className="mt-6 w-full rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Back to MIAT Central
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">Verification Issue</h2>
            <p className="mt-2 text-sm text-slate-400">
              We couldn't verify your payment at this time. If you've completed payment,
              please contact support or try again later.
            </p>
            <button
              onClick={onBack}
              className="mt-6 w-full rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Back to MIAT Central
            </button>
          </>
        )}
      </div>
    </div>
  );
}
