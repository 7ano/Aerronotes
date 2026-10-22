import { useEffect, useMemo, useState } from 'react';
import {
  Brain, CheckCircle2, XCircle, RotateCcw, ChevronRight,
  Trophy, AlertCircle, Award, Lock, Crown,
} from 'lucide-react';
import type { QuizQuestion } from '@/types';
import { supabase } from '@/lib/supabase';

const easaModules = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
  'M11A', 'M11B', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17',
];
const PASS_MARK = 75;

type AnswerState = 'unanswered' | 'correct' | 'wrong';
interface AnsweredQ {
  question: QuizQuestion;
  selected: 'a' | 'b' | 'c';
  state: AnswerState;
}

interface QuizEngineProps {
  isPro: boolean;
  onUpgradeClick: () => void;
}

export default function QuizEngine({ isPro, onUpgradeClick }: QuizEngineProps) {
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [quizQs, setQuizQs] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnsweredQ[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('quiz_questions').select('*');
      setAllQuestions(data ?? []);
      setLoading(false);
    })();
  }, []);

  const moduleInfo = useMemo(() => {
    const info: Record<string, { count: number; isPro: boolean }> = {};
    for (const q of allQuestions) {
      if (!info[q.module_code]) {
        info[q.module_code] = { count: 0, isPro: false };
      }
      info[q.module_code].count++;
      if (q.is_pro) info[q.module_code].isPro = true;
    }
    return info;
  }, [allQuestions]);

  function startQuiz(module: string) {
    const qs = allQuestions.filter(q => q.module_code === module);
    if (qs.length === 0) return;
    setSelectedModule(module);
    setQuizQs(qs);
    setCurrentIdx(0);
    setAnswers([]);
    setStarted(true);
    setFinished(false);
  }

  function answerQuestion(selected: 'a' | 'b' | 'c') {
    const q = quizQs[currentIdx];
    const state: AnswerState = selected === q.correct_answer ? 'correct' : 'wrong';
    const newAnswers = [...answers, { question: q, selected, state }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentIdx + 1 < quizQs.length) {
        setCurrentIdx(currentIdx + 1);
      } else {
        setFinished(true);
      }
    }, 1800);
  }

  function restart() {
    setStarted(false);
    setFinished(false);
    setSelectedModule(null);
    setQuizQs([]);
    setAnswers([]);
    setCurrentIdx(0);
  }

  if (finished) {
    const score = Math.round((answers.filter(a => a.state === 'correct').length / answers.length) * 100);
    const passed = score >= PASS_MARK;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-8 text-center backdrop-blur-sm">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${passed ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
            {passed ? <Trophy className="h-10 w-10 text-emerald-400" /> : <AlertCircle className="h-10 w-10 text-red-400" />}
          </div>
          <h2 className="mt-5 text-2xl font-bold text-white">
            {passed ? 'PASSED' : 'NOT YET — KEEP GOING'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">EASA Part-66 · Module {selectedModule}</p>

          <div className="mt-6 flex items-center justify-center gap-1">
            <span className={`text-5xl font-black tabular-nums ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {score}%
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {answers.filter(a => a.state === 'correct').length} of {answers.length} correct · Pass mark: {PASS_MARK}%
          </p>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${passed ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
              style={{ width: `${score}%` }}
            />
          </div>

          <div className="mt-7 space-y-3 text-left">
            <h3 className="text-sm font-semibold text-slate-300">Review</h3>
            {answers.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3.5 ${a.state === 'correct' ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-red-800/50 bg-red-950/20'}`}
              >
                <div className="flex items-start gap-2.5">
                  {a.state === 'correct'
                    ? <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-400" />
                    : <XCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-400" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{a.question.question}</p>
                    {a.state === 'wrong' && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Correct answer: <span className="font-medium text-emerald-300">
                          {a.question[`option_${a.question.correct_answer}` as 'option_a' | 'option_b' | 'option_c']}
                        </span>
                      </p>
                    )}
                    <p className="mt-1 text-xs italic text-slate-500">{a.question.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={restart}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
          >
            <RotateCcw className="h-4 w-4" />
            Back to Modules
          </button>
        </div>
      </div>
    );
  }

  if (started && quizQs.length > 0) {
    const q = quizQs[currentIdx];
    const lastAnswer = answers[answers.length - 1];
    const isAnswered = lastAnswer && lastAnswer.question.id === q.id;
    const options: { key: 'a' | 'b' | 'c'; text: string }[] = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
    ];
    const progress = ((currentIdx + (isAnswered ? 1 : 0)) / quizQs.length) * 100;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-300">
              {selectedModule}
            </span>
            <span className="text-sm text-slate-400">
              Question {currentIdx + 1} of {quizQs.length}
            </span>
          </div>
          <button
            onClick={restart}
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            Exit
          </button>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-400/70">
            {q.topic}
          </div>
          <h3 className="text-lg font-semibold leading-relaxed text-white">{q.question}</h3>

          <div className="mt-5 space-y-3">
            {options.map(opt => {
              let cls = 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/60';
              if (isAnswered) {
                if (opt.key === q.correct_answer) {
                  cls = 'border-emerald-600/60 bg-emerald-950/40';
                } else if (opt.key === lastAnswer.selected) {
                  cls = 'border-red-600/60 bg-red-950/40';
                } else {
                  cls = 'border-slate-800/40 bg-slate-900/20 opacity-50';
                }
              }
              return (
                <button
                  key={opt.key}
                  disabled={isAnswered}
                  onClick={() => answerQuestion(opt.key)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${cls}`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isAnswered && opt.key === q.correct_answer
                      ? 'bg-emerald-500 text-white'
                      : isAnswered && opt.key === lastAnswer.selected
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {opt.key.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-200">{opt.text}</span>
                  {isAnswered && opt.key === q.correct_answer && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-400" />}
                  {isAnswered && opt.key === lastAnswer.selected && opt.key !== q.correct_answer && <XCircle className="ml-auto h-5 w-5 text-red-400" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className={`mt-5 rounded-xl border p-4 ${
              lastAnswer.state === 'correct' ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-amber-800/50 bg-amber-950/20'
            }`}>
              <div className="flex items-center gap-2">
                {lastAnswer.state === 'correct'
                  ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  : <XCircle className="h-4.5 w-4.5 text-red-400" />}
                <span className={`text-sm font-semibold ${lastAnswer.state === 'correct' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {lastAnswer.state === 'correct' ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{q.explanation}</p>
            </div>
          )}
        </div>

        {isAnswered && currentIdx + 1 < quizQs.length && (
          <div className="flex justify-center text-sm text-slate-500">
            <span className="flex items-center gap-1">Next question <ChevronRight className="h-4 w-4 animate-pulse" /></span>
          </div>
        )}
      </div>
    );
  }

  // ── Module selection ──
  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Brain className="h-6 w-6 text-amber-400" />
          EASA Part-66 Quiz Engine
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Select a module to start a practice quiz. Pass mark: 75%.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {easaModules.map(mod => {
            const info = moduleInfo[mod] ?? { count: 0, isPro: false };
            const disabled = info.count === 0;
            const locked = info.isPro && !isPro;
            return (
              <div
                key={mod}
                className={`group relative flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-200 ${
                  disabled
                    ? 'cursor-not-allowed border-slate-800/40 bg-slate-900/20 opacity-40'
                    : locked
                    ? 'border-amber-500/20 bg-slate-900/30'
                    : 'border-slate-800/60 bg-slate-900/40 hover:border-amber-700/60 hover:bg-amber-950/10 hover:shadow-[0_0_30px_-10px] hover:shadow-amber-500/30'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-lg font-bold text-amber-400">{mod}</span>
                  {locked && <Lock className="h-3.5 w-3.5 text-amber-500/50" />}
                  {!locked && info.count > 0 && <Award className="h-4 w-4 text-slate-600 transition group-hover:text-amber-500/60" />}
                </div>
                <span className="mt-1 text-xs text-slate-500">
                  {disabled ? 'No questions yet' : `${info.count} question${info.count !== 1 ? 's' : ''}`}
                </span>

                {locked ? (
                  <button
                    onClick={onUpgradeClick}
                    className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-400 transition hover:text-amber-300"
                  >
                    <Crown className="h-3 w-3" />
                    Upgrade to Pro to Unlock
                  </button>
                ) : !disabled ? (
                  <button
                    onClick={() => startQuiz(mod)}
                    className="mt-2 flex items-center gap-1 text-[11px] font-medium text-amber-400/0 transition group-hover:text-amber-400/80"
                  >
                    Start quiz <ChevronRight className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
