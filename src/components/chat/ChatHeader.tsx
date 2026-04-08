import type { Room } from '@/lib/types';
import { Users } from 'lucide-react';

interface ChatHeaderProps {
  room: Room | null;
  onlineCount?: number;
}

export function ChatHeader({ room, onlineCount = 0 }: ChatHeaderProps) {
  if (!room) return null;

  return (
    <div className="h-16 flex items-center gap-3 px-4 border-b border-border/50 glass-strong">
      <span className="text-2xl">{room.icon}</span>
      <div className="flex-1 min-w-0">
        <h2 className="font-heading font-bold text-foreground truncate">{room.name}</h2>
        {room.description && (
          <p className="text-xs text-muted-foreground truncate">{room.description}</p>
        )}
      </div>
      {onlineCount > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <Users className="h-3.5 w-3.5" />
          <span>{onlineCount}</span>
        </div>
      )}
    </div>
  );
}
