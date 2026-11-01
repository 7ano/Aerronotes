import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Shield, Loader2, Lock, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker once
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  isPro?: boolean;
  isProUser?: boolean;
  resourceId?: string;
  onOpenProModal?: () => void;
}

const MAX_PREVIEW_PAGES = 5;

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  title,
  isPro = false,
  isProUser = false,
  resourceId,
  onOpenProModal,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine how many pages to show
  const canViewFull = !isPro || isProUser;
  const viewablePages = canViewFull ? MAX_PREVIEW_PAGES : 1;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Load the PDF document
  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setTotalPages(0);
    setCurrentPage(1);

    (async () => {
      try {
        // Fetch the PDF as a blob — no direct URL exposed in the DOM
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const doc = await loadingTask.promise;
        if (cancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, fileUrl]);

  // Render the current page to canvas with burned-in watermark
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const container = containerRef.current;
    const containerWidth = container?.clientWidth ?? 600;
    const targetWidth = Math.min(containerWidth, 800);

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.style.width = `${scaledViewport.width}px`;
    canvas.style.height = `${scaledViewport.height}px`;

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

    // ── Burn watermark directly into canvas pixels ──
    // This cannot be removed via DevTools — it's part of the rendered image data
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.font = `bold ${Math.round(canvas.width / 12)}px Inter, Arial, sans-serif`;
    ctx.fillStyle = '#06B6D4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AERONOTES PREVIEW', 0, 0);
    ctx.font = `${Math.round(canvas.width / 28)}px Inter, Arial, sans-serif`;
    ctx.fillStyle = '#0EA5E9';
    ctx.fillText('aeronotes.study', 0, Math.round(canvas.width / 18));
    ctx.restore();

    // Corner watermark for non-pro users
    if (!canViewFull) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.font = `bold 11px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'right';
      ctx.fillText('PRO PREVIEW · UPGRADE FOR FULL ACCESS', canvas.width - 12, canvas.height - 8);
      ctx.restore();
    }
  }, [pdfDoc, canViewFull]);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage(currentPage).catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      });
    }
  }, [pdfDoc, currentPage, renderPage]);

  // Guard: if Pro resource and user is not Pro, show locked state instead of fetching
  const shouldLockPreview = isPro && !isProUser;

  if (!isOpen) return null;

  const handleDownload = () => {
    if (shouldLockPreview) {
      if (onOpenProModal) onOpenProModal();
      return;
    }
    // Pro users get download via the authenticated serve-pdf endpoint
    if (resourceId) {
      const path = fileUrl.includes('/notes/') ? fileUrl.split('/notes/').pop() ?? '' : '';
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-pdf?path=${encodeURIComponent(path)}&resource=${resourceId}&mode=download`;
      window.open(endpoint, '_blank');
    } else {
      // Fallback: direct download for non-gated resources
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!shouldLockPreview && totalPages > 1 && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-400 font-medium tabular-nums">
                  {currentPage} / {Math.min(totalPages, viewablePages)}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= Math.min(totalPages, viewablePages)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label={t('pricing.close', { defaultValue: 'Close' })}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Viewer Container */}
        <div
          ref={containerRef}
          className="relative w-full flex-1 bg-slate-950 overflow-y-auto min-h-[400px] h-[65vh] sm:h-[72vh] select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
              <p className="text-sm text-slate-400">{t('pdfPreview.loadingPreview', { defaultValue: 'Loading secure preview...' })}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="text-sm text-slate-300 mb-1">{t('pdfPreview.previewError', { defaultValue: 'Unable to load preview.' })}</p>
              <p className="text-xs text-slate-500 max-w-sm">{error}</p>
            </div>
          ) : shouldLockPreview ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4">
                <Lock className="w-12 h-12 text-amber-400" />
              </div>
              <p className="text-base font-bold text-white mb-1">Pro Content Locked</p>
              <p className="text-sm text-slate-400 max-w-sm mb-6">
                {t('pdfPreview.proLocked', { defaultValue: 'This resource is locked for Pro members.' })}
              </p>
              {onOpenProModal && (
                <button
                  type="button"
                  onClick={onOpenProModal}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-2xl"
                style={{ maxWidth: '100%' }}
              />
              {!canViewFull && totalPages > 1 && (
                <p className="text-xs text-amber-400/80 mt-3 font-medium">
                  Preview limited to page 1. Upgrade for full access.
                </p>
              )}
              {canViewFull && currentPage === viewablePages && totalPages > MAX_PREVIEW_PAGES && (
                <p className="text-xs text-slate-500 mt-3">
                  Showing {MAX_PREVIEW_PAGES} of {totalPages} pages. Use download for full document.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/90 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>{t('pdfPreview.watermarkedPreview', { defaultValue: 'Watermarked preview' })}</span>
          </div>
          <button
            onClick={handleDownload}
            className={`flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-lg transition-colors cursor-pointer ${
              shouldLockPreview
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {shouldLockPreview ? (
              <><Lock className="w-4 h-4" /> {t('pdfPreview.unlockProToDownload', { defaultValue: 'Unlock Pro to Download' })}</>
            ) : (
              <><Download className="w-4 h-4" /> {t('pdfPreview.downloadPdf', { defaultValue: 'Download PDF' })}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
