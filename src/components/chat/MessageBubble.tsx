import { useMemo } from 'react';
import type { Message as MessageType } from '@/lib/types';
import { UserAvatar } from './UserAvatar';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function highlightMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-primary font-semibold">
        {part}
      </span>
    ) : (
      part
    )
  );
}

interface MessageBubbleProps {
  message: MessageType;
  isGrouped: boolean;
  isOwn: boolean;
}

export function MessageBubble({ message, isGrouped, isOwn }: MessageBubbleProps) {
  const content = useMemo(() => highlightMentions(message.content), [message.content]);

  return (
    <div className={`flex gap-3 px-4 ${isGrouped ? 'mt-0.5' : 'mt-3'} animate-fade-in`}>
      <div className="w-8 flex-shrink-0">
        {!isGrouped && message.user && (
          <UserAvatar
            username={message.user.username}
            avatarUrl={message.user.avatar_url}
            size="sm"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`font-semibold text-sm ${isOwn ? 'text-primary' : 'text-foreground'}`}>
              {message.user?.username || 'Desconhecido'}
            </span>
            <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
          </div>
        )}
        <div
          className={`inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed max-w-[85%] ${
            isOwn
              ? 'glass bg-primary/10 border-primary/20'
              : 'glass'
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
