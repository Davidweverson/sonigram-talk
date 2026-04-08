import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { Room } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatSidebarProps {
  rooms: Room[];
  loading: boolean;
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export function ChatSidebar({ rooms, loading, activeRoomId, onSelectRoom }: ChatSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [rooms, search]);

  return (
    <div className="h-full flex flex-col glass-strong">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h1 className="font-heading text-xl font-bold text-foreground mb-3">
          <span className="text-primary">Soni</span>gram
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar salas…"
            className="w-full bg-muted/50 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            aria-label="Buscar salas"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-2 w-32 bg-muted" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Nenhuma sala encontrada
          </p>
        ) : (
          filtered.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${
                activeRoomId === room.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted/50 border border-transparent'
              }`}
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${
                  activeRoomId === room.id ? 'bg-primary/20' : 'bg-muted/50'
                } transition-colors`}
              >
                {room.icon || '💬'}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium block truncate ${
                    activeRoomId === room.id ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {room.name}
                </span>
                {room.description && (
                  <span className="text-xs text-muted-foreground truncate block">
                    {room.description}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
