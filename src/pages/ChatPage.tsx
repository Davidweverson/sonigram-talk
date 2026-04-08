import { useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRooms } from '@/hooks/useRooms';
import { useRealtime } from '@/hooks/useRealtime';
import { useTyping } from '@/hooks/useTyping';
import { OnboardingScreen } from '@/components/chat/OnboardingScreen';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Menu, LogOut, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatPage() {
  const { user, loading: sessionLoading, login, logout } = useSession();
  const { rooms, loading: roomsLoading } = useRooms();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const { messages, loading: messagesLoading, hasMore, loadMore, sendMessage } = useRealtime(activeRoomId);
  const { typingUsers, startTyping, stopTyping } = useTyping(activeRoomId, user?.id || null);

  const handleSelectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setSidebarOpen(false);
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!user) return;
      sendMessage(content, user.id);
      stopTyping();
    },
    [user, sendMessage, stopTyping]
  );

  // Loading
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Carregando…</p>
        </div>
      </div>
    );
  }

  // Onboarding
  if (!user) {
    return <OnboardingScreen onLogin={login} />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <ChatSidebar
            rooms={rooms}
            loading={roomsLoading}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
          />
          {/* User footer */}
          <div className="p-3 border-t border-border/50 glass-strong flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground flex-1 truncate">
              {user.username}
            </span>
            <button
              onClick={logout}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden h-12 flex items-center px-3 border-b border-border/50 glass-strong">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Abrir menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-heading font-bold text-sm ml-2">
            <span className="text-primary">Soni</span>gram
          </span>
        </div>

        {activeRoom ? (
          <>
            <ChatHeader room={activeRoom} />
            <MessageList
              messages={messages}
              loading={messagesLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              currentUserId={user.id}
            />
            <TypingIndicator usernames={typingUsers.map((u) => u.username)} />
            <MessageInput
              onSend={handleSendMessage}
              onTyping={startTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
                <span className="text-3xl">🔊</span>
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                Bem-vindo ao Sonigram
              </h2>
              <p className="text-muted-foreground text-sm">
                Selecione uma sala para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
