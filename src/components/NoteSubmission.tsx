import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, Send, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import type { Track, NoteSubmission } from '@/types';
import { supabase } from '@/lib/supabase';
import { sendWeb3FormEmail } from '@/lib/web3forms';
import { TrackToggle } from './Header';

const academicSubjects = ['Thermofluids', 'Piston Engines', 'Aircraft Structures', 'Digital Techniques'];
const academicRefs = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
const easaModules = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
  'M11A', 'M11B', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17',
];

export default function NoteSubmission() {
  const { t } = useTranslation();
  const [track, setTrack] = useState<Track>('academic');
  const [name, setName] = useState('');
  const [trackRef, setTrackRef] = useState('');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<NoteSubmission[]>([]);

  const refs = track === 'academic' ? academicRefs : easaModules;
  const subjects = track === 'academic' ? academicSubjects : ['General'];

  useEffect(() => {
    setTrackRef('');
    setSubject('');
  }, [track]);

  useEffect(() => {
    loadRecent();
  }, []);

  async function loadRecent() {
    const { data } = await supabase
      .from('note_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecent(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !trackRef || !subject) {
      setError(t('notes.errorRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      try {
        const { error: insertError } = await supabase.from('note_submissions').insert({
          student_name: name.trim() || 'Anonymous',
          track,
          track_ref: trackRef,
          subject,
          title: title.trim(),
          content: content.trim(),
        });
        if (insertError) throw insertError;
      } catch (dbErr) {
        console.warn('[NoteSubmission] DB insert failed (non-blocking):', dbErr);
      }

      await sendWeb3FormEmail({
        subject: `AeroNotes Note Submission: ${title.trim()}`,
        from_name: name.trim() || 'Anonymous',
        email: 'support@aeronotes.study',
        track,
        track_ref: trackRef,
        subject_area: subject,
        note_title: title.trim(),
        note_content: content.trim(),
      });

      setSuccess(true);
      setName('');
      setTitle('');
      setContent('');
      setTrackRef('');
      setSubject('');
      loadRecent();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[NoteSubmission] Web3Forms email failed:', msg);
      setError(t('notes.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <PenLine className="h-6 w-6 text-sky-400" />
            {t('notes.title')}
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {t('notes.subtitle')}
          </p>
        </div>
        <TrackToggle track={track} onTrackChange={setTrack} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-sm"
          >
            {success && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm text-emerald-300">{t('notes.success')}</p>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-800/50 bg-red-950/30 p-3.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {t('notes.yourName')} <span className="text-slate-500">{t('notes.optional')}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('notes.anonymous')}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {track === 'academic' ? t('notes.semester') : t('notes.module')} <span className="text-amber-400">*</span>
                </label>
                <select
                  value={trackRef}
                  onChange={e => setTrackRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-600"
                >
                  <option value="">{t('notes.select')}</option>
                  {refs.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {t('notes.subject')} <span className="text-amber-400">*</span>
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-600"
                >
                  <option value="">{t('notes.select')}</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {t('notes.noteTitle')} <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('notes.noteTitlePlaceholder')}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  {t('notes.noteContent')}
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={6}
                  placeholder={t('notes.noteContentPlaceholder')}
                  className="w-full resize-y rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t('notes.submitting')}</>
              ) : (
                <><Send className="h-4 w-4" /> {t('notes.submitNotes')}</>
              )}
            </button>
          </form>
        </div>

        {/* Recent submissions */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 backdrop-blur-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <BookOpen className="h-4 w-4 text-slate-500" />
              {t('notes.recentSubmissions')}
            </h3>
            {recent.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">{t('notes.noNotes')}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recent.map(n => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        n.track === 'academic' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {n.track_ref}
                      </span>
                      <span className="text-[10px] text-slate-500">{n.subject}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-200">{n.title}</p>
                    {n.content && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{n.content}</p>
                    )}
                    <p className="mt-2 text-[10px] text-slate-600">{t('notes.by', { name: n.student_name })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
