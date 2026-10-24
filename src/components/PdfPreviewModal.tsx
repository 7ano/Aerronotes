import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PdfPreviewModalProps {
  title: string;
  subject: string;
  trackRef: string;
  filePath: string | null;
  onClose: () => void;
  onSignInRequired: () => void;
}

type LoadState = 'checking' | 'loading' | 'ready' | 'error';

export default function PdfPreviewModal({
  title,
  subject,
  trackRef,
  filePath,
  onClose,
  onSignInRequired,
}: PdfPreviewModalProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('checking');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        if (!cancelled) {
          onSignInRequired();
          onClose();
        }
        return;
      }

      if (!filePath) {
        if (!cancelled) {
          setState('error');
          setErrorMsg('No file is attached to this note.');
        }
        return;
      }

      if (!cancelled) setState('loading');

      const { data, error } = await supabase.storage
        .from('notes')
        .createSignedUrl(filePath, 60);

      if (cancelled) return;

      if (error || !data?.signedUrl) {
        setState('error');
        setErrorMsg(error?.message ?? 'Failed to generate a secure link.');
        return;
      }

      setSignedUrl(data.signedUrl);
      setState('ready');
    }
    load();
    return () => { cancelled = true; };
  }, [filePath, onClose, onSignInRequired]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-500">{trackRef} · {subject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative flex-1 overflow-hidden bg-slate-950" onContextMenu={e => e.preventDefault()}>
          {state === 'checking' || state === 'loading' ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-400" />
                <p className="mt-3 text-sm text-slate-400">
                  {state === 'checking' ? 'Verifying access…' : 'Generating secure link…'}
                </p>
              </div>
            </div>
          ) : state === 'error' ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-red-400/60" />
                <p className="mt-3 text-sm text-red-300">{errorMsg}</p>
              </div>
            </div>
          ) : signedUrl ? (
            <>
              <iframe
                src={`${signedUrl}#toolbar=0&navpanes=0`}
                title={title}
                className="h-[60vh] w-full border-0"
                onContextMenu={e => e.preventDefault()}
              />
              {/* Watermark overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="select-none -rotate-12 text-center opacity-[0.07]">
                  <p className="text-3xl font-bold tracking-wider text-white">AeroNotes</p>
                  <p className="text-sm font-medium tracking-widest text-white">Protected Content</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/60 px-6 py-3">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            Protected preview · link expires in 60 seconds
          </p>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            {t('pricing.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
