import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, LogIn, UserPlus, Coins } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { navigateTo } from '@/lib/router';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function DanteChat() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(
        (data as ChatMessage[]).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      );
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      loadHistory();
      if (profile) setCredits(profile.credits ?? 0);
    }
  }, [open, user, profile, loadHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !user) return;

    const userMsg: UIMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast('Sessão expirada. Faça login novamente.', 'error');
        return;
      }

      const now = new Date();
      const fmt = (opts: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat('pt-BR', opts).format(now);

      const messageBody = `[Contexto de Tempo Real: Hoje é ${fmt({ weekday: 'long' })}, ${fmt({ day: '2-digit', month: '2-digit', year: 'numeric' })}, às ${fmt({ hour: '2-digit', minute: '2-digit', hour12: false })}]\n\nMensagem do usuário: ${userMsg.content}`;

      const apiUrl = `${SUPABASE_URL}/functions/v1/chat-dante`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          message: messageBody,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[DanteChat] Edge function error:', res.status, errText);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          { id: `err-${Date.now()}`, role: 'assistant', content: `Erro (${res.status}): Falha na conexão com o Dante.` },
        ]);
        return;
      }

      const data = await res.json();

      if (data.error === 'no_credits') {
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        toast('Você não tem Créditos suficientes. Visite a Loja de Recompensas para comprar mais!', 'error');
        setCredits(0);
        return;
      }

      if (data.error) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          { id: `err-${Date.now()}`, role: 'assistant', content: `Erro: ${data.error}` },
        ]);
        return;
      }

      const aiMsg: UIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (typeof data.credits === 'number') {
        setCredits(data.credits);
        await refreshProfile();
      }
    } catch (error) {
      console.error('[DanteChat] Connection error:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        { id: `err-${Date.now()}`, role: 'assistant', content: `Erro de conexão: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleButtonClick = () => {
    if (user) {
      setOpen(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const creditsLabel = isAdmin ? 'Ilimitado (Admin)' : `${credits} Crédito${credits === 1 ? '' : 's'}`;

  return (
    <>
      {!open && (
        <button
          onClick={handleButtonClick}
          className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="Conversar com o Dante"
        >
          <span className="absolute inset-0 rounded-full p-[3px] dante-border-glow">
            <span className="block h-full w-full rounded-full bg-white" />
          </span>
          <span className="relative z-10 text-2xl font-bold gradient-dante-text">∞</span>
        </button>
      )}

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowLoginPrompt(false)}
          />
          <div className="relative z-10 w-full max-w-sm card bg-ink-800/95 p-6 animate-scale-in text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
            >
              <span className="text-white">∞</span>
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-grape-50">
              Converse com o Dante
            </h3>
            <p className="mb-6 text-sm text-grape-200/70">
              O Dante está esperando para conversar com você! Faça login ou crie uma conta para começar.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigateTo({ name: 'login' });
                }}
                className="btn-primary w-full"
              >
                <LogIn size={18} /> Fazer Login
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigateTo({ name: 'signup' });
                }}
                className="btn-ghost w-full"
              >
                <UserPlus size={18} /> Criar Conta
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-sm text-grape-200/50 hover:text-grape-200"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-6 sm:items-end">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="dante-chat-window relative z-10 flex h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-900/95 shadow-2xl animate-slide-up sm:h-[[...]
            {/* Header */}
            <div className="dante-chat-bar flex items-center justify-between border-b border-white/10 bg-ink-800/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                >
                  ∞
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-grape-50">Chat do Dante</h3>
                  <p className="flex items-center gap-1 text-xs text-grape-200/60">
                    <Coins size={12} className="text-gold-400" />
                    {creditsLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                  >
                    ∞
                  </div>
                  <p className="text-sm text-grape-200/60">
                    Olá! Sou o Dante. Como posso te ajudar hoje?
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                    >
                      ∞
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                        : 'dante-chat-bubble border border-white/10 bg-ink-700/60 text-grape-50'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="dante-loading-avatar flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                    ∞
                  </div>
                  <div className="flex items-center rounded-2xl border border-white/10 bg-ink-700/60 px-4 py-2.5">
                    <span className="text-sm text-grape-200/60">Dante está pensando</span>
                    <span className="ml-1 flex gap-0.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-grape-300 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-grape-300 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-grape-300 [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="dante-chat-bar border-t border-white/10 bg-ink-800/80 p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    const isTouch =
                      typeof window !== 'undefined' &&
                      window.matchMedia('(pointer: coarse)').matches;
                    if (e.key === 'Enter' && !e.shiftKey && !isTouch) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={loading}
                  placeholder="Escreva sua mensagem..."
                  rows={1}
                  className="dante-chat-input flex-1 resize-none rounded-2xl border border-white/10 bg-ink-700/60 px-4 py-2.5 text-sm text-grape-50 placeholder:text-grape-200/40 outline-none transitio[...]"
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                  aria-label="Enviar"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
