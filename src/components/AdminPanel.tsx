import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Shield, FileText, Upload, Trash2, Mail, Users, Loader2,
  CheckCircle2, AlertCircle, ArrowLeft, Inbox, Cloud,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NoteSubmission } from '@/types';
import PdfPreviewModal from './PdfPreviewModal';

const ADMIN_EMAIL = 'support@aeronotes.study';

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject_type: string;
  message: string;
  created_at: string;
}

interface PartnerApp {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
  message: string;
  created_at: string;
}

type AdminTab = 'notes' | 'contact' | 'partner';

interface AdminPanelProps {
  isAdmin: boolean;
  userEmail: string | null;
  loading: boolean;
  onBackToApp: () => void;
}

export default function AdminPanel({ isAdmin, userEmail, loading, onBackToApp }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('notes');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-800/50 bg-red-950/30">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-400">
            You don't have permission to access the admin panel. Only the AeroNotes owner can view this page.
          </p>
          <button
            onClick={onBackToApp}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AeroNotes
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: typeof FileText }[] = [
    { id: 'notes', label: 'Manage & Upload Notes', icon: FileText },
    { id: 'contact', label: 'Contact Inquiries', icon: Mail },
    { id: 'partner', label: 'Partner Applications', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative">
        {/* Admin header */}
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 shadow-lg shadow-sky-500/20">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">AeroNotes Admin</h1>
                  <p className="text-[11px] font-medium text-slate-400">Owner Control Panel</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:flex">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pro Override Active
                </span>
                <span className="hidden text-xs text-slate-400 md:inline">{userEmail}</span>
                <button
                  onClick={onBackToApp}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Exit Admin
                </button>
              </div>
            </div>

            {/* Tab nav */}
            <nav className="flex items-center gap-1 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform ${active ? 'scale-110' : ''}`} />
                    {tab.label}
                    {active && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-sky-400 to-amber-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === 'notes' && <NotesManager />}
          {activeTab === 'contact' && <ContactInquiries />}
          {activeTab === 'partner' && <PartnerApplications />}
        </main>
      </div>
    </div>
  );
}

/* ===================== Tab 1: Notes Manager ===================== */

function NotesManager() {
  const [notes, setNotes] = useState<NoteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewNote, setPreviewNote] = useState<NoteSubmission | null>(null);

  // Upload form fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [track, setTrack] = useState<'academic' | 'easa'>('easa');
  const [trackRef, setTrackRef] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const academicSubjects = ['Thermofluids', 'Piston Engines', 'Aircraft Structures', 'Digital Techniques'];
  const academicRefs = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
  const easaModules = [
    'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
    'M11A', 'M11B', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17',
  ];
  const refs = track === 'academic' ? academicRefs : easaModules;
  const subjects = track === 'academic' ? academicSubjects : ['General'];

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('note_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    setTrackRef('');
    setSubject('');
  }, [track]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !trackRef || !subject || !file) {
      setError('Please fill in all fields and select a PDF file.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    try {
      const filePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, file, { contentType: 'application/pdf' });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('notes').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      const rawPayload: Record<string, string | null | undefined> = {
        student_name: 'Admin Upload',
        track,
        track_ref: trackRef,
        subject,
        title: title.trim(),
        content: description.trim() || '',
        file_url: fileUrl || undefined,
        file_path: filePath || undefined,
      };
      const payload: Record<string, string | null> = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (value !== undefined) payload[key] = value;
      }

      try {
        const { error: dbError } = await supabase.from('note_submissions').insert(payload);
        if (dbError) {
          console.error('[AdminPanel] DB insert failed:', dbError.message);
          setError(`File uploaded but database save failed: ${dbError.message}`);
        } else {
          setSuccess(`"${title.trim()}" uploaded successfully!`);
          setTimeout(() => setSuccess(''), 4000);
        }
      } catch (dbErr) {
        const dbMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error('[AdminPanel] DB insert exception:', dbMsg);
        setError(`File uploaded but database save failed: ${dbMsg}`);
      }

      setTitle('');
      setDescription('');
      setTrackRef('');
      setSubject('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadNotes();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminPanel] upload failed:', msg);
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(note: NoteSubmission) {
    if (!confirm(`Delete "${note.title}"? This removes the record and the file from storage.`)) return;

    try {
      const noteRow = note as NoteSubmission & { file_path?: string };

      if (noteRow.file_path) {
        const { error: storageError } = await supabase.storage
          .from('notes')
          .remove([noteRow.file_path]);
        if (storageError) {
          console.warn('[AdminPanel] storage delete failed (non-blocking):', storageError.message);
        }
      }

      const { error: deleteError } = await supabase
        .from('note_submissions')
        .delete()
        .eq('id', note.id);

      if (deleteError) throw deleteError;

      setNotes(prev => prev.filter(n => n.id !== note.id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AdminPanel] delete failed:', msg);
      alert(`Failed to delete note: ${msg}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <FileText className="h-6 w-6 text-sky-400" />
          Manage & Upload Notes
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">Upload study PDFs and manage existing materials.</p>
      </div>

      {/* Upload form */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Cloud className="h-4 w-4 text-sky-400" />
          Upload New Study Material
        </h3>

        {success && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-emerald-300">{success}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-800/50 bg-red-950/30 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          {/* Track toggle */}
          <div className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => setTrack('academic')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                track === 'academic' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Academic (UniKL MIAT)
            </button>
            <button
              type="button"
              onClick={() => setTrack('easa')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                track === 'easa' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EASA Part-66
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {track === 'academic' ? 'Semester' : 'Module'} <span className="text-amber-400">*</span>
              </label>
              <select
                value={trackRef}
                onChange={e => setTrackRef(e.target.value)}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-600"
              >
                <option value="">Select...</option>
                {refs.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Subject <span className="text-amber-400">*</span>
              </label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 outline-none transition focus:border-slate-600"
              >
                <option value="">Select...</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. M3 Electrical Fundamentals Summary"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the material..."
              className="w-full resize-y rounded-lg border border-slate-700/60 bg-slate-950/60 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              PDF File <span className="text-amber-400">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                <Upload className="h-4 w-4 text-sky-400" />
                {file ? file.name : 'Choose PDF file...'}
              </label>
              {file && (
                <span className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload to Notes Library</>
            )}
          </button>
        </form>
      </div>

      {/* Notes list */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Inbox className="h-4 w-4 text-slate-500" />
          All Notes ({notes.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">No notes uploaded yet.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {notes.map(n => {
              const noteRow = n as NoteSubmission & { file_url?: string };
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800/40 bg-slate-950/40 p-4 transition hover:border-slate-700"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                    <FileText className="h-5 w-5 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{n.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        n.track === 'academic' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {n.track_ref}
                      </span>
                      <span className="text-[10px] text-slate-500">{n.subject}</span>
                      <span className="text-[10px] text-slate-600">by {n.student_name}</span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {noteRow.file_path && (
                      <button
                        onClick={() => setPreviewNote(n)}
                        className="rounded-lg border border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800/60"
                      >
                        View
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewNote && (
        <PdfPreviewModal
          title={previewNote.title}
          subject={previewNote.subject}
          trackRef={previewNote.track_ref}
          filePath={previewNote.file_path ?? null}
          onClose={() => setPreviewNote(null)}
          onSignInRequired={() => setPreviewNote(null)}
        />
      )}
    </div>
  );
}

/* ===================== Tab 2: Contact Inquiries ===================== */

function ContactInquiries() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      setInquiries(data ?? []);
      setLoading(false);
    })();
  }, []);

  const subjectColors: Record<string, string> = {
    inquiry: 'bg-sky-500/10 text-sky-400',
    support: 'bg-amber-500/10 text-amber-400',
    feedback: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Mail className="h-6 w-6 text-sky-400" />
          Contact Inquiries
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">All messages submitted through the Contact form.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 py-16 text-center">
          <Mail className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">No contact inquiries yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800/60 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Subject</th>
                  <th className="px-5 py-3 font-semibold">Message</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {inquiries.map(inquiry => (
                  <tr key={inquiry.id} className="transition hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-medium text-slate-200">{inquiry.name}</td>
                    <td className="px-5 py-4 text-slate-400">{inquiry.email}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        subjectColors[inquiry.subject_type] ?? 'bg-slate-700/40 text-slate-300'
                      }`}>
                        {inquiry.subject_type}
                      </span>
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate text-slate-400">{inquiry.message}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={`mailto:${inquiry.email}?subject=Re: ${inquiry.subject_type} - AeroNotes&body=Hi ${inquiry.name},%0D%0A%0D%0AThank you for reaching out to AeroNotes.%0D%0A%0D%0A`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/20"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Reply
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Tab 3: Partner Applications ===================== */

function PartnerApplications() {
  const [apps, setApps] = useState<PartnerApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('partner_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      setApps(data ?? []);
      setLoading(false);
    })();
  }, []);

  const roleColors: Record<string, string> = {
    student: 'bg-sky-500/10 text-sky-400',
    club: 'bg-amber-500/10 text-amber-400',
    lecturer: 'bg-emerald-500/10 text-emerald-400',
    study_group: 'bg-violet-500/10 text-violet-400',
    other: 'bg-slate-700/40 text-slate-300',
  };

  const roleLabels: Record<string, string> = {
    student: 'Student',
    club: 'Aviation Club',
    lecturer: 'Lecturer',
    study_group: 'Study Group',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Users className="h-6 w-6 text-sky-400" />
          Partner Applications
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">Collaboration requests from students, clubs, and lecturers.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-sm text-slate-500">No partner applications yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {apps.map(app => (
            <div
              key={app.id}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 backdrop-blur-sm transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-amber-500 text-sm font-bold text-white">
                    {app.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{app.name}</p>
                    <p className="text-xs text-slate-500">{app.email}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                  roleColors[app.role] ?? 'bg-slate-700/40 text-slate-300'
                }`}>
                  {roleLabels[app.role] ?? app.role}
                </span>
              </div>

              {app.organization && (
                <p className="mt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-400">Organization:</span> {app.organization}
                </p>
              )}

              <p className="mt-3 rounded-lg border border-slate-800/40 bg-slate-950/40 p-3 text-sm leading-relaxed text-slate-400">
                {app.message}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
                <a
                  href={`mailto:${app.email}?subject=Re: AeroNotes Partnership - ${roleLabels[app.role] ?? app.role}&body=Hi ${app.name},%0D%0A%0D%0AThank you for your interest in partnering with AeroNotes.%0D%0A%0D%0A`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 transition hover:bg-sky-500/20"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Reply
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
