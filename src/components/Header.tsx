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
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import logoUrl from '@/LO.svg';

export type TabId = 'resources' | 'quiz' | 'formulas' | 'notes' | 'partner';

export interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isPro: boolean;
  onUpgradeClick: () => void;
  profile: any | null;
  onSignInClick: () => void;
  onSignOut: () => void;
  onContactClick: () => void;
}

export const TrackToggle: React.FC<{
  track?: 'academic' | 'easa';
  onTrackChange?: (track: 'academic' | 'easa') => void;
}> = ({ track = 'academic', onTrackChange }) => {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
      <button
        type="button"
        onClick={() => onTrackChange && onTrackChange('academic')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
          track === 'academic'
            ? 'bg-cyan-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        {t('header.uniKlMiat')}
      </button>
      <button
        type="button"
        onClick={() => onTrackChange && onTrackChange('easa')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
          track === 'easa'
            ? 'bg-cyan-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        {t('header.easaPart66')}
      </button>
    </div>
  );
};

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
  const { t } = useTranslation();

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: 'resources', icon: <BookOpen className="h-4 w-4" />, label: t('nav.resourceHub') },
    { id: 'quiz', icon: <Award className="h-4 w-4" />, label: t('nav.easaQuiz') },
    { id: 'formulas', icon: <BookMarked className="h-4 w-4" />, label: t('nav.formulas') },
    { id: 'notes', icon: <FileUp className="h-4 w-4" />, label: t('nav.notes') },
    { id: 'partner', icon: <Users className="h-4 w-4" />, label: t('nav.partner') },
  ];

  const getUserInitials = () => {
    if (!profile) return 'GU';
    const name = profile.full_name || profile.email || 'US';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand Logo */}
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => onTabChange('resources')}
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-cyan-500/20 blur-md" />
            <img
              src={logoUrl}
              alt="AeroNotes"
              className="relative h-10 w-10 rounded-xl object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
            />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-wide">{t('header.appName')}</span>
            <p className="-mt-1 hidden text-[10px] font-medium text-slate-400 sm:block">
              {t('header.appTagline')}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-1 md:flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector />

          <button
            type="button"
            onClick={onContactClick}
            className="hidden sm:flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Mail className="h-3.5 w-3.5 text-slate-400" /> {t('nav.contact')}
          </button>

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
            <span>{isPro ? t('header.pro') : t('header.upgrade')}</span>
          </button>

          {profile ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-600/30 text-[10px] font-bold text-cyan-400">
                  {getUserInitials()}
                </span>
                <span className="hidden font-semibold sm:inline">
                  {profile.full_name?.split(' ')[0] || t('header.pro')}
                </span>
              </div>

              <button
                type="button"
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                aria-label={t('header.signOut')}
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
              <User className="h-4 w-4" /> {t('header.signIn')}
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
