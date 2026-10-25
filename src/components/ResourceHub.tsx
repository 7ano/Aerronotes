import React, { useState } from 'react';
import { Download, Eye, Lock } from 'lucide-react';
import { PdfPreviewModal } from './PdfPreviewModal';

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  semester: number;
  category?: 'Avionics' | 'Mechanical' | 'General';
  fileUrl: string;
  isPro?: boolean;
}

export interface ResourceHubProps {
  resources?: ResourceItem[];
  isProUser?: boolean;
  onOpenProModal?: () => void;
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  {
    id: '1',
    title: 'dt',
    subject: 'Thermofluids',
    semester: 3,
    category: 'Mechanical',
    fileUrl: 'https://xcjcihvopfwkjzghceev.supabase.co/storage/v1/object/public/notes/dt.pdf',
    isPro: false,
  },
  {
    id: '2',
    title: 'e',
    subject: 'Thermofluids',
    semester: 2,
    category: 'Mechanical',
    fileUrl: 'https://xcjcihvopfwkjzghceev.supabase.co/storage/v1/object/public/notes/e.pdf',
    isPro: true,
  },
];

export const ResourceHub: React.FC<ResourceHubProps> = ({
  resources = DEFAULT_RESOURCES,
  isProUser = false,
  onOpenProModal,
}) => {
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);

  // If array is empty, fall back to default resources so cards never vanish
  const activeResources = resources && resources.length > 0 ? resources : DEFAULT_RESOURCES;

  const handleDownload = (e: React.MouseEvent, resource: ResourceItem) => {
    e.preventDefault();
    e.stopPropagation();

    if (resource.isPro && !isProUser) {
      if (onOpenProModal) onOpenProModal();
      return;
    }

    if (!resource.fileUrl) return;

    const link = document.createElement('a');
    link.href = resource.fileUrl;
    link.download = `${resource.title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (e: React.MouseEvent, resource: ResourceItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (resource.fileUrl) {
      setSelectedPdf({ url: resource.fileUrl, title: resource.title });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Resource Hub</h2>
        <span className="text-sm text-slate-400">
          {activeResources.length} resources available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {activeResources.map((resource) => (
          <div
            key={resource.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  Semester {resource.semester}
                </span>
                {resource.isPro && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                    <Lock className="w-3 h-3" /> PRO
                  </span>
                )}
              </div>
              <h4 className="text-lg font-bold text-slate-100 mb-1">{resource.title}</h4>
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
                  resource.isPro && !isProUser
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {resource.isPro && !isProUser ? (
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
