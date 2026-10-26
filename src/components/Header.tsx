import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Award,
  BookMarked,
  FileUp,
  Users,
  Crown,
  User,
  LogOut,
  Mail,
  Globe,
} from 'lucide-react';

export type TabId = 'resources' | 'quiz' | 'formulas' | 'notes' | 'partner';

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isPro: boolean;
  onUpgradeClick: () => void;
  profile: any | null;
  onSignInClick: () => void;
  onSignOut: () => void;
  onContactClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isPro,
  onUpgradeClick,
  profile,
  onSignInClick,
  onSignOut,
  onContactClick,
}) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ms' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const getUserInitials = () => {
    if (!profile) return 'GU';
    const name = profile.full_name || profile.email || 'US';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* AeroNotes Brand & Logo */}
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => onTabChange('resources')}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 font-black text-xl text-slate-950 shadow-lg shadow-cyan-500/20">
            A
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">AeroNotes</span>
            <p className="-mt-1 hidden text-[10px] font-medium text-slate-400 sm:block">
              For Aircraft Engineering
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="hidden items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-1 md:flex">
          <button
            type="button"
            onClick={() => onTabChange('resources')}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'resources'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Resource Hub
          </button>

          <button
            type="button"
            onClick={() => onTabChange('quiz')}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4" /> EASA Quiz
          </button>

          <button
            type="button"
            onClick={() => onTabChange('formulas')}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'formulas'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookMarked className="h-4 w-4" /> Formulas & Acronyms
          </button>

          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileUp className="h-4 w-4" /> Submit Notes
          </button>

          <button
            type="button"
            onClick={() => onTabChange('partner')}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'partner'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" /> Partner
          </button>
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span className="uppercase">{i18n.language || 'EN'}</span>
          </button>

          {/* Contact Button */}
          <button
            type="button"
            onClick={onContactClick}
            className="hidden sm:flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Mail className="h-3.5 w-3.5 text-slate-400" /> Contact
          </button>

          {/* Upgrade Button */}
          <button
            type="button"
            onClick={onUpgradeClick}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 ${
              isPro
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 hover:from-amber-500/30 hover:to-amber-600/30'
            }`}
          >
            <Crown className={`h-4 w-4 ${isPro ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{isPro ? 'Pro Active' : 'Upgrade'}</span>
          </button>

          {/* Auth State & User Badge */}
          {profile ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-600/30 text-[10px] font-bold text-cyan-400">
                  {getUserInitials()}
                </span>
                <span className="hidden font-semibold sm:inline">
                  {profile.full_name?.split(' ')[0] || 'User'}
                </span>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignInClick}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-cyan-500 transition-all active:scale-95"
            >
              <User className="h-4 w-4" /> Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
