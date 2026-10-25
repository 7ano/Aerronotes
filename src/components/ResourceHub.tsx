import React, { useState, useEffect } from 'react';
import { Download, Eye, Lock, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { PdfPreviewModal } from './PdfPreviewModal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  semester: number;
  file_url: string;
  is_pro?: boolean;
}

export interface ResourceHubProps {
  isProUser?: boolean;
  onOpenProModal?: () => void;
}

export const ResourceHub: React.FC<ResourceHubProps> = ({
  isProUser = false,
  onOpenProModal,
}) => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function fetchDatabaseNotes() {
      try {
        setLoading(true);
        // Fetch only records created and managed in your database
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setResources(data);
        }
      } catch (err) {
        console.error('Error fetching database notes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabaseNotes();
  }, []);

  const handlePreview = (e: React.MouseEvent, resource: ResourceItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPdf({ url: resource.file_url, title: resource.title });
  };

  const handleDownload = (e: React.MouseEvent, resource: ResourceItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (resource.is_pro && !isProUser) {
      if (onOpenProModal) {
        onOpenProModal();
      } else {
        alert('This resource is locked for Pro members. Please upgrade to download.');
      }
      return;
    }

    const link = document.createElement('a');
    link.href = resource.file_url;
    link.download = `${resource.title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
        <p className="text-sm">Loading notes from database...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Resource Hub</h2>
        <span className="text-sm text-slate-400">{resources.length} resources available</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  Semester {resource.semester}
                </span>
                {resource.is_pro && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                    <Lock className="w-3 h-3" /> PRO
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-100 mb-1 truncate">{resource.title}</h4>
              <p className="text-sm text-slate-400 mb-4">{resource.subject}</p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={(e) => handlePreview(e, resource)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>

              <button
                type="button"
                onClick={(e) => handleDownload(e, resource)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  resource.is_pro && !isProUser
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {resource.is_pro && !isProUser ? (
                  <>
                    <Lock className="w-4 h-4" /> Unlock Pro
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Get
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPdf && (
        <PdfPreviewModal
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
          fileUrl={selectedPdf.url}
          title={selectedPdf.title}
        />
      )}
    </div>
  );
};

export default ResourceHub;
