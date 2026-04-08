import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Smile } from 'lucide-react';

const MAX_CHARS = 500;

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setValue(text);
      onTyping();
    }
  };

  return (
    <div className="p-3 border-t border-border/50">
      <div className="glass rounded-2xl flex items-end gap-2 p-2">
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-xl"
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enviar uma mensagem…"
          disabled={disabled}
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
            disabled={!value.trim() || disabled}
            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed glow-primary"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
