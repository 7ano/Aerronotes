import React, { useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';

export interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  title,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        e.stopPropagation();
        alert('Downloading, printing, and saving are restricted.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none print:hidden">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col shadow-2xl">
        
        {/* Header - High Z-index & Explicit Click Handling */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-50 relative">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-100 truncate max-w-md">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer relative z-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* PDF Viewer Container */}
        <div 
          className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 select-none"
          onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
        >
          {/* Watermark Grid - Set strictly to pointer-events-none so all clicks pass directly to PDF/modal */}
          <div className="absolute inset-0 z-20 pointer-events-none grid grid-cols-2 md:grid-cols-3 gap-8 p-6 items-center justify-items-center opacity-40 overflow-hidden">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div 
                key={idx} 
                className="transform -rotate-25 select-none text-center pointer-events-none"
              >
                <p className="text-2xl md:text-3xl font-black tracking-wider uppercase text-red-600 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                  AERONOTES
                </p>
                <p className="text-xs md:text-sm font-extrabold text-slate-900 bg-white/70 px-2 py-0.5 rounded shadow-sm mt-1">
                  PREVIEW ONLY • DO NOT COPY
                </p>
              </div>
            ))}
          </div>

          {/* PDF iframe */}
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 relative z-10" title={title} /> </div> </div> </div> ); };  export default PdfPreviewModal; ```  ---  ### 2. Update `src/components/ResourceHub.tsx`  Ensure the state handler correctly triggers both **Preview** and **Get / Download** buttons:  ```tsx import React, { useState } from 'react'; import { Download, Eye, Lock } from 'lucide-react'; import { PdfPreviewModal } from './PdfPreviewModal';  interface Resource { id: string; title: string; subject: string; semester: number; category: 'Avionics' \vert{} 'Mechanical' \vert{} 'General'; fileUrl: string; isPro: boolean; }  interface ResourceHubProps { resources: Resource[]; isProUser: boolean; onOpenProModal: () => void; }  export const ResourceHub: React.FC<ResourceHubProps> = ({ resources, isProUser, onOpenProModal, }) => { const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } \vert{} null>(null);  const handleDownload = (e: React.MouseEvent, resource: Resource) => { e.preventDefault(); e.stopPropagation();  if (resource.isPro && !isProUser) { onOpenProModal(); return; }  if (!resource.fileUrl) return;  const link = document.createElement('a'); link.href = resource.fileUrl; link.download = `${resource.title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (e: React.MouseEvent, resource: Resource) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPdf({ url: resource.fileUrl, title: resource.title });
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
                className={`flex-1 flex items-center justify-center gap-2
