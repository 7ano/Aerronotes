import React, { useState } from 'react';
import { Download, Eye, Lock, ShieldCheck } from 'lucide-react';
import { PdfPreviewModal } from './PdfPreviewModal';

interface Resource {
  id: string;
  title: string;
  subject: string;
  semester: number;
  category: 'Avionics' | 'Mechanical' | 'General';
  fileUrl: string;
  isPro: boolean;
}

interface ResourceHubProps {
  resources: Resource[];
  isProUser: boolean;
  onOpenProModal: () => void;
}

export const ResourceHub: React.FC<ResourceHubProps> = ({
  resources,
  isProUser,
  onOpenProModal,
}) => {
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);

  const handleDownload = (resource: Resource) => {
    // Prevent non-pro users from triggering direct Supabase bucket downloads
    if (resource.isPro && !isProUser) {
      onOpenProModal();
      return;
    }

    // Trigger direct download for authorized users
    const link = document.createElement('a');
    link.href = resource.fileUrl;
    link.download = `${resource.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  Sem {resource.semester} • {resource.category}
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
                onClick={() => setSelectedPdf({ url: resource.fileUrl, title: resource.title })}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" /> Preview
              </button>

              <button
                onClick={() => handleDownload(resource)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
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
                    <Download className="w-4 h-4" /> Download
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PDF Watermarked Preview Modal */}
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
