import React, { useEffect } from 'react';
import { X, Check, Zap, ShieldCheck } from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Replace this URL with your active Stripe Payment Link from your Stripe Dashboard
const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/YOUR_ACTUAL_STRIPE_LINK_HERE';

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose }) => {
  // Prevent body scrolling behind the modal when open
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

  const handleUpgradeClick = () => {
    if (STRIPE_CHECKOUT_URL.includes('YOUR_ACTUAL_STRIPE_LINK')) {
      alert('Please set your active Stripe Payment Link in ProUpgradeModal.tsx');
      return;
    }
    window.open(STRIPE_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto overscroll-contain transition-opacity duration-200 select-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-amber-500/30 p-6 shadow-2xl overflow-hidden my-auto will-change-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pr-6">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Upgrade to Pro</h3>
            <p className="text-xs text-amber-400/90 font-medium">Unlock full access to all notes</p>
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-3 my-6">
          {[
            'Unlimited high-speed PDF downloads',
            'Full access to all Pro-gated semester summaries',
            'Watermark-free viewing & printing support',
            'Priority support for new UniKL MIAT modules',
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <div className="p-1 bg-cyan-500/10 text-cyan-400 rounded-full mt-0.5 shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleUpgradeClick}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <ShieldCheck className="w-5 h-5" /> Get AeroNotes Pro Access
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default ProUpgradeModal;
