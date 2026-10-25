import React, { useState, useEffect } from 'react';
import { BookOpen, Crown, Shield, Lock } from 'lucide-react';
import { ResourceHub } from './components/ResourceHub';
import { AdminPanel } from './components/AdminPanel';
import { ProUpgradeModal } from './components/ProUpgradeModal';

// Set your secret admin passkey here
const ADMIN_PASSKEY = '1234'; 

export function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'admin'>('hub');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isProUser, setIsProUser] = useState(false);

  // Check URL path on load (e.g., aeronotes.study/admin or ?admin=true)
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (path.includes('/admin') || searchParams.get('admin') === 'true') {
      handleAdminAccess();
    }
  }, []);

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setActiveTab('admin');
      return;
    }

    const inputKey = prompt('Enter Admin Passkey:');
    if (inputKey === ADMIN_PASSKEY) {
      setIsAdminAuthenticated(true);
      setActiveTab('admin');
    } else if (inputKey !== null) {
      alert('Incorrect passkey!');
      setActiveTab('hub');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Global Navigation Bar */}
      <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveTab('hub')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
              A
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight">AeroNotes</span>
              <p className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                For Aircraft Engineering
              </p>
            </div>
          </div>

          {/* Center Navigation - Public only shows Resource Hub */}
          <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('hub')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'hub'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Resource Hub
            </button>

            {/* Admin tab is hidden from public view unless authenticated */}
            {isAdminAuthenticated && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </button>
            )}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsProModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Upgrade</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium">
              <span className="w-6 h-6 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                MM
              </span>
              <span className="hidden sm:inline">Mohammed</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'admin' && isAdminAuthenticated ? (
          <AdminPanel />
        ) : (
          <ResourceHub
            isProUser={isProUser}
            onOpenProModal={() => setIsProModalOpen(true)}
          />
        )}
      </main>

      {/* Hidden Admin Access Trigger in Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>AeroNotes (MIAT Central) • For UniKL MIAT students & EASA Part-66 candidates</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setActiveTab('hub')} className="hover:text-cyan-400 transition-colors">Hub</button>
            <button onClick={() => setIsProModalOpen(true)} className="hover:text-amber-400 transition-colors">Pro</button>
            {/* Secret keyhole button for Admin Access */}
            <button 
              onClick={handleAdminAccess} 
              className="hover:text-slate-200 transition-colors p-1 text-slate-600"
              title="Admin Login"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />

    </div>
  );
}

export default App;
