import React, { useEffect } from 'react';
import { X, Download, Shield, ExternalLink, Globe } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  isPro?: boolean;
  isProUser?: boolean;
  onOpenProModal?: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  title,
  isPro = false,
  isProUser = false,
  onOpenProModal,
}) => {
  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExternalOpen = (e: React.MouseEvent) => {
    if (isPro && !isProUser) {
      e.preventDefault();
      if (onOpenProModal) {
        onOpenProModal();
      } else {
        alert('This resource is locked for Pro members. Please upgrade to access.');
      }
      return;
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    if (isPro && !isProUser) {
      e.preventDefault();
      if (onOpenProModal) {
        onOpenProModal();
      } else {
        alert('This resource is locked for Pro members. Please upgrade to download.');
      }
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain transition-opacity duration-200"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh] will-change-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={isPro && !isProUser ? '#' : fileUrl}
              onClick={handleExternalOpen}
              target={isPro && !isProUser ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Open PDF in new tab"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Open Full PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div
          className="relative w-full flex-1 bg-slate-950 overflow-y-auto min-h-[400px] h-[70vh] sm:h-[75vh] touch-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Prominent High-Visibility Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center opacity-30 select-none">
            <p className="text-4xl sm:text-6xl font-black tracking-widest text-cyan-300 uppercase transform -rotate-45 drop-shadow-md">
              AERANOTES PREVIEW
            </p>
            <a
              href="https://aeronotes.study"
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto mt-4 px-4 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-full text-xs sm:text-sm font-bold tracking-wider hover:bg-cyan-500/30 transition-all flex items-center gap-2 backdrop-blur-md transform -rotate-45"
            >
              <Globe className="w-4 h-4" /> aeronotes.study
            </a>
          </div>

          <object
            data={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            type="application/pdf"
            className="w-full h-full min-h-[400px] border-0"
          >
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              className="w-full h-full min-h-[400px] border-0"
              title={title}
            />
          </object>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/90 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Watermarked preview version</span>
            <span className="text-slate-600">•</span>
            <a
              href="https://aeronotes.study"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline font-medium flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" /> aeronotes.study
            </a>
          </div>

          <a
            href={isPro && !isProUser ? '#' : fileUrl}
            onClick={handleDownloadClick}
            download={`${title}.pdf`}
            className={`w-full sm:w-auto ml-auto px-4 py-2 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isPro && !isProUser
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <Download className="w-4 h-4" /> {isPro && !isProUser ? 'Unlock Pro to Download' : 'Download PDF'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
