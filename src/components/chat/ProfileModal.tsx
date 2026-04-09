import { useState } from 'react';
import { X, Camera, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';
import { UserAvatar } from './UserAvatar';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updates: Partial<Pick<User, 'username' | 'avatar_url' | 'bio'>>) => Promise<{ error?: string }>;
}

export function ProfileModal({ user, onClose, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError('Imagem muito grande. Máximo 5MB.'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(path, file, { upsert: true });
    if (uploadError) { setError('Erro ao enviar imagem.'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) { setError('Nome de usuário deve ter pelo menos 3 caracteres.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setError('Use apenas letras, números e underscore.'); return; }
    setLoading(true);
    setError('');
    const result = await onUpdate({ username: trimmed, bio: bio.trim() || null, avatar_url: avatarUrl });
    if (result.error) setError(result.error);
    else onClose();
    setLoading(false);
  };

  const copyCode = () => {
    if (user.friend_code) {
      navigator.clipboard.writeText(user.friend_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-lg font-bold text-foreground">Editar perfil</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <UserAvatar username={user.username} avatarUrl={avatarUrl} size="lg" />
            <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
            </label>
          </div>
        </div>

        {user.friend_code && (
          <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Código de amigo</p>
              <p className="text-sm font-mono font-bold text-primary">{user.friend_code}</p>
            </div>
            <button onClick={copyCode} className="p-2 text-muted-foreground hover:text-primary">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome de usuário</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20}
              className="w-full bg-muted/50 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} rows={3}
              className="w-full bg-muted/50 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 mt-1 resize-none" />
          </div>
        </div>

        {error && <p className="text-destructive text-xs mt-2">{error}</p>}

        <button onClick={handleSave} disabled={loading}
          className="w-full mt-4 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
