import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Mail, Lock, User, IdCard, Loader2, GraduationCap, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string, fullName: string, studentId: string) => Promise<{ error: string | null }>;
}

type Mode = 'signin' | 'signup';

export default function AuthModal({ open, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function resetForm() {
    setError(null);
    setLoading(false);
  }

  function switchMode(newMode: Mode) {
    setMode(newMode);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error: signInError } = await onSignIn(email.trim(), password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
        return;
      }
      onClose();
    } else {
      if (!fullName.trim() || !studentId.trim()) {
        setError(t('auth.fillAllFields'));
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(t('auth.passwordTooShort'));
        setLoading(false);
        return;
      }
      const { error: signUpError } = await onSignUp(email.trim(), password, fullName.trim(), studentId.trim());
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-20 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 shadow-lg shadow-sky-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">
            {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createStudentAccount')}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 px-8 pb-6">
          {mode === 'signup' && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setError(null); }}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
                />
              </div>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={studentId}
                  onChange={e => { setStudentId(e.target.value); setError(null); }}
                  placeholder={t('auth.studentIdPlaceholder')}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />
          </div>

          {mode === 'signup' && (
            <p className="rounded-lg border border-sky-800/40 bg-sky-950/20 px-3 py-2 text-xs text-sky-300/80">
              {t('auth.uniklEmailOnly')}
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {mode === 'signin' ? t('auth.signingIn') : t('auth.creatingAccount')}</>
            ) : (
              mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')
            )}
          </button>

          {/* Mode switch */}
          <p className="pt-1 text-center text-xs text-slate-400">
            {mode === 'signin' ? t('auth.noAccount') + ' ' : t('auth.haveAccount') + ' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-semibold text-sky-400 transition hover:text-sky-300"
            >
              {mode === 'signin' ? t('auth.signUp') : t('auth.signInLink')}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
