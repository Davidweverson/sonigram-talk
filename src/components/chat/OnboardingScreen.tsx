import { useState, FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

interface OnboardingScreenProps {
  onLogin: (username: string) => Promise<{ error?: string }>;
}

export function OnboardingScreen({ onLogin }: OnboardingScreenProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    if (trimmed.length < 3) {
      setError('Nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Nome de usuário deve ter no máximo 20 caracteres.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Use apenas letras, números e underscore.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await onLogin(trimmed);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError('Não foi possível entrar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4 glow-primary">
            <span className="text-3xl">🔊</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            <span className="text-primary">Soni</span>gram
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Onde conversas ganham vida.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Escolha seu nome de usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="ex: sonic_wave"
              maxLength={20}
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm border border-border/50"
              aria-label="Nome de usuário"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-xs mt-1.5">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando…
              </>
            ) : (
              'Entrar no Sonigram'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Herdeiro espiritual do FlashChat ⚡
        </p>
      </div>
    </div>
  );
}
