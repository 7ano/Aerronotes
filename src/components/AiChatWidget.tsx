import React, { useState, useEffect } from 'react';
import { Bot, Send, X, Maximize2, Sparkles, User } from 'lucide-react';

interface AiChatWidgetProps {
  isPro?: boolean;
  onUpgradeClick?: () => void;
  onSignInRequired?: () => void;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  isPro = false,
  onUpgradeClick,
  onSignInRequired,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [remainingUsage, setRemainingUsage] = useState<number>(() => {
    const saved = localStorage.getItem('aeronotes_ai_usage');
    return saved !== null ? parseInt(saved, 10) : 5;
  });

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(() => {
    const saved = localStorage.getItem('aeronotes_ai_chats');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('aeronotes_ai_usage', remainingUsage.toString());
  }, [remainingUsage]);

  useEffect(() => {
    localStorage.setItem('aeronotes_ai_chats', JSON.stringify(messages));
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!isPro && remainingUsage <= 0) {
      if (onUpgradeClick) onUpgradeClick();
      return;
    }

    const newMessages = [...messages, { role: 'user' as const, content: messageText }];
    setMessages(newMessages);
    setInput('');

    if (!isPro) {
      setRemainingUsage((prev) => Math.max(0, prev - 1));
    }

    // AI Response Simulation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Here is the explanation for "${messageText}": In aircraft engineering, this concept is governed by basic aerodynamic and thermodynamic conservation principles. Refer to your EASA Part-66 Module summaries on AeroNotes for detailed derivations.`,
        },
      ]);
    }, 1000);
  };

  const handleExpandToFullPage = () => {
    window.location.pathname = '/ai-tutor';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
      >
        <Bot className="w-5 h-5" />
        <span className="text-xs font-extrabold hidden sm:inline">Ask AI Tutor</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Aviation AI Tutor</h4>
            <p className="text-[10px] text-cyan-400 font-medium">
              {isPro ? 'Unlimited Pro Access' : `${remainingUsage}/5 left today`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleExpandToFullPage}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Expand to full page"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-950/50 text-xs">
        {messages.length === 0 ? (
          <div className="text-center py-8 px-4 space-y-3">
            <Sparkles className="w-8 h-8 text-cyan-400/50 mx-auto" />
            <p className="text-slate-300 font-medium">Ask about EASA modules, aerodynamics, or engines.</p>
            <div className="space-y-1.5 pt-2">
              {[
                "Explain Bernoulli's Principle & Lift",
                "Walk through Gas Turbine Brayton Cycle",
                "Solve an Ohm's Law problem",
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-left truncate transition-colors text-[11px]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={remainingUsage <= 0 && !isPro ? 'Upgrade to Pro for more...' : 'Ask a question...'}
          disabled={remainingUsage <= 0 && !isPro}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || (remainingUsage <= 0 && !isPro)}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default AiChatWidget;
