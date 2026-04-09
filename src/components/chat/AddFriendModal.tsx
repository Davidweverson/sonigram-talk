import { useState } from 'react';
import { X, Loader2, UserPlus, Check, XCircle } from 'lucide-react';
import type { Friendship } from '@/lib/types';

interface AddFriendModalProps {
  onClose: () => void;
  onAddFriend: (code: string) => Promise<{ error?: string }>;
  pendingRequests: Friendship[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function AddFriendModal({ onClose, onAddFriend, pendingRequests, onAccept, onReject }: AddFriendModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const result = await onAddFriend(code.trim());
    if (result.error) setError(result.error);
    else { setSuccess('Pedido de amizade enviado!'); setCode(''); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Amigos</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Adicionar por código</label>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); setSuccess(''); }}
              placeholder="SONI-XXXX" maxLength={9}
              className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-sm font-mono text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 uppercase" />
            <button onClick={handleSubmit} disabled={loading || !code.trim()}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-destructive text-xs mt-1">{error}</p>}
          {success && <p className="text-primary text-xs mt-1">{success}</p>}
        </div>

        {pendingRequests.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Pedidos pendentes ({pendingRequests.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                  <span className="text-sm text-foreground">{req.requester?.username || '?'}</span>
                  <div className="flex gap-1">
                    <button onClick={() => onAccept(req.id)} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onReject(req.id)} className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
