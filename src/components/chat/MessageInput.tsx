import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Send, Smile, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import type { Message } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { GifPicker } from './GifPicker';

const MAX_CHARS = 500;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];

interface MessageInputProps {
  onSend: (content: string, replyToId?: string, mediaUrl?: string, mediaType?: string) => void;
  onTyping: () => void;
  disabled?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, newContent: string) => void;
  readOnly?: boolean;
  isMuted?: boolean;
  userId?: string;
}

export function MessageInput({
  onSend, onTyping, disabled, replyTo, onCancelReply,
  editingMessage, onCancelEdit, onSaveEdit, readOnly, isMuted, userId
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [showGif, setShowGif] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  if (readOnly) {
    return (
      <div className="p-3 border-t border-border/50">
        <div className="glass rounded-2xl p-4 text-center text-sm text-muted-foreground">
          📢 Este canal é apenas para anúncios.
        </div>
      </div>
    );
  }

  if (isMuted) {
    return (
      <div className="p-3 border-t border-border/50">
        <div className="glass rounded-2xl p-4 text-center text-sm text-destructive">
          🔇 Você está silenciado.
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    if (editingMessage) {
      onSaveEdit?.(editingMessage.id, trimmed);
      setValue('');
      return;
    }

    onSend(trimmed, replyTo?.id);
    setValue('');
    onCancelReply?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      if (editingMessage) onCancelEdit?.();
      if (replyTo) onCancelReply?.();
    }
  };

  const handleChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setValue(text);
      onTyping();
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) { alert('Arquivo muito grande. Máximo 20MB.'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { alert('Formato não suportado.'); return; }
    if (!userId) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) { alert('Erro ao enviar arquivo.'); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
    const mediaType = file.type.startsWith('video') ? 'video' : 'image';
    onSend('', replyTo?.id, publicUrl, mediaType);
    onCancelReply?.();
    setUploading(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    onSend('', replyTo?.id, gifUrl, 'gif');
    onCancelReply?.();
    setShowGif(false);
  };

  return (
    <div className="border-t border-border/50 relative">
      {/* Reply/Edit bar */}
      {(replyTo || editingMessage) && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <div className="flex-1 text-xs bg-muted/30 rounded-lg px-3 py-1.5 border-l-2 border-primary truncate">
            {editingMessage ? (
              <span><span className="text-primary font-semibold">Editando:</span> {editingMessage.content}</span>
            ) : (
              <span><span className="text-primary font-semibold">Respondendo a {replyTo?.user?.username}:</span> {replyTo?.content}</span>
            )}
          </div>
          <button onClick={editingMessage ? onCancelEdit : onCancelReply} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="p-3">
        <div className="glass rounded-2xl flex items-end gap-2 p-2">
          <label className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl cursor-pointer">
            {uploading ? (
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
            <input type="file" accept={ALLOWED_TYPES.join(',')} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
          </label>
          <button type="button" onClick={() => setShowGif(!showGif)}
            className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl" aria-label="GIF">
            <ImageIcon className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enviar uma mensagem…"
            disabled={disabled || uploading}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground py-2 max-h-32 scrollbar-thin"
            aria-label="Campo de mensagem"
            style={{ minHeight: '36px' }}
          />
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <span className={`text-xs ${value.length > MAX_CHARS * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {value.length}/{MAX_CHARS}
              </span>
            )}
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled || uploading}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed glow-primary"
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* GIF Picker */}
      {showGif && (
        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGif(false)} />
      )}
    </div>
  );
}
