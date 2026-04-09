import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRooms } from '@/hooks/useRooms';
import { useRealtime } from '@/hooks/useRealtime';
import { useTyping } from '@/hooks/useTyping';
import { useFriends } from '@/hooks/useFriends';
import { useDMs } from '@/hooks/useDMs';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ProfileModal } from '@/components/chat/ProfileModal';
import { AddFriendModal } from '@/components/chat/AddFriendModal';
import { ReportModal } from '@/components/chat/ReportModal';
import { Menu, LogOut, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Message, Room } from '@/lib/types';

export default function ChatPage() {
  const { user, logout, updateProfile } = useSession();
  const { rooms, loading: roomsLoading } = useRooms();
  const navigate = useNavigate();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeDMId, setActiveDMId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [reportMessage, setReportMessage] = useState<Message | null>(null);
  const [unreadRooms, setUnreadRooms] = useState<Set<string>>(new Set());

  const effectiveRoomId = activeDMId || activeRoomId;
  const activeRoom: Room | null = activeDMId ? null : rooms.find((r) => r.id === activeRoomId) || null;

  const { messages, loading: messagesLoading, hasMore, loadMore, sendMessage, editMessage, deleteMessage } = useRealtime(effectiveRoomId);
  const { typingUsers, startTyping, stopTyping } = useTyping(effectiveRoomId, user?.id || null);
  const { friends, pendingRequests, addFriend, acceptRequest, rejectRequest } = useFriends(user?.id || null);
  const { getOrCreateDM } = useDMs(user?.id || null);

  // Track unread rooms
  const lastRoomRef = useRef<string | null>(null);
  useEffect(() => {
    if (!effectiveRoomId) return;
    // Subscribe to all room messages for unread tracking
    // When we enter a room, mark it as read
    setUnreadRooms((prev) => {
      const next = new Set(prev);
      next.delete(effectiveRoomId);
      return next;
    });
    lastRoomRef.current = effectiveRoomId;
  }, [effectiveRoomId]);

  const handleSelectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setActiveDMId(null);
    setSidebarOpen(false);
    setReplyTo(null);
    setEditingMessage(null);
  }, []);

  const handleOpenDM = useCallback(async (friendUserId: string) => {
    const dmId = await getOrCreateDM(friendUserId);
    if (dmId) {
      setActiveDMId(dmId);
      setActiveRoomId(null);
      setSidebarOpen(false);
    }
  }, [getOrCreateDM]);

  const handleSendMessage = useCallback(
    (content: string, replyToId?: string, mediaUrl?: string, mediaType?: string) => {
      if (!user) return;
      sendMessage(content, user.id, replyToId, mediaUrl, mediaType);
      stopTyping();
    },
    [user, sendMessage, stopTyping]
  );

  const handleSaveEdit = useCallback(
    (messageId: string, newContent: string) => {
      editMessage(messageId, newContent);
      setEditingMessage(null);
    },
    [editMessage]
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      deleteMessage(messageId);
    },
    [deleteMessage]
  );

  const isAdmin = user?.role === 'admin';
  const isReadOnly = activeRoom?.read_only && !isAdmin;
  const isMuted = user?.is_muted;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Redirecionando…</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-full flex flex-col">
          <ChatSidebar
            rooms={rooms}
            loading={roomsLoading}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
            friends={friends}
            onOpenDM={handleOpenDM}
            onOpenFriends={() => setShowFriends(true)}
            onOpenSettings={() => navigate('/configuracoes')}
            pendingCount={pendingRequests.length}
            unreadRooms={unreadRooms}
            currentUserId={user.id}
          />
          <div className="p-3 border-t border-border/50 glass-strong flex items-center gap-3">
            <button onClick={() => setShowProfile(true)} className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            </button>
            <span className="text-sm font-medium text-foreground flex-1 truncate">{user.username}</span>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg text-xs font-bold" title="Admin">
                👑
              </button>
            )}
            <button onClick={logout} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg" aria-label="Sair" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden h-12 flex items-center px-3 border-b border-border/50 glass-strong">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Abrir menu">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-heading font-bold text-sm ml-2"><span className="text-primary">Soni</span>gram</span>
        </div>

        {effectiveRoomId ? (
          <>
            <ChatHeader room={activeRoom} />
            <MessageList
              messages={messages}
              loading={messagesLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              currentUserId={user.id}
              isAdmin={isAdmin}
              onReply={(msg) => { setReplyTo(msg); setEditingMessage(null); }}
              onEdit={(msg) => { setEditingMessage(msg); setReplyTo(null); }}
              onDelete={handleDeleteMessage}
              onReport={(msg) => setReportMessage(msg)}
            />
            <TypingIndicator usernames={typingUsers.map((u) => u.username)} />
            <MessageInput
              onSend={handleSendMessage}
              onTyping={startTyping}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              editingMessage={editingMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onSaveEdit={handleSaveEdit}
              readOnly={isReadOnly}
              isMuted={isMuted}
              userId={user.id}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
                <span className="text-3xl">🔊</span>
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-1">Bem-vindo ao Sonigram</h2>
              <p className="text-muted-foreground text-sm">Selecione uma sala para começar a conversar</p>
            </div>
          </div>
        )}
      </div>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={updateProfile} />}
      {showFriends && (
        <AddFriendModal
          onClose={() => setShowFriends(false)}
          onAddFriend={addFriend}
          pendingRequests={pendingRequests}
          onAccept={acceptRequest}
          onReject={rejectRequest}
        />
      )}
      {reportMessage && user && (
        <ReportModal message={reportMessage} reporterId={user.id} onClose={() => setReportMessage(null)} />
      )}
    </div>
  );
}
