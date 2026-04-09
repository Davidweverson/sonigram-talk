import { useState, FormEvent } from 'react';
import { Loader2, Mail, Lock, User, ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';

interface AuthScreenProps {
  onAuth: {
    login: (email: string, password: string) => Promise<{ error?: string }>;
    signup: (email: string, password: string, username: string) => Promise<{ error?: string }>;
    resetPassword: (email: string) => Promise<{ error?: string }>;
  };
}

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'reset') {
        if (!email.trim()) { setError('Informe seu email.'); setLoading(false); return; }
        const result = await onAuth.resetPassword(email.trim());
        if (result.error) setError(result.error);
        else setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
      } else if (mode === 'signup') {
        const trimmedUser = username.trim();
        if (trimmedUser.length < 3) { setError('Nome de usuário deve ter pelo menos 3 caracteres.'); setLoading(false); return; }
        if (trimmedUser.length > 20) { setError('Nome de usuário deve ter no máximo 20 caracteres.'); setLoading(false); return; }
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) { setError('Use apenas letras, números e underscore.'); setLoading(false); return; }
        if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); setLoading(false); return; }
        const result = await onAuth.signup(email.trim(), password, trimmedUser);
        if (result.error) setError(result.error);
      } else {
        const result = await onAuth.login(email.trim(), password);
        if (result.error) setError(result.error);
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 glow-primary">
            <span className="text-3xl">🔊</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            <span className="text-primary">Soni</span>gram
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === 'login' ? 'Entrar na sua conta' : mode === 'signup' ? 'Criar uma nova conta' : 'Recuperar sua senha'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1.5">
                Nome de usuário
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="ex: sonic_wave"
                  maxLength={20}
                  className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm border border-border/50"
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="seu@email.com"
                className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm border border-border/50"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm border border-border/50"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-xs">{error}</p>}
          {success && <p className="text-primary text-xs">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde…</>
            ) : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar email'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }} className="text-xs text-primary hover:underline block mx-auto">
                Esqueci minha senha
              </button>
              <p className="text-xs text-muted-foreground">
                Não tem conta?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }} className="text-primary hover:underline">
                  Criar conta
                </button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground">
              Já tem conta?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-primary hover:underline">
                Entrar
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Herdeiro espiritual do FlashChat ⚡
        </p>
      </div>
    </div>
  );
}
