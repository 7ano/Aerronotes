import React, { useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface PdfPreviewModalProps {
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
      {/* Modal Card Container */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-100 truncate max-w-md">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* PDF Viewer Container */}
        <div 
          className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* High-Visibility Repeating Watermark Grid */}
          <div className="absolute inset-0 z-50 pointer-events-none grid grid-cols-2 md:grid-cols-3 gap-8 p-6 items-center justify-items-center opacity-45 overflow-hidden">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div 
                key={idx} 
                className="transform -rotate-25 select-none text-center pointer-events-none"
              >
                <p className="text-2xl md:text-3xl font-black tracking-wider uppercase text-red-600 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                  AERUNOTES
                </p>
                <p className="text-xs md:text-sm font-extrabold text-slate-900 bg-white/70 px-2 py-0.5 rounded shadow-sm mt-1">
                  PREVIEW ONLY • DO NOT COPY
                </p>
              </div>
            ))}
          </div>

          {/* PDF Frame */}
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0 relative z-10"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};
