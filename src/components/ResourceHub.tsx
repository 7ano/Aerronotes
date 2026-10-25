import React, { useState, useEffect } from 'react';
import { Download, Eye, Lock, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { PdfPreviewModal } from './PdfPreviewModal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  description?: string;
  semester?: number;
  module?: string;
  file_url?: string;
  fileUrl?: string;
  is_pro?: boolean;
  isPro?: boolean;
  category?: string;
  track?: string;
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
  const [selectedPdf, setSelectedPdf] = useState<{
    url: string;
    title: string;
    isPro?: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchAdminNotes() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setResources(data);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminNotes();
  }, []);

  const getPdfUrl = (item: ResourceItem) => item.file_url || item.fileUrl || '';
  const isItemPro = (item: ResourceItem) => item.is_pro ?? item.isPro ?? false;

  const handlePreview = (e: React.MouseEvent, resource: ResourceItem) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getPdfUrl(resource);
    if (url) {
      setSelectedPdf({
        url,
        title: resource.title,
        isPro: isItemPro(resource),
      });
    } else {
      alert('File URL not found for this resource.');
    }
  };

  const handleDownload = (e: React.MouseEvent, resource: ResourceItem) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getPdfUrl(resource);

    if (isItemPro(resource) && !isProUser) {
      if (onOpenProModal) {
        onOpenProModal();
      } else {
        alert('This resource is locked for Pro members. Please upgrade to download.');
      }
      return;
    }

    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
        <p className="text-sm">Loading UniKL MIAT study materials...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" /> Resource Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access verified Aircraft Engineering notes, summaries, and exam guides
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-cyan-400 border border-slate-700 rounded-full">
          {resources.length} resources available
        </span>
      </div>

      {/* Grid of Study Materials */}
      {resources.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Sparkles className="w-10 h-10 text-cyan-500/40 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No study materials uploaded yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Notes uploaded via the Admin panel will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const proStatus = isItemPro(resource);

            return (
              <div
                key={resource.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-xl group hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                        {resource.category || 'Mechanical'}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        {resource.semester
                          ? `Semester ${resource.semester}`
                          : resource.module || 'General'}
                      </span>
                    </div>

                    {proStatus && (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md shadow-sm">
                        <Lock className="w-3 h-3" /> PRO
                      </span>
                    )}
                  </div>

                  {/* Title & Subject */}
                  <h4 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors mb-1 truncate">
                    {resource.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 mb-3">
                    {resource.subject || 'Aircraft Engineering'}
                  </p>

                  {/* Description */}
                  {resource.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {resource.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80 mt-2">
                  <button
                    type="button"
                    onClick={(e) => handlePreview(e, resource)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, resource)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 ${
                      proStatus && !isProUser
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 shadow-sm'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                    }`}
                  >
                    {proStatus && !isProUser ? (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Unlock Pro
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" /> Get Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Preview Modal with Pro Gating */}
      {selectedPdf && (
        <PdfPreviewModal
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
          fileUrl={selectedPdf.url}
          title={selectedPdf.title}
          isPro={selectedPdf.isPro}
          isProUser={isProUser}
          onOpenProModal={onOpenProModal}
        />
      )}
    </div>
  );
};

export default ResourceHub;
