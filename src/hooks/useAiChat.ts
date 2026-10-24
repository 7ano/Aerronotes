import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UseAiChatOptions {
  isPro: boolean;
  onUpgradeClick: () => void;
  onSignInRequired: () => void;
}

export interface AiChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  remaining: number | null;
  limitReached: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

const FREE_DAILY_LIMIT = 5;

const STARTER_PROMPTS = [
  "Explain Bernoulli's Principle and how it relates to lift generation",
  "Walk me through the Gas Turbine Brayton Cycle with equations",
  "Solve an Ohm's Law problem for an aircraft electrical circuit",
  "Explain the four strokes of a piston engine with thermodynamic principles",
];

export function useAiChat({ isPro, onUpgradeClick, onSignInRequired }: UseAiChatOptions): AiChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load remaining count on mount for free users
  useEffect(() => {
    if (isPro) {
      setRemaining(null);
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('ai_queries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo);
      const used = count ?? 0;
      const left = Math.max(0, FREE_DAILY_LIMIT - used);
      setRemaining(left);
      setLimitReached(left === 0);
    })();
  }, [isPro]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      onSignInRequired();
      return;
    }

    if (limitReached && !isPro) {
      onUpgradeClick();
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (response.status === 429 && data.error === 'daily_limit_reached') {
        setLimitReached(true);
        setRemaining(0);
        onUpgradeClick();
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      if (!data.response || typeof data.response !== 'string') {
        throw new Error('Received an invalid response from the AI service.');
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (typeof data.remaining === 'number') {
        setRemaining(data.remaining);
        setLimitReached(data.remaining === 0);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [loading, limitReached, isPro, messages, onUpgradeClick, onSignInRequired]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, remaining, limitReached, sendMessage, clearChat };
}

export { STARTER_PROMPTS, FREE_DAILY_LIMIT };
