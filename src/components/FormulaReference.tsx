import { useMemo, useState } from 'react';
import { Search, Sigma, Zap, Thermometer, Wind, BookMarked } from 'lucide-react';
import { formulas, acronyms } from '@/data/formulas';
import type { Formula } from '@/types';

type View = 'formulas' | 'acronyms';

const categoryIcons: Record<Formula['category'], typeof Sigma> = {
  Aerodynamics: Wind,
  Thermodynamics: Thermometer,
  Electrical: Zap,
};

const categoryColors: Record<Formula['category'], string> = {
  Aerodynamics: 'sky',
  Thermodynamics: 'orange',
  Electrical: 'amber',
};

export default function FormulaReference() {
  const [view, setView] = useState<View>('formulas');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const formulaCategories = ['all', 'Aerodynamics', 'Thermodynamics', 'Electrical'];
  const acronymCategories = ['all', ...Array.from(new Set(acronyms.map(a => a.category)))];

  const filteredFormulas = useMemo(() => {
    return formulas.filter(f => {
      if (category !== 'all' && f.category !== category) return false;
      if (search) {
        const s = search.toLowerCase();
        return f.name.toLowerCase().includes(s) ||
          f.equation.toLowerCase().includes(s) ||
          f.description.toLowerCase().includes(s);
      }
      return true;
    });
  }, [search, category]);

  const filteredAcronyms = useMemo(() => {
    return acronyms.filter(a => {
      if (view === 'formulas') return false;
      if (category !== 'all' && a.category !== category) return false;
      if (search) {
        const s = search.toLowerCase();
        return a.acronym.toLowerCase().includes(s) ||
          a.expansion.toLowerCase().includes(s) ||
          a.description.toLowerCase().includes(s);
      }
      return true;
    });
  }, [search, category, view]);

  const activeCategories = view === 'formulas' ? formulaCategories : acronymCategories;

  function switchView(v: View) {
    setView(v);
    setCategory('all');
    setSearch('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Sigma className="h-6 w-6 text-sky-400" />
            Formula & Acronym Reference
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Instant searchable equation cards and aviation acronyms
          </p>
        </div>

        {/* View toggle */}
        <div className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-900/60 p-1">
          <button
            onClick={() => switchView('formulas')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              view === 'formulas' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            Formulas
          </button>
          <button
            onClick={() => switchView('acronyms')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              view === 'acronyms' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="h-4 w-4" />
            Acronyms
          </button>
        </div>
      </div>

      {/* Search + category pills */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={view === 'formulas' ? 'Search equations...' : 'Search acronyms...'}
            className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-slate-600 focus:ring-2 focus:ring-slate-700/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {activeCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                category === cat
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Formula cards */}
      {view === 'formulas' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFormulas.map(f => {
            const Icon = categoryIcons[f.category];
            const color = categoryColors[f.category];
            return (
              <div
                key={f.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-800/40"
              >
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-5 blur-2xl transition group-hover:opacity-15 ${
                  color === 'sky' ? 'bg-sky-500' : color === 'orange' ? 'bg-orange-500' : 'bg-amber-500'
                }`} />
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                    color === 'sky' ? 'bg-sky-500/10 text-sky-400' :
                    color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{f.category}</span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-100">{f.name}</h3>
                <div className="mt-3 rounded-lg border border-slate-700/40 bg-slate-950/60 px-4 py-3">
                  <p className="font-mono text-lg font-medium text-slate-200 tracking-tight">{f.equation}</p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{f.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Acronym list */}
      {view === 'acronyms' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAcronyms.map(a => (
            <div
              key={a.id}
              className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 font-mono text-sm font-bold text-amber-300">
                    {a.acronym}
                  </span>
                  <span className="rounded-md bg-slate-700/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {a.category}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-sm font-semibold text-slate-100">{a.expansion}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{a.description}</p>
            </div>
          ))}
        </div>
      )}

      {((view === 'formulas' && filteredFormulas.length === 0) ||
        (view === 'acronyms' && filteredAcronyms.length === 0)) && (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-slate-400">No results found</p>
        </div>
      )}
    </div>
  );
}
