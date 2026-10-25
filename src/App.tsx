import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Header, { type TabId } from '@/components/Header';
import ResourceHub from '@/components/ResourceHub';
import QuizEngine from '@/components/QuizEngine';
import FormulaReference from '@/components/FormulaReference';
import NoteSubmission from '@/components/NoteSubmission';
import Newsletter from '@/components/Newsletter';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import AuthModal from '@/components/AuthModal';
import ContactModal from '@/components/ContactModal';
import PartnerSection from '@/components/PartnerSection';
import AdminPanel from '@/components/AdminPanel';
import AiTutorPage from '@/pages/AiTutor';
import AiChatWidget from '@/components/AiChatWidget';
import PaymentSuccessPage from '@/pages/PaymentSuccess';
import { useAuth } from '@/hooks/useAuth';

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('resources');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const { profile, isPro, isAdmin, user, loading, signUp, signIn, signOut } = useAuth();

  const route = useMemo(() => window.location.pathname, []);
  const isAdminRoute = route === '/admin';
  const isPaymentSuccess = route === '/payment-success';
  const isAiTutorRoute = route === '/ai-tutor';

  if (isPaymentSuccess) {
    return <PaymentSuccessPage />;
  }

  if (isAdminRoute) {
    return (
      <AdminPanel
        isAdmin={isAdmin}
        userEmail={user?.email ?? null}
        loading={loading}
        onBackToApp={() => { window.location.pathname = '/'; }}
      />
    );
  }

  if (isAiTutorRoute) {
    return (
      <>
        <AiTutorPage
          isPro={isPro}
          onUpgradeClick={() => setUpgradeOpen(true)}
          onSignInRequired={() => setAuthOpen(true)}
          onBackToApp={() => { window.location.pathname = '/'; }}
        />
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
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
          onContactClick={() => setContactOpen(true)}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === 'resources' && (
            <>
              <ResourceHub isPro={isPro} onUpgradeClick={() => setUpgradeOpen(true)} onSignInClick={() => setAuthOpen(true)} />
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
          {activeTab === 'partner' && <PartnerSection />}
        </main>

        <footer className="border-t border-slate-800/60 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <Newsletter variant="compact" />
              <p className="text-center text-xs text-slate-500">{t('footer.text')}</p>
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
      />

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      <AiChatWidget
        isPro={isPro}
        onUpgradeClick={() => setUpgradeOpen(true)}
        onSignInRequired={() => setAuthOpen(true)}
      />
    </div>
  );
}
