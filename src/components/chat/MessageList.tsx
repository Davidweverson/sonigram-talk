import { useRef, useEffect, useState, useCallback } from 'react';
import type { Message as MessageType } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown } from 'lucide-react';

interface MessageListProps {
  messages: MessageType[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId: string;
  isAdmin?: boolean;
  onReply?: (message: MessageType) => void;
  onEdit?: (message: MessageType) => void;
  onDelete?: (messageId: string) => void;
  onReport?: (message: MessageType) => void;
}

function isGrouped(msg: MessageType, prev: MessageType | undefined): boolean {
  if (!prev) return false;
  if (prev.user_id !== msg.user_id) return false;
  const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 2 * 60 * 1000;
}

export function MessageList({
  messages, loading, hasMore, onLoadMore, currentUserId,
  isAdmin, onReply, onEdit, onDelete, onReport
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevLenRef = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
  }, []);

  useEffect(() => {
    const added = messages.length - prevLenRef.current;
    prevLenRef.current = messages.length;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    } else if (added > 0) {
      setNewCount((c) => c + added);
      setShowScrollButton(true);
    }
  }, [messages.length, isNearBottom]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) { setShowScrollButton(false); setNewCount(0); }
    if (el.scrollTop < 50 && hasMore && !loading) onLoadMore();
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-muted" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-muted" />
              <Skeleton className="h-10 w-64 rounded-2xl bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto scrollbar-thin py-4">
        {loading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm">Nenhuma mensagem ainda. Seja o primeiro!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isGrouped={isGrouped(msg, messages[i - 1])}
            isOwn={msg.user_id === currentUserId}
            isAdmin={isAdmin}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReport={onReport}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-sm text-primary flex items-center gap-1.5 hover:bg-muted/50 transition-all animate-fade-in glow-primary"
        >
          <ArrowDown className="h-4 w-4" />
          {newCount > 0 ? `Novas mensagens (${newCount})` : 'Novas mensagens'}
        </button>
      )}
    </div>
  );
}
