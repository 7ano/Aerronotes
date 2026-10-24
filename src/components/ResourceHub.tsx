import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download, FileText, Presentation, BookOpen, FlaskConical,
  File, Search, Lock, Crown, ShieldCheck,
} from 'lucide-react';
import type { Resource, ResourceType, Track } from '@/types';
import type { NoteSubmission } from '@/types';
import { supabase } from '@/lib/supabase';
import { TrackToggle } from './Header';
import PdfPreviewModal from './PdfPreviewModal';

const typeIcons: Record<ResourceType, typeof FileText> = {
  pdf_summary: FileText,
  lecture_slides: Presentation,
  past_paper: File,
  lab_manual: FlaskConical,
};

const typeColors: Record<ResourceType, string> = {
  pdf_summary: 'text-sky-400 bg-sky-500/10',
  lecture_slides: 'text-violet-400 bg-violet-500/10',
  past_paper: 'text-emerald-400 bg-emerald-500/10',
  lab_manual: 'text-amber-400 bg-amber-500/10',
};

const academicSubjects = ['Thermofluids', 'Piston Engines', 'Aircraft Structures', 'Digital Techniques'];
const academicSems = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
const easaModules = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
  'M11A', 'M11B', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17',
];

interface ResourceHubProps {
  isPro: boolean;
  onUpgradeClick: () => void;
  onSignInClick: () => void;
}

export default function ResourceHub({ isPro, onUpgradeClick, onSignInClick }: ResourceHubProps) {
  const { t } = useTranslation();
  const [track, setTrack] = useState<Track>('academic');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRef, setFilterRef] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<Resource | null>(null);
  const [authPrompt, setAuthPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('note_submissions')
        .select('*')
        .eq('track', track)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        const rows: Resource[] = (data as NoteSubmission[] | null)?.map(n => ({
          id: n.id,
          title: n.title,
          description: n.content || '',
          track: n.track,
          track_ref: n.track_ref,
          subject: n.subject,
          type: 'pdf_summary' as ResourceType,
          file_url: n.file_url ?? '',
          file_path: n.file_path ?? null,
          pages: 0,
          is_pro: false,
          created_at: n.created_at,
        })) ?? [];
        setResources(rows);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [track]);

  useEffect(() => {
    setFilterRef('all');
    setFilterSubject('all');
  }, [track]);

  const refs = track === 'academic' ? academicSems : easaModules;
  const subjects = track === 'academic' ? academicSubjects : Array.from(
    new Set(resources.map(r => r.subject))
  ).sort();

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (filterRef !== 'all' && r.track_ref !== filterRef) return false;
      if (filterSubject !== 'all' && r.subject !== filterSubject) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [resources, filterRef, filterSubject, search]);

  const trackColor = track === 'academic' ? 'sky' : 'amber';

  function typeLabel(type: ResourceType): string {
    switch (type) {
      case 'pdf_summary': return t('resources.typePdfSummary');
      case 'lecture_slides': return t('resources.typeLectureSlides');
      case 'past_paper': return t('resources.typePastPaper');
      case 'lab_manual': return t('resources.typeLabManual');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('resources.title')}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {track === 'academic' ? t('resources.subtitleAcademic') : t('resources.subtitleEasa')}
          </p>
        </div>
        <TrackToggle track={track} onTrackChange={setTrack} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('resources.searchPlaceholder')}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
          />
        </div>
        <select
          value={filterRef}
          onChange={e => setFilterRef(e.target.value)}
          className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-600"
        >
          <option value="all">{track === 'academic' ? t('resources.allSemesters') : t('resources.allModules')}</option>
          {refs.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-600"
        >
          <option value="all">{t('resources.allSubjects')}</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <p className="text-sm text-slate-500">
        {loading ? t('resources.loading') : t('resources.resourcesFound', { count: filtered.length })}
      </p>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-slate-400">{t('resources.noResources')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => {
            const Icon = typeIcons[r.type];
            const color = typeColors[r.type];
            const locked = r.is_pro && !isPro;
            const label = typeLabel(r.type);
            return (
              <div
                key={r.id}
                className={`group relative flex flex-col rounded-2xl border p-5 backdrop-blur-sm transition-all duration-300 ${
                  locked
                    ? 'border-slate-800/60 bg-slate-900/30'
                    : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {locked && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-900/20 to-slate-950/40" />
                )}

                {/* Glow accent */}
                <div className={`absolute -top-px left-4 right-4 h-px bg-gradient-to-r ${trackColor === 'sky' ? 'from-transparent via-sky-500/40 to-transparent' : 'from-transparent via-amber-500/40 to-transparent'}`} />

                <div className="relative flex items-start justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {r.is_pro && (
                      <span className="flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        <Crown className="h-3 w-3" /> {t('header.pro')}
                      </span>
                    )}
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${trackColor === 'sky' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {r.track_ref}
                    </span>
                  </div>
                </div>

                <h3 className="relative mt-3 font-semibold leading-snug text-slate-100">{r.title}</h3>
                <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">{r.description}</p>

                <div className="relative mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{r.subject}{r.pages > 0 && ` · ${r.pages}p`}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreview(r)}
                      className="rounded-lg border border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800/60"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                        {t('resources.preview')}
                      </span>
                    </button>
                    {locked ? (
                      <button
                        onClick={onUpgradeClick}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        {t('resources.unlock')}
                      </button>
                    ) : (
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t('resources.get')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <PdfPreviewModal
          title={preview.title}
          subject={preview.subject}
          trackRef={preview.track_ref}
          filePath={preview.file_path ?? null}
          onClose={() => setPreview(null)}
          onSignInRequired={() => { setPreview(null); setAuthPrompt(true); }}
        />
      )}

      {authPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setAuthPrompt(false)}>
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
              <Lock className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Sign in required</h3>
            <p className="mt-2 text-sm text-slate-400">Please sign in or create a free account to view study materials.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setAuthPrompt(false)}
                className="flex-1 rounded-lg border border-slate-700/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                {t('pricing.close')}
              </button>
              <button
                onClick={() => { setAuthPrompt(false); onSignInClick(); }}
                className="flex-1 rounded-lg bg-gradient-to-r from-sky-500 to-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              >
                Sign in / Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
