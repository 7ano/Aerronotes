import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import {
  Lock, ShieldCheck, ArrowLeft, FileText, Users, BookOpen,
  TrendingUp, AlertCircle, Loader2, Mail, Inbox, Sparkles,
  Plus, Edit3, Trash2, Crown, X, Upload, Save, Download,
  CheckCircle2, Eye, MessageSquare, Search,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────────────
type AdminTab = 'overview' | 'notes' | 'resources' | 'quizzes' | 'subscribers' | 'contacts' | 'partners';

interface ResourceRow {
  id: string; title: string; description: string; track: string; track_ref: string;
  subject: string; type: string; file_url: string; pages: number; is_pro: boolean; created_at: string;
}
interface NoteRow {
  id: string; student_name: string; track: string; track_ref: string; subject: string;
  title: string; content: string; created_at: string; file_url: string | null; file_path: string | null;
}
interface QuizRow {
  id: string; module_code: string; module_name: string; topic: string; question: string;
  option_a: string; option_b: string; option_c: string; correct_answer: string;
  explanation: string; is_pro: boolean; created_at: string;
}
interface ContactRow { id: string; name: string; email: string; subject_type: string; message: string; created_at: string; }
interface PartnerRow { id: string; name: string; email: string; role: string; organization: string | null; message: string; created_at: string; }
interface SubscriberRow { id: string; email: string; source: string; created_at: string; }

interface AdminPanelProps {
  isAdmin?: boolean;
  userEmail?: string | null;
  loading?: boolean;
  onBackToApp?: () => void;
}

const ADMIN_PASSKEY = '1234';

const RESOURCE_TYPES = [
  { value: 'pdf_summary', label: 'PDF Summary' },
  { value: 'lecture_slides', label: 'Lecture Slides' },
  { value: 'past_paper', label: 'Past Paper Solutions' },
  { value: 'lab_manual', label: 'Lab Manual' },
];

// ── ErrorBoundary ──────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; message: string; }

class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }
  componentDidCatch(error: Error) { console.error('[AdminErrorBoundary]', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <p className="text-lg font-bold text-white mb-1">Something went wrong</p>
          <p className="text-sm text-slate-400 mb-6 max-w-md">{this.state.message}</p>
          <button type="button" onClick={() => this.setState({ hasError: false, message: '' })}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">
            Try Again
          </button>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

// ── Reusable Drawer ────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative h-full w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, message }: { open: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-slate-300 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const node = msg ? (
    <div className="fixed bottom-6 right-6 z-[70] px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-2xl flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4" /> {msg}
    </div>
  ) : null;
  return { show, node };
}

// ── Input components ───────────────────────────────────────────
const inputCls = "w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none transition-colors";
const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={labelCls}>{label}</label>{children}</div>;
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, onClick, active }: { icon: React.ReactNode; label: string; value: number; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`text-left bg-slate-900 border rounded-2xl p-5 transition-all ${onClick ? 'hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer' : 'cursor-default'} ${active ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800'}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-slate-800">{icon}</div>
        <span className="text-xs font-semibold text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
    </button>
  );
}

// ── Note Edit Drawer ───────────────────────────────────────────
function NoteEditDrawer({ note, open, onClose, onSave, onDelete }: {
  note: NoteRow | null; open: boolean; onClose: () => void; onSave: (n: NoteRow) => void; onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<NoteRow | null>(note);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(note); }, [note]);

  if (!form) return null;

  const save = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.from('note_submissions')
        .update({ title: form.title, subject: form.subject, content: form.content, track: form.track, track_ref: form.track_ref })
        .eq('id', form.id).select('*').single();
      if (error) throw error;
      if (data) onSave(data);
    } catch (e) { alert('Save failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setSaving(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Edit Note Submission">
      <div className="space-y-4">
        <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Student Name"><input className={inputCls} value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} /></Field>
        <Field label="Subject"><input className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Track">
            <select className={inputCls} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
              <option value="academic">Academic</option><option value="easa">EASA</option>
            </select>
          </Field>
          <Field label="Track Ref"><input className={inputCls} value={form.track_ref} onChange={(e) => setForm({ ...form, track_ref: e.target.value })} /></Field>
        </div>
        <Field label="Content"><textarea rows={5} className={inputCls} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
          <button onClick={() => onDelete(form.id)} className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Drawer>
  );
}

// ── Resource Edit Drawer ───────────────────────────────────────
function ResourceEditDrawer({ resource, open, onClose, onSave, onDelete }: {
  resource: ResourceRow | null; open: boolean; onClose: () => void; onSave: (r: ResourceRow) => void; onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<ResourceRow | null>(resource);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(resource); }, [resource]);
  if (!form) return null;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const filePath = `admin/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('notes').upload(filePath, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('notes').getPublicUrl(filePath);
      setForm({ ...form, file_url: pub.publicUrl });
    } catch (e) { alert('Upload failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description, track: form.track, track_ref: form.track_ref,
        subject: form.subject, type: form.type, file_url: form.file_url, pages: form.pages, is_pro: form.is_pro,
      };
      if (form.id) {
        const { data, error } = await supabase.from('resources').update(payload).eq('id', form.id).select('*').single();
        if (error) throw error;
        if (data) onSave(data);
      } else {
        const { data, error } = await supabase.from('resources').insert(payload).select('*').single();
        if (error) throw error;
        if (data) onSave(data);
      }
    } catch (e) { alert('Save failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setSaving(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} title={form.id ? 'Edit Resource' : 'Add New Resource'}>
      <div className="space-y-4">
        <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resource title" /></Field>
        <Field label="Description"><textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Track">
            <select className={inputCls} value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })}>
              <option value="academic">Academic</option><option value="easa">EASA</option>
            </select>
          </Field>
          <Field label="Track Ref"><input className={inputCls} value={form.track_ref} onChange={(e) => setForm({ ...form, track_ref: e.target.value })} placeholder="Semester 3 / M3" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject"><input className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Thermofluids" /></Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {RESOURCE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="File URL">
          <div className="flex gap-2">
            <input className={inputCls} value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
            <label className="shrink-0 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Pages"><input type="number" className={inputCls} value={form.pages} onChange={(e) => setForm({ ...form, pages: parseInt(e.target.value) || 0 })} /></Field>
          <Field label="Pro Gated">
            <button type="button" onClick={() => setForm({ ...form, is_pro: !form.is_pro })}
              className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${form.is_pro ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <Crown className="w-4 h-4" /> {form.is_pro ? 'Pro Only' : 'Free Access'}
            </button>
          </Field>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {form.id ? 'Save Changes' : 'Create Resource'}
          </button>
          {form.id && (
            <button onClick={() => onDelete(form.id)} className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ── Quiz Edit Drawer ───────────────────────────────────────────
function QuizEditDrawer({ quiz, open, onClose, onSave, onDelete }: {
  quiz: QuizRow | null; open: boolean; onClose: () => void; onSave: (q: QuizRow) => void; onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<QuizRow | null>(quiz);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(quiz); }, [quiz]);
  if (!form) return null;

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        module_code: form.module_code, module_name: form.module_name, topic: form.topic,
        question: form.question, option_a: form.option_a, option_b: form.option_b, option_c: form.option_c,
        correct_answer: form.correct_answer, explanation: form.explanation, is_pro: form.is_pro,
      };
      if (form.id) {
        const { data, error } = await supabase.from('quiz_questions').update(payload).eq('id', form.id).select('*').single();
        if (error) throw error;
        if (data) onSave(data);
      } else {
        const { data, error } = await supabase.from('quiz_questions').insert(payload).select('*').single();
        if (error) throw error;
        if (data) onSave(data);
      }
    } catch (e) { alert('Save failed: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setSaving(false); }
  };

  return (
    <Drawer open={open} onClose={onClose} title={form.id ? 'Edit Quiz Question' : 'Add Quiz Question'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Module Code"><input className={inputCls} value={form.module_code} onChange={(e) => setForm({ ...form, module_code: e.target.value })} placeholder="M3" /></Field>
          <Field label="Module Name"><input className={inputCls} value={form.module_name} onChange={(e) => setForm({ ...form, module_name: e.target.value })} /></Field>
        </div>
        <Field label="Topic"><input className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></Field>
        <Field label="Question"><textarea rows={3} className={inputCls} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Option A"><input className={inputCls} value={form.option_a} onChange={(e) => setForm({ ...form, option_a: e.target.value })} /></Field>
          <Field label="Option B"><input className={inputCls} value={form.option_b} onChange={(e) => setForm({ ...form, option_b: e.target.value })} /></Field>
          <Field label="Option C"><input className={inputCls} value={form.option_c} onChange={(e) => setForm({ ...form, option_c: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Correct Answer">
            <select className={inputCls} value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}>
              <option value="a">A</option><option value="b">B</option><option value="c">C</option>
            </select>
          </Field>
          <Field label="Pro Gated">
            <button type="button" onClick={() => setForm({ ...form, is_pro: !form.is_pro })}
              className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${form.is_pro ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <Crown className="w-4 h-4" /> {form.is_pro ? 'Pro Only' : 'Free'}
            </button>
          </Field>
        </div>
        <Field label="Explanation"><textarea rows={3} className={inputCls} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} /></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {form.id ? 'Save' : 'Create'}
          </button>
          {form.id && (
            <button onClick={() => onDelete(form.id)} className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ── Contact View Modal ─────────────────────────────────────────
function ContactViewModal({ item, open, onClose, onDelete }: { item: ContactRow | null; open: boolean; onClose: () => void; onDelete: (id: string) => void }) {
  if (!item) return null;
  return (
    <Drawer open={open} onClose={onClose} title="Contact Message">
      <div className="space-y-4">
        <div><p className={labelCls}>From</p><p className="text-sm text-white font-semibold">{item.name}</p><p className="text-xs text-slate-400">{item.email}</p></div>
        <div><p className={labelCls}>Subject</p><p className="text-sm text-cyan-400 font-semibold capitalize">{item.subject_type}</p></div>
        <div><p className={labelCls}>Date</p><p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p></div>
        <div><p className={labelCls}>Message</p><div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 leading-relaxed">{item.message}</div></div>
        <button onClick={() => onDelete(item.id)} className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete Message
        </button>
      </div>
    </Drawer>
  );
}

// ── Partner View Modal ─────────────────────────────────────────
function PartnerViewModal({ item, open, onClose, onDelete }: { item: PartnerRow | null; open: boolean; onClose: () => void; onDelete: (id: string) => void }) {
  if (!item) return null;
  return (
    <Drawer open={open} onClose={onClose} title="Partner Application">
      <div className="space-y-4">
        <div><p className={labelCls}>Name</p><p className="text-sm text-white font-semibold">{item.name}</p></div>
        <div><p className={labelCls}>Email</p><p className="text-xs text-slate-400">{item.email}</p></div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className={labelCls}>Role</p><p className="text-sm text-cyan-400 capitalize">{item.role}</p></div>
          <div><p className={labelCls}>Organization</p><p className="text-sm text-slate-300">{item.organization || '—'}</p></div>
        </div>
        <div><p className={labelCls}>Date</p><p className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</p></div>
        <div><p className={labelCls}>Message</p><div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 leading-relaxed">{item.message}</div></div>
        <button onClick={() => onDelete(item.id)} className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete Application
        </button>
      </div>
    </Drawer>
  );
}

// ── Subscribers Modal ──────────────────────────────────────────
function SubscribersModal({ open, onClose, subscribers, onRefresh, onDelete, toast }: {
  open: boolean; onClose: () => void; subscribers: SubscriberRow[]; onRefresh: () => void; onDelete: (id: string) => void; toast: (m: string) => void;
}) {
  const exportCSV = () => {
    const csv = ['email,source,subscribed_at', ...subscribers.map(s => `"${s.email}","${s.source}","${new Date(s.created_at).toISOString()}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aeronotes-subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported');
  };

  return (
    <Drawer open={open} onClose={onClose} title={`Subscribers (${subscribers.length})`}>
      <div className="space-y-4">
        <button onClick={exportCSV} className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Export as CSV
        </button>
        {subscribers.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Inbox className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">No subscribers yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {subscribers.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 truncate">{s.email}</p>
                  <p className="text-[10px] text-slate-600">{s.source} · {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => { onDelete(s.id); }} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
function AdminDashboard({ userEmail, onBackToApp }: { userEmail: string | null; onBackToApp?: () => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState({ resources: 0, notes: 0, quizzes: 0, contacts: 0, partners: 0, subscribers: 0 });
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Drawer / modal state
  const [noteEditing, setNoteEditing] = useState<NoteRow | null>(null);
  const [noteDrawerOpen, setNoteDrawerOpen] = useState(false);
  const [resourceEditing, setResourceEditing] = useState<ResourceRow | null>(null);
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const [quizEditing, setQuizEditing] = useState<QuizRow | null>(null);
  const [quizDrawerOpen, setQuizDrawerOpen] = useState(false);
  const [contactViewing, setContactViewing] = useState<ContactRow | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [partnerViewing, setPartnerViewing] = useState<PartnerRow | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [subsModalOpen, setSubsModalOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; message: string; action: () => void }>({ open: false, message: '', action: () => {} });

  const { show: toastShow, node: toastNode } = useToast();

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const [res, notesRes, quizRes, contactRes, partnerRes, subRes] = await Promise.all([
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('note_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('quiz_questions').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('partner_inquiries').select('*').order('created_at', { ascending: false }),
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
      ]);

      setStats({
        resources: res.data?.length ?? 0,
        notes: notesRes.data?.length ?? 0,
        quizzes: quizRes.data?.length ?? 0,
        contacts: contactRes.data?.length ?? 0,
        partners: partnerRes.data?.length ?? 0,
        subscribers: subRes.data?.length ?? 0,
      });
      setResources(res.data as ResourceRow[] ?? []);
      setNotes(notesRes.data as NoteRow[] ?? []);
      setQuizzes(quizRes.data as QuizRow[] ?? []);
      setContacts(contactRes.data as ContactRow[] ?? []);
      setPartners(partnerRes.data as PartnerRow[] ?? []);
      setSubscribers(subRes.data as SubscriberRow[] ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchError(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── CRUD helpers ──
  const deleteNote = (id: string) => {
    setConfirm({ open: true, message: 'Delete this note permanently?', action: async () => {
      const { error } = await supabase.from('note_submissions').delete().eq('id', id);
      if (error) { toastShow('Delete failed'); return; }
      setNotes(prev => prev.filter(n => n.id !== id));
      setStats(prev => ({ ...prev, notes: prev.notes - 1 }));
      setNoteDrawerOpen(false);
      toastShow('Note deleted');
    }});
  };

  const deleteResource = (id: string) => {
    setConfirm({ open: true, message: 'Delete this resource permanently?', action: async () => {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) { toastShow('Delete failed'); return; }
      setResources(prev => prev.filter(r => r.id !== id));
      setStats(prev => ({ ...prev, resources: prev.resources - 1 }));
      setResourceDrawerOpen(false);
      toastShow('Resource deleted');
    }});
  };

  const deleteQuiz = (id: string) => {
    setConfirm({ open: true, message: 'Delete this quiz question?', action: async () => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) { toastShow('Delete failed'); return; }
      setQuizzes(prev => prev.filter(q => q.id !== id));
      setStats(prev => ({ ...prev, quizzes: prev.quizzes - 1 }));
      setQuizDrawerOpen(false);
      toastShow('Quiz question deleted');
    }});
  };

  const deleteContact = (id: string) => {
    setConfirm({ open: true, message: 'Delete this contact message?', action: async () => {
      const { error } = await supabase.from('contact_submissions').delete().eq('id', id);
      if (error) { toastShow('Delete failed'); return; }
      setContacts(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, contacts: prev.contacts - 1 }));
      setContactModalOpen(false);
      toastShow('Message deleted');
    }});
  };

  const deletePartner = (id: string) => {
    setConfirm({ open: true, message: 'Delete this partner application?', action: async () => {
      const { error } = await supabase.from('partner_inquiries').delete().eq('id', id);
      if (error) { toastShow('Delete failed'); return; }
      setPartners(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, partners: prev.partners - 1 }));
      setPartnerModalOpen(false);
      toastShow('Application deleted');
    }});
  };

  const deleteSubscriber = (id: string) => {
    setConfirm({ open: true, message: 'Remove this subscriber?', action: async () => {
      const { error } = await supabase.from('subscribers').delete().eq('id', id);
      if (error) { toastShow('Remove failed'); return; }
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setStats(prev => ({ ...prev, subscribers: prev.subscribers - 1 }));
      toastShow('Subscriber removed');
    }});
  };

  const toggleResourcePro = async (r: ResourceRow) => {
    const { data, error } = await supabase.from('resources').update({ is_pro: !r.is_pro }).eq('id', r.id).select('*').single();
    if (error) { toastShow('Update failed'); return; }
    if (data) {
      setResources(prev => prev.map(x => x.id === r.id ? data : x));
      toastShow(data.is_pro ? 'Set to Pro Only' : 'Set to Free Access');
    }
  };

  // ── Tab navigation ──
  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" /> },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quizzes', label: 'Quizzes', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'subscribers', label: 'Subscribers', icon: <Inbox className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <Mail className="w-4 h-4" /> },
    { id: 'partners', label: 'Partners', icon: <Users className="w-4 h-4" /> },
  ];

  const filterBySearch = <T extends { title?: string; name?: string; question?: string; email?: string }>(arr: T[]): T[] => {
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter(item => (item.title ?? item.name ?? item.question ?? item.email ?? '').toLowerCase().includes(q));
  };

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setResourceEditing({ id: '', title: '', description: '', track: 'academic', track_ref: '', subject: '', type: 'pdf_summary', file_url: '', pages: 0, is_pro: false, created_at: '' }); setResourceDrawerOpen(true); }}
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Resource
            </button>
            {onBackToApp && (
              <button onClick={onBackToApp}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> {t('admin.returnToSite')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats grid — clickable */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard icon={<BookOpen className="w-5 h-5 text-cyan-400" />} label="Resources" value={stats.resources} onClick={() => setActiveTab('resources')} active={activeTab === 'resources'} />
          <StatCard icon={<FileText className="w-5 h-5 text-sky-400" />} label="Notes" value={stats.notes} onClick={() => setActiveTab('notes')} active={activeTab === 'notes'} />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-amber-400" />} label="Quizzes" value={stats.quizzes} onClick={() => setActiveTab('quizzes')} active={activeTab === 'quizzes'} />
          <StatCard icon={<Mail className="w-5 h-5 text-emerald-400" />} label="Contacts" value={stats.contacts} onClick={() => setActiveTab('contacts')} active={activeTab === 'contacts'} />
          <StatCard icon={<Users className="w-5 h-5 text-violet-400" />} label="Partners" value={stats.partners} onClick={() => setActiveTab('partners')} active={activeTab === 'partners'} />
          <StatCard icon={<Inbox className="w-5 h-5 text-rose-400" />} label="Subscribers" value={stats.subscribers} onClick={() => setSubsModalOpen(true)} />
        </div>

        {/* Tab nav + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none w-full sm:w-48" />
          </div>
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
            <button onClick={loadData} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer">Retry</button>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-sky-400" /><h3 className="text-sm font-bold text-white">Recent Notes</h3></div>
                    <button onClick={() => setActiveTab('notes')} className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">View all</button>
                  </div>
                  {notes.length === 0 ? <EmptyState icon={<Sparkles className="w-8 h-8 text-slate-700 mb-2" />} text="No notes yet." /> : (
                    <ul className="space-y-2">{notes.slice(0, 5).map(n => (
                      <li key={n.id} onClick={() => { setNoteEditing(n); setNoteDrawerOpen(true); }}
                        className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-800/40 rounded-lg p-1.5 -m-1.5 transition-colors">
                        <div className="min-w-0"><p className="text-sm font-semibold text-slate-200 truncate">{n.title}</p><p className="text-xs text-slate-500">{n.student_name} · {n.subject}</p></div>
                        <span className="text-[10px] text-slate-600 shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                      </li>
                    ))}</ul>
                  )}
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-400" /><h3 className="text-sm font-bold text-white">Recent Contacts</h3></div>
                    <button onClick={() => setActiveTab('contacts')} className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">View all</button>
                  </div>
                  {contacts.length === 0 ? <EmptyState icon={<Inbox className="w-8 h-8 text-slate-700 mb-2" />} text="No messages yet." /> : (
                    <ul className="space-y-2">{contacts.slice(0, 5).map(c => (
                      <li key={c.id} onClick={() => { setContactViewing(c); setContactModalOpen(true); }}
                        className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-800/40 rounded-lg p-1.5 -m-1.5 transition-colors">
                        <div className="min-w-0"><p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p><p className="text-xs text-slate-500 truncate">{c.email} · {c.subject_type}</p></div>
                        <span className="text-[10px] text-slate-600 shrink-0">{new Date(c.created_at).toLocaleDateString()}</span>
                      </li>
                    ))}</ul>
                  )}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Note Submissions ({notes.length})</h3>
                </div>
                {filterBySearch(notes).length === 0 ? <EmptyState icon={<FileText className="w-8 h-8 text-slate-700 mb-2" />} text="No notes found." /> : (
                  <div className="space-y-2">
                    {filterBySearch(notes).map(n => (
                      <div key={n.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="min-w-0 cursor-pointer flex-1" onClick={() => { setNoteEditing(n); setNoteDrawerOpen(true); }}>
                          <p className="text-sm font-semibold text-slate-200 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.student_name} · {n.subject} · {n.track}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setNoteEditing(n); setNoteDrawerOpen(true); }} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteNote(n.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RESOURCES TAB */}
            {activeTab === 'resources' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Resources ({resources.length})</h3>
                  <button onClick={() => { setResourceEditing({ id: '', title: '', description: '', track: 'academic', track_ref: '', subject: '', type: 'pdf_summary', file_url: '', pages: 0, is_pro: false, created_at: '' }); setResourceDrawerOpen(true); }}
                    className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {filterBySearch(resources).length === 0 ? <EmptyState icon={<BookOpen className="w-8 h-8 text-slate-700 mb-2" />} text="No resources found." /> : (
                  <div className="space-y-2">
                    {filterBySearch(resources).map(r => (
                      <div key={r.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-slate-200 truncate">{r.title}</p>
                            {r.is_pro && <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md"><Crown className="w-2.5 h-2.5" />PRO</span>}
                          </div>
                          <p className="text-xs text-slate-500">{r.subject} · {r.track_ref} · {r.type}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => toggleResourcePro(r)} className={`p-2 rounded-lg transition-colors cursor-pointer ${r.is_pro ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-500 hover:bg-slate-800'}`} title="Toggle Pro/Free"><Crown className="w-4 h-4" /></button>
                          <button onClick={() => { setResourceEditing(r); setResourceDrawerOpen(true); }} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteResource(r.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* QUIZZES TAB */}
            {activeTab === 'quizzes' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Quiz Questions ({quizzes.length})</h3>
                  <button onClick={() => { setQuizEditing({ id: '', module_code: '', module_name: '', topic: '', question: '', option_a: '', option_b: '', option_c: '', correct_answer: 'a', explanation: '', is_pro: false, created_at: '' }); setQuizDrawerOpen(true); }}
                    className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {filterBySearch(quizzes).length === 0 ? <EmptyState icon={<TrendingUp className="w-8 h-8 text-slate-700 mb-2" />} text="No quiz questions found." /> : (
                  <div className="space-y-2">
                    {filterBySearch(quizzes).map(q => (
                      <div key={q.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded-md">{q.module_code}</span>
                            {q.is_pro && <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md"><Crown className="w-2.5 h-2.5" />PRO</span>}
                          </div>
                          <p className="text-sm font-semibold text-slate-200 truncate">{q.question}</p>
                          <p className="text-xs text-slate-500">{q.topic} · Answer: {q.correct_answer.toUpperCase()}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setQuizEditing(q); setQuizDrawerOpen(true); }} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteQuiz(q.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONTACTS TAB */}
            {activeTab === 'contacts' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Contact Messages ({contacts.length})</h3>
                {filterBySearch(contacts).length === 0 ? <EmptyState icon={<Mail className="w-8 h-8 text-slate-700 mb-2" />} text="No messages found." /> : (
                  <div className="space-y-2">
                    {filterBySearch(contacts).map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setContactViewing(c); setContactModalOpen(true); }}>
                          <p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate">{c.email} · {c.subject_type}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setContactViewing(c); setContactModalOpen(true); }} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => deleteContact(c.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PARTNERS TAB */}
            {activeTab === 'partners' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Partner Applications ({partners.length})</h3>
                {filterBySearch(partners).length === 0 ? <EmptyState icon={<Users className="w-8 h-8 text-slate-700 mb-2" />} text="No applications found." /> : (
                  <div className="space-y-2">
                    {filterBySearch(partners).map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => { setPartnerViewing(p); setPartnerModalOpen(true); }}>
                          <p className="text-sm font-semibold text-slate-200 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate">{p.email} · {p.role} · {p.organization || '—'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setPartnerViewing(p); setPartnerModalOpen(true); }} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => deletePartner(p.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUBSCRIBERS TAB */}
            {activeTab === 'subscribers' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Subscribers ({subscribers.length})</h3>
                  <button onClick={() => setSubsModalOpen(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer">
                    <Eye className="w-4 h-4" /> View & Export
                  </button>
                </div>
                {subscribers.length === 0 ? <EmptyState icon={<Inbox className="w-8 h-8 text-slate-700 mb-2" />} text="No subscribers yet." /> : (
                  <div className="space-y-2">
                    {subscribers.slice(0, 10).map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                        <div className="min-w-0"><p className="text-sm text-slate-200 truncate">{s.email}</p><p className="text-[10px] text-slate-600">{s.source}</p></div>
                        <button onClick={() => deleteSubscriber(s.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {subscribers.length > 10 && <p className="text-xs text-slate-500 text-center pt-2">Showing 10 of {subscribers.length}. <button onClick={() => setSubsModalOpen(true)} className="text-cyan-400 hover:underline cursor-pointer">View all</button></p>}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawers & modals */}
      <NoteEditDrawer note={noteEditing} open={noteDrawerOpen} onClose={() => setNoteDrawerOpen(false)}
        onSave={(n) => { setNotes(prev => prev.map(x => x.id === n.id ? n : x)); toastShow('Note updated'); setNoteDrawerOpen(false); }}
        onDelete={deleteNote} />
      <ResourceEditDrawer resource={resourceEditing} open={resourceDrawerOpen} onClose={() => setResourceDrawerOpen(false)}
        onSave={(r) => {
          if (r.id && resources.some(x => x.id === r.id)) { setResources(prev => prev.map(x => x.id === r.id ? r : x)); toastShow('Resource updated'); }
          else { setResources(prev => [r, ...prev]); setStats(prev => ({ ...prev, resources: prev.resources + 1 })); toastShow('Resource created'); }
          setResourceDrawerOpen(false);
        }}
        onDelete={deleteResource} />
      <QuizEditDrawer quiz={quizEditing} open={quizDrawerOpen} onClose={() => setQuizDrawerOpen(false)}
        onSave={(q) => {
          if (q.id && quizzes.some(x => x.id === q.id)) { setQuizzes(prev => prev.map(x => x.id === q.id ? q : x)); toastShow('Question updated'); }
          else { setQuizzes(prev => [q, ...prev]); setStats(prev => ({ ...prev, quizzes: prev.quizzes + 1 })); toastShow('Question created'); }
          setQuizDrawerOpen(false);
        }}
        onDelete={deleteQuiz} />
      <ContactViewModal item={contactViewing} open={contactModalOpen} onClose={() => setContactModalOpen(false)} onDelete={deleteContact} />
      <PartnerViewModal item={partnerViewing} open={partnerModalOpen} onClose={() => setPartnerModalOpen(false)} onDelete={deletePartner} />
      <SubscribersModal open={subsModalOpen} onClose={() => setSubsModalOpen(false)} subscribers={subscribers} onRefresh={loadData} onDelete={deleteSubscriber} toast={toastShow} />
      <ConfirmModal open={confirm.open} message={confirm.message} onClose={() => setConfirm({ ...confirm, open: false })} onConfirm={confirm.action} />
      {toastNode}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      {icon}
      <p className="text-xs text-slate-500">{text}</p>
    </div>
  );
}

// ── AdminPanel (gate + boundary) ───────────────────────────────
export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin = false, userEmail = null, loading = false, onBackToApp,
}) => {
  const { t } = useTranslation();
  const [passkey, setPasskey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(isAdmin);

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === ADMIN_PASSKEY) setIsAuthenticated(true);
    else { alert(t('admin.incorrectPasskey')); setPasskey(''); }
  };

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
            <input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder={t('admin.passkeyPlaceholder')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white focus:border-cyan-500 focus:outline-none" />
            <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer">{t('admin.unlock')}</button>
          </form>
          {onBackToApp && (
            <button onClick={onBackToApp} className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> {t('admin.returnToSite')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AdminErrorBoundary>
        <AdminDashboard userEmail={userEmail} onBackToApp={onBackToApp} />
      </AdminErrorBoundary>
    </div>
  );
};

export default AdminPanel;
