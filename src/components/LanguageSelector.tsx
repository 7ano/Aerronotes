import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { supportedLanguages } from '@/i18n';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language?.split('-')[0] ?? 'en';
  const current = supportedLanguages.find(l => l.code === currentLang) ?? supportedLanguages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectLanguage(code: string) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="text-sm leading-none">{current.flag}</span>
        <span>{current.short}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl">
          {supportedLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition ${
                lang.code === currentLang
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.label}</span>
              {lang.code === currentLang && <Check className="h-4 w-4 text-sky-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
