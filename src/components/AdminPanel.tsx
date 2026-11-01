import React, { Component, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock, ShieldCheck, ArrowLeft, FileText, Users, BookOpen,
  Download, TrendingUp, AlertCircle, Loader2, Mail, Inbox, Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminPanelProps {
  isAdmin?: boolean;
  userEmail?: string | null;
  loading?: boolean;
  onBackToApp?: () => void;
}

const ADMIN_PASSKEY = '1234';

// ── ErrorBoundary ──────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AdminErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('[AdminErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <p className="text-lg font-bold text-white mb-1">Something went wrong</p>
          <p className="text-sm text-slate-400 mb-6 max-w-md">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className={`flex items-center gap-3 mb-3 ${accent}`}>
        <div className="p-2 rounded-lg bg-slate-800">{icon}</div>
        <span className="text-xs font-semibold text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
function AdminDashboard({ userEmail, onBackToApp }: { userEmail: string | null; onBackToApp?: () => void }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ resources: 0, notes: 0, quizzes: 0, contacts: 0, partners: 0, subscribers: 0 });
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const [res, notes, quizzes, contacts, partners, subs] = await Promise.all([
        supabase.from('resources').select('id', { count: 'exact', head: true }),
        supabase.from('note_submissions').select('id, title, student_name, subject, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('quiz_questions').select('id', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('id, name, email, subject_type, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('partner_inquiries').select('id', { count: 'exact', head: true }),
        supabase.from('subscribers').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        resources: res.count ?? 0,
        notes: notes.data?.length ?? 0,
        quizzes: quizzes.count ?? 0,
        contacts: contacts.data?.length ?? 0,
        partners: partners.count ?? 0,
        subscribers: subs.count ?? 0,
      });
      setRecentNotes(notes.data ?? []);
      setRecentContacts(contacts.data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">{t('admin.panelTitle')}</span>
              <p className="text-[10px] text-slate-400">{userEmail ?? 'admin@aeronotes.study'}</p>
            </div>
          </div>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('admin.returnToSite')}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={<BookOpen className="w-5 h-5 text-cyan-400" />} label="Resources" value={stats.resources} accent="" />
          <StatCard icon={<FileText className="w-5 h-5 text-sky-400" />} label="Notes" value={stats.notes} accent="" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-400" />} label="Quizzes" value={stats.quizzes} accent="" />
          <StatCard icon={<Mail className="w-5 h-5 text-emerald-400" />} label="Contacts" value={stats.contacts} accent="" />
          <StatCard icon={<Users className="w-5 h-5 text-violet-400" />} label="Partners" value={stats.partners} accent="" />
          <StatCard icon={<Inbox className="w-5 h-5 text-rose-400" />} label="Subscribers" value={stats.subscribers} accent="" />
        </div>

        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
            <p className="text-sm text-slate-400">Loading dashboard data...</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-sm text-slate-300 mb-1">Some data could not be loaded.</p>
            <p className="text-xs text-slate-500 mb-4">{fetchError}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Recent Note Submissions</h3>
              </div>
              {recentNotes.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">No notes submitted yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentNotes.map((n) => (
                    <li key={n.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/60 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500">{n.student_name} · {n.subject}</p>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent contacts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Recent Contact Messages</h3>
              </div>
              {recentContacts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Inbox className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">No messages yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentContacts.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/60 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate">{c.email} · {c.subject_type}</p>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── AdminPanel (gate + boundary) ───────────────────────────────
export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin = false,
  userEmail = null,
  loading = false,
  onBackToApp,
}) => {
  const { t } = useTranslation();
  const [passkey, setPasskey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(isAdmin);

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === ADMIN_PASSKEY) {
      setIsAuthenticated(true);
    } else {
      alert(t('admin.incorrectPasskey'));
      setPasskey('');
    }
  };

  // Loading state — dark theme to avoid white flash
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
          <p className="text-sm text-slate-400">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  // Passkey gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{t('admin.title')}</h2>
          <p className="text-xs text-slate-400 mb-6">{t('admin.subtitle')}</p>

          <form onSubmit={handlePasskeySubmit} className="space-y-4">
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder={t('admin.passkeyPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              {t('admin.unlock')}
            </button>
          </form>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('admin.returnToSite')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Authenticated dashboard — wrapped in ErrorBoundary, dark theme
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminErrorBoundary>
        <AdminDashboard userEmail={userEmail} onBackToApp={onBackToApp} />
      </AdminErrorBoundary>
    </div>
  );
};

export default AdminPanel;
