import { useTranslation } from 'react-i18next';
import { Plane, GraduationCap, FileText, Brain, Sigma, PenLine, Crown, LogOut } from 'lucide-react';
import type { StudentProfile } from '@/types';
import LanguageSelector from '@/components/LanguageSelector';

export type TabId = 'resources' | 'quiz' | 'formulas' | 'notes';

export interface TabConfig {
  id: TabId;
  labelKey: string;
  icon: typeof Plane;
}

export const tabs: TabConfig[] = [
  { id: 'resources', labelKey: 'nav.resourceHub', icon: FileText },
  { id: 'quiz', labelKey: 'nav.easaQuiz', icon: Brain },
  { id: 'formulas', labelKey: 'nav.formulas', icon: Sigma },
  { id: 'notes', labelKey: 'nav.notes', icon: PenLine },
];

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isPro: boolean;
  onUpgradeClick: () => void;
  profile: StudentProfile | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Header({
  activeTab, onTabChange, isPro, onUpgradeClick, profile, onSignInClick, onSignOut,
}: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 shadow-lg shadow-sky-500/20">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                {t('header.appName')}
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                {t('header.appTagline')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language selector */}
            <LanguageSelector />

            {/* Pro badge / upgrade button */}
            {isPro ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <Crown className="h-3.5 w-3.5" />
                {t('header.pro')}
              </span>
            ) : profile ? (
              <button
                onClick={onUpgradeClick}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                <Crown className="h-3.5 w-3.5" />
                {t('header.upgrade')}
              </button>
            ) : null}

            {/* Auth: avatar or sign-in */}
            {profile ? (
              <div className="group relative flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/50 py-1 pl-1 pr-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-amber-500 text-xs font-bold text-white">
                    {initials(profile.full_name)}
                  </div>
                  <span className="hidden text-xs font-medium text-slate-200 sm:inline">
                    {profile.full_name.split(' ')[0]}
                  </span>
                </div>
                {/* Dropdown */}
                <div className="invisible absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-700/60 bg-slate-900 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="border-b border-slate-800/60 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                    <p className="text-xs text-slate-400">{profile.student_id}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{profile.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={onSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('header.signOut')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                {t('header.signIn')}
              </button>
            )}

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform ${active ? 'scale-110' : ''}`} />
                    {t(tab.labelKey)}
                    {active && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-sky-400 to-amber-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 md:hidden scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function TrackToggle({
  track,
  onTrackChange,
}: {
  track: 'academic' | 'easa';
  onTrackChange: (t: 'academic' | 'easa') => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-900/60 p-1">
      <button
        onClick={() => onTrackChange('academic')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ${
          track === 'academic'
            ? 'bg-sky-500/20 text-sky-300 shadow-[0_0_20px_-4px] shadow-sky-500/40'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <GraduationCap className="h-4 w-4" />
        {t('header.uniKlMiat')}
      </button>
      <button
        onClick={() => onTrackChange('easa')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ${
          track === 'easa'
            ? 'bg-amber-500/20 text-amber-300 shadow-[0_0_20px_-4px] shadow-amber-500/40'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <FileText className="h-4 w-4" />
        {t('header.easaPart66')}
      </button>
    </div>
  );
}
