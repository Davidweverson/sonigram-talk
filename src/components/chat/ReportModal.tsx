import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/types';

interface ReportModalProps {
  message: Message;
  reporterId: string;
  onClose: () => void;
}

export function ReportModal({ message, reporterId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Informe o motivo.'); return; }
    setLoading(true);
    const { error: err } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      reported_user_id: message.user_id,
      message_id: message.id,
      reason: reason.trim(),
    });
    if (err) { setError('Erro ao enviar denúncia.'); setLoading(false); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Reportar mensagem</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="bg-muted/30 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{message.user?.username}</p>
          <p className="truncate">{message.content}</p>
        </div>

        <textarea value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }}
          placeholder="Descreva o motivo da denúncia…" rows={3} maxLength={500}
          className="w-full bg-muted/50 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 resize-none" />
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full mt-3 bg-destructive text-destructive-foreground font-semibold py-2.5 rounded-xl hover:bg-destructive/90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar denúncia'}
        </button>
      </div>
    </div>
  );
}
