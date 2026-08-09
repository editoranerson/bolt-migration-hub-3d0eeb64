import { useState, useEffect, useRef } from 'react';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigateTo, consumeReturnTo } from '@/lib/router';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/auth';

export function LoginPage() {
  const { toast } = useToast();
  const { user, loading: authLoading, profileLoaded } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const loginSuccess = useRef(false);

  useEffect(() => {
    if (loginSuccess.current && user && !authLoading && profileLoaded) {
      loginSuccess.current = false;
      const returnTo = consumeReturnTo();
      toast('Bem-vindo de volta!', 'success');
      navigateTo(returnTo ?? { name: 'home' });
    }
  }, [user, authLoading, profileLoaded, toast]);

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (!authLoading && user && profileLoaded) {
      navigateTo({ name: 'home' });
    }
  }, [authLoading, user, profileLoaded]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      toast(error.message, 'error');
      return;
    }
    loginSuccess.current = true;
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-grape-500 to-rose-500 shadow-glow">
          <Sparkles size={26} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-grape-50">Entrar</h1>
        <p className="mt-2 text-sm text-grape-200/70">
          Acesse seu álbum de cartas e tarefas.
        </p>
      </div>

      <form onSubmit={submit} className="card w-full space-y-4 bg-ink-800/60 p-6">
        <div>
          <label className="label">E-mail</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="voce@email.com"
            />
          </div>
        </div>
        <div>
          <label className="label">Senha</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Entrando...' : 'Entrar'}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-sm text-grape-200/70">
        Não tem conta?{' '}
        <button
          onClick={() => navigateTo({ name: 'signup' })}
          className="font-semibold text-rose-400 hover:text-rose-300"
        >
          Cadastre-se
        </button>
      </p>
    </div>
  );
}
