import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, Trash2, Loader2, AlertCircle, Crown, Plane } from 'lucide-react';
import { useAiChat, STARTER_PROMPTS } from '@/hooks/useAiChat';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface AiTutorPageProps {
  isPro: boolean;
  onUpgradeClick: () => void;
  onSignInRequired: () => void;
  onBackToApp: () => void;
}

export default function AiTutorPage({ isPro, onUpgradeClick, onSignInRequired, onBackToApp }: AiTutorPageProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, error, remaining, limitReached, sendMessage, clearChat } = useAiChat({
    isPro,
    onUpgradeClick,
    onSignInRequired,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />
        <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col">
        {/* Header bar */}
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 shadow-lg shadow-sky-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">AeroNotes AI Tutor</h1>
                <p className="text-[11px] font-medium text-slate-400">
                  EASA Part-66 & UniKL MIAT Aviation Engineering Expert
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              <button
                onClick={onBackToApp}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                <Plane className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to AeroNotes</span>
              </button>
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div ref={scrollRef} className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-amber-500/20">
                <Sparkles className="h-8 w-8 text-sky-400" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-white">Ask me anything about aviation engineering</h2>
              <p className="mt-2 max-w-md text-center text-sm text-slate-400">
                I specialize in EASA Part-66 modules and UniKL MIAT subjects — from aerodynamics to gas turbine engines.
              </p>

              {/* Usage indicator */}
              {!isPro && remaining !== null && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">{remaining}</span>
                  / 5 free queries remaining today
                  {remaining === 0 && (
                    <button
                      onClick={onUpgradeClick}
                      className="ml-2 flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-300 transition hover:bg-amber-500/25"
                    >
                      <Crown className="h-3 w-3" /> Upgrade
                    </button>
                  )}
                </div>
              )}
              {isPro && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
                  <Crown className="h-3.5 w-3.5" />
                  Pro: Unlimited AI queries
                </div>
              )}

              {/* Starter prompts */}
              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    disabled={loading || limitReached}
                    className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-left text-sm text-slate-300 transition hover:border-sky-500/40 hover:bg-slate-800/40 disabled:opacity-50"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-400/60 transition group-hover:text-sky-400" />
                      <span>{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-amber-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-sky-500/20 to-sky-500/10 border border-sky-500/20'
                    : 'border border-slate-800/60 bg-slate-900/60'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700">
                  <span className="text-xs font-bold text-slate-200">You</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-amber-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                <span className="text-sm text-slate-400">Thinking…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="sticky bottom-0 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
            {!isPro && remaining !== null && remaining > 0 && (
              <div className="mb-2 flex items-center justify-end text-[11px] text-slate-500">
                {remaining} / 5 free queries left today
              </div>
            )}
            {limitReached && !isPro && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
                <span className="text-xs font-medium text-amber-300">
                  You've used all 5 free queries for today. Upgrade to Pro for unlimited access.
                </span>
                <button
                  onClick={onUpgradeClick}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/30"
                >
                  <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  rows={1}
                  placeholder="Ask about aerodynamics, engines, structures, legislation…"
                  disabled={loading || (limitReached && !isPro)}
                  className="w-full resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 py-3 pl-4 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50"
                  style={{ minHeight: '48px', maxHeight: '160px' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim() || (limitReached && !isPro)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-amber-500 text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40 disabled:opacity-30 disabled:shadow-none"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
