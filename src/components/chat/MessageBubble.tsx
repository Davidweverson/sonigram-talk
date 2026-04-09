import { useMemo, useState, useEffect, useRef } from 'react';
import type { Message as MessageType, User } from '@/lib/types';
import { UserAvatar } from './UserAvatar';
import { smartTimestamp } from '@/lib/timestamps';
import { linkifyContent } from '@/lib/linkify';
import { Copy, Edit2, Trash2, Reply, Flag, MoreHorizontal } from 'lucide-react';

function highlightMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-primary font-semibold">{part}</span>
    ) : (
      <span key={i}>{linkifyContent(part)}</span>
    )
  );
}

interface MessageBubbleProps {
  message: MessageType;
  isGrouped: boolean;
  isOwn: boolean;
  isAdmin?: boolean;
  onReply?: (message: MessageType) => void;
  onEdit?: (message: MessageType) => void;
  onDelete?: (messageId: string) => void;
  onReport?: (message: MessageType) => void;
}

export function MessageBubble({ message, isGrouped, isOwn, isAdmin, onReply, onEdit, onDelete, onReport }: MessageBubbleProps) {
  const content = useMemo(() => highlightMentions(message.content), [message.content]);
  const [showMenu, setShowMenu] = useState(false);
  const [timestamp, setTimestamp] = useState(smartTimestamp(message.created_at));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTimestamp(smartTimestamp(message.created_at)), 30000);
    return () => clearInterval(interval);
  }, [message.created_at]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const canDelete = isOwn || isAdmin;
  const canEdit = isOwn;

  return (
    <div
      className={`flex gap-3 px-4 ${isGrouped ? 'mt-0.5' : 'mt-3'} animate-fade-in group relative`}
      onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
    >
      <div className="w-8 flex-shrink-0">
        {!isGrouped && message.user && (
          <UserAvatar username={message.user.username} avatarUrl={message.user.avatar_url} size="sm" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`font-semibold text-sm ${isOwn ? 'text-primary' : 'text-foreground'}`}>
              {message.user?.username || 'Desconhecido'}
            </span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {message.edited_at && <span className="text-xs text-muted-foreground italic">(editado)</span>}
          </div>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div className="mb-1 pl-3 border-l-2 border-primary/30 rounded-r-lg bg-muted/30 px-2 py-1 text-xs max-w-[80%]">
            <span className="font-semibold text-primary">{message.reply_to.user?.username || '?'}</span>
            <p className="text-muted-foreground truncate">{message.reply_to.content}</p>
          </div>
        )}

        {/* Media */}
        {message.media_url && (
          <div className="mb-1 max-w-[300px]">
            {message.media_type?.startsWith('image') || message.media_type === 'gif' ? (
              <img src={message.media_url} alt="Mídia" className="rounded-xl max-h-64 object-cover cursor-pointer" loading="lazy" />
            ) : message.media_type?.startsWith('video') ? (
              <video src={message.media_url} controls className="rounded-xl max-h-64" />
            ) : null}
          </div>
        )}

        <div className={`inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed max-w-[85%] ${
          isOwn ? 'glass bg-primary/10 border-primary/20' : 'glass'
        }`}>
          {content}
        </div>

        {/* Action button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all inline-flex align-middle"
          aria-label="Ações da mensagem"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Context menu */}
      {showMenu && (
        <div ref={menuRef} className="absolute right-4 top-0 z-50 glass-strong rounded-xl shadow-lg py-1 min-w-[180px] animate-fade-in">
          <button onClick={() => { onReply?.(message); setShowMenu(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors">
            <Reply className="h-4 w-4" /> Responder
          </button>
          <button onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors">
            <Copy className="h-4 w-4" /> Copiar mensagem
          </button>
          {canEdit && (
            <button onClick={() => { onEdit?.(message); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors">
              <Edit2 className="h-4 w-4" /> Editar
            </button>
          )}
          {canDelete && (
            <button onClick={() => { if (confirm('Tem certeza que deseja excluir esta mensagem?')) { onDelete?.(message.id); } setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted/50 transition-colors">
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          )}
          {!isOwn && (
            <button onClick={() => { onReport?.(message); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
              <Flag className="h-4 w-4" /> Reportar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
