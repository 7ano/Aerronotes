import { useState, useMemo } from 'react';
import Header, { type TabId } from '@/components/Header';
import ResourceHub from '@/components/ResourceHub';
import QuizEngine from '@/components/QuizEngine';
import FormulaReference from '@/components/FormulaReference';
import NoteSubmission from '@/components/NoteSubmission';
import Newsletter from '@/components/Newsletter';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import AuthModal from '@/components/AuthModal';
import PaymentSuccess from '@/components/PaymentSuccess';
import { useAuth } from '@/hooks/useAuth';

function usePaymentReturnRoute() {
  const [route] = useState(() => {
    const path = window.location.pathname;
    if (path === '/payment-success') return 'payment-success';
    return 'main';
  });

  const billCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('billcode') ?? params.get('billCode') ?? null;
  }, []);

  return { route, billCode };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('resources');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { profile, isPro, signUp, signIn, signOut, startCheckout, verifyPayment } = useAuth();
  const { route, billCode } = usePaymentReturnRoute();

  function navigateToMain() {
    window.history.pushState({}, '', '/');
    window.location.reload();
  }

  if (route === 'payment-success') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
        </div>
        <div className="relative">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <PaymentSuccess
              billCode={billCode}
              isPro={isPro}
              onVerify={verifyPayment}
              onBack={navigateToMain}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-500/5 blur-3xl" />
      </div>

      <div className="relative">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isPro={isPro}
          onUpgradeClick={() => setUpgradeOpen(true)}
          profile={profile}
          onSignInClick={() => setAuthOpen(true)}
          onSignOut={signOut}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === 'resources' && (
            <>
              <ResourceHub isPro={isPro} onUpgradeClick={() => setUpgradeOpen(true)} />
              <div className="mt-8">
                <Newsletter variant="card" />
              </div>
            </>
          )}
          {activeTab === 'quiz' && (
            <QuizEngine isPro={isPro} onUpgradeClick={() => setUpgradeOpen(true)} />
          )}
          {activeTab === 'formulas' && <FormulaReference />}
          {activeTab === 'notes' && <NoteSubmission />}
        </main>

        <footer className="border-t border-slate-800/60 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <Newsletter variant="compact" />
              <p className="text-xs text-slate-500 text-center">
                MIAT Central (AeroNotes) · For UniKL MIAT students & EASA Part-66 candidates
              </p>
            </div>
          </div>
        </footer>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      <ProUpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        isPro={isPro}
        userEmail={profile?.email ?? null}
        onStartCheckout={startCheckout}
      />
    </div>
  );
}
