import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2, AlertCircle, Crown, MessageSquare } from 'lucide-react';
import { useAiChat, STARTER_PROMPTS } from '@/hooks/useAiChat';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface AiChatWidgetProps {
  isPro: boolean;
  onUpgradeClick: () => void;
  onSignInRequired: () => void;
}

export default function AiChatWidget({ isPro, onUpgradeClick, onSignInRequired }: AiChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, error, remaining, limitReached, sendMessage } = useAiChat({
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-amber-500 text-white shadow-xl shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-500/50"
        aria-label="Open AI Tutor"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-400 to-amber-400 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-40" />
        <Sparkles className="relative h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-sky-400 ring-2 ring-sky-500/30">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-amber-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Tutor</h3>
            <p className="text-[10px] text-slate-400">
              {isPro ? 'Unlimited' : remaining !== null ? `${remaining}/5 left today` : 'Aviation Expert'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center py-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-amber-500/20">
              <MessageSquare className="h-6 w-6 text-sky-400" />
            </div>
            <p className="mt-4 text-center text-sm font-medium text-slate-200">Aviation AI Tutor</p>
            <p className="mt-1 text-center text-xs text-slate-400">
              Ask about EASA modules, aerodynamics, engines & more.
            </p>
            <div className="mt-4 w-full space-y-2">
              {STARTER_PROMPTS.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading || (limitReached && !isPro)}
                  className="w-full rounded-lg border border-slate-800/60 bg-slate-800/30 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-sky-500/40 hover:bg-slate-800/50 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-amber-500">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-sky-500/15 border border-sky-500/20'
                  : 'border border-slate-800/60 bg-slate-800/40'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <p className="text-xs leading-relaxed text-slate-100 whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-amber-500">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-800/40 px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
              <span className="text-xs text-slate-400">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Limit banner */}
      {limitReached && !isPro && (
        <div className="flex items-center justify-between border-t border-slate-800/60 bg-amber-500/10 px-4 py-2">
          <span className="text-[11px] text-amber-300">Daily limit reached</span>
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-500/30"
          >
            <Crown className="h-3 w-3" /> Upgrade
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800/60 bg-slate-900/80 px-3 py-3 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
            placeholder="Ask a question…"
            disabled={loading || (limitReached && !isPro)}
            className="flex-1 resize-none rounded-lg border border-slate-700/60 bg-slate-950/60 py-2.5 pl-3 pr-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-500/40 disabled:opacity-50"
            style={{ minHeight: '40px', maxHeight: '100px' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || (limitReached && !isPro)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-amber-500 text-white transition hover:opacity-90 disabled:opacity-30"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
