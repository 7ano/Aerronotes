import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AdminPanelProps {
  isAdmin?: boolean;
  userEmail?: string | null;
  loading?: boolean;
  onBackToApp?: () => void;
}

const ADMIN_PASSKEY = '1234'; // Replace with your desired passkey

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin = false,
  userEmail = null,
  loading = false,
  onBackToApp,
}) => {
  const [passkey, setPasskey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(isAdmin);

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === ADMIN_PASSKEY) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Admin Passkey!');
      setPasskey('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">AeroNotes Admin Panel</h2>
          <p className="text-xs text-slate-400 mb-6">Restricted administrative access. Enter key to proceed.</p>

          <form onSubmit={handlePasskeySubmit} className="space-y-4">
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Enter Admin Passkey"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              Unlock Access
            </button>
          </form>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Main Site
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Existing Admin Panel JSX continues here... */}
    </div>
  );
};

export default AdminPanel;
