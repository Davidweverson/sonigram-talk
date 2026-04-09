import { useState, FormEvent } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const { updatePassword } = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    setError('');
    const result = await updatePassword(password);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/chat'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Nova senha</h1>
          <p className="text-muted-foreground text-sm mt-2">Defina sua nova senha abaixo.</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-primary text-sm">Senha atualizada com sucesso! Redirecionando…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Nova senha"
                className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm border border-border/50"
                autoComplete="new-password"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                placeholder="Confirmar senha"
                className="w-full bg-muted/50 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm border border-border/50"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 glow-primary flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Atualizando…</> : 'Atualizar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
