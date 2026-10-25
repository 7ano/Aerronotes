import React, { useState, useEffect } from 'react';
import { Upload, Trash2, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AdminPanel: React.FC = () => {
  const [track, setTrack] = useState<'academic' | 'easa'>('academic');
  const [semester, setSemester] = useState<number>(1);
  const [module, setModule] = useState<string>('M1');
  const [subject, setSubject] = useState<string>('Aircraft Structures');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [notes, setNotes] = useState<any[]>([]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Fetch error:', error);
      if (data) setNotes(data);
    } catch (err) {
      console.error('Database connection error:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      alert('Please provide a title and select a PDF file.');
      return;
    }

    try {
      setUploading(true);

      // 1. Sanitize file name to ASCII-only format to avoid storage key errors
      const fileExt = file.name.split('.').pop() || 'pdf';
      const safeName = `${Date.now()}_doc.${fileExt}`;

      // 2. Upload file to Supabase Storage 'notes' bucket
      const { error: storageError } = await supabase.storage
        .from('notes')
        .upload(safeName, file, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (storageError) throw storageError;

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('notes')
        .getPublicUrl(safeName);

      const fileUrl = publicUrlData.publicUrl;

      // 4. Build payload with all schema columns included
      const payload: any = {
        title: title.trim(),
        subject: subject.trim() || 'General',
        file_url: fileUrl,
        file_type: 'pdf',
        is_pro: isPro,
        track,
      };

      if (track === 'academic') payload.semester = Number(semester);
      if (track === 'easa') payload.module = module.trim();
      if (description.trim()) payload.description = description.trim();

      // 5. Insert record into Supabase
      const { error: dbError } = await supabase.from('resources').insert([payload]);

      if (dbError) throw dbError;

      alert('Note uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      setIsPro(false);
      fetchNotes();
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    await supabase.from('resources').delete().eq('id', id);
    fetchNotes();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AeroNotes Admin Panel</h2>
            <p className="text-xs text-slate-400">Manage, Upload & Toggle Pro Access for Notes</p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleUpload} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 space-y-6 shadow-xl">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTrack('academic')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                track === 'academic' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Academic (UniKL MIAT)
            </button>
            <button
              type="button"
              onClick={() => setTrack('easa')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                track === 'easa' ? 'bg-cyan-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              EASA Part-66
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {track === 'academic' ? (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Semester *</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Module *</label>
                <input
                  type="text"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  placeholder="e.g. M1, M2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Thermofluids, Piston Engines"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Thermofluids Chapter 3 Notes"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the note..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">PDF File *</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Access Type</label>
              <button
                type="button"
                onClick={() => setIsPro(!isPro)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isPro
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPro ? <Lock className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  <span className="text-sm font-bold">{isPro ? 'PRO Resource (Gated)' : 'Free Resource (Open)'}</span>
                </div>
                <span className="text-xs opacity-75">{isPro ? 'Requires Subscription' : 'Free Download'}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading to Supabase...' : 'Upload to Notes Library'}
          </button>
        </form>

        {/* Managed List */}
        <h3 className="text-lg font-bold text-white mb-4">All Managed Notes ({notes.length})</h3>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="p-6 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">
              No notes uploaded yet. Use the form above to upload your first note.
            </div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                      {n.semester ? `Semester ${n.semester}` : n.module || 'General'}
                    </span>
                    {n.is_pro ? (
                      <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
                        PRO
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
                        FREE
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-100">{n.title}</h4>
                  <p className="text-xs text-slate-400">{n.subject}</p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
