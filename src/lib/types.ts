export interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  is_muted?: boolean;
  is_banned?: boolean;
  bio?: string | null;
  friend_code?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  read_only?: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  reply_to_id?: string | null;
  edited_at?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  user?: User;
  reply_to?: Message | null;
}

export interface TypingIndicator {
  room_id: string;
  user_id: string;
  updated_at: string;
  user?: User;
}

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester?: User;
  receiver?: User;
}

export interface DirectMessage {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user?: User;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  message_id: string | null;
  reason: string;
  created_at: string;
  reporter?: User;
  reported_user?: User;
  message?: Message;
}

export const DEFAULT_ROOMS: { name: string; description: string; icon: string }[] = [
  { name: 'Global', description: 'Converse com todos', icon: '🌍' },
  { name: 'Música', description: 'Para os amantes de música', icon: '🎵' },
  { name: 'Games', description: 'Jogos e diversão', icon: '🎮' },
  { name: 'Tech', description: 'Tecnologia e inovação', icon: '💻' },
  { name: 'Arte', description: 'Criatividade sem limites', icon: '🎨' },
  { name: 'Comida', description: 'Receitas e gastronomia', icon: '🍕' },
  { name: 'Livros', description: 'Leituras e recomendações', icon: '📚' },
  { name: 'Filmes', description: 'Cinema e séries', icon: '🎬' },
  { name: 'Pets', description: 'Nossos amigos peludos', icon: '🐾' },
  { name: 'Esportes', description: 'Esporte e competição', icon: '🏀' },
  { name: 'Espaço', description: 'Universo e astronomia', icon: '🚀' },
  { name: 'Natureza', description: 'Meio ambiente e vida', icon: '🌿' },
  { name: 'Ideias', description: 'Inovação e criatividade', icon: '💡' },
  { name: 'Memes', description: 'Humor e risadas', icon: '😂' },
  { name: 'Drama', description: 'Histórias e narrativas', icon: '🎭' },
  { name: 'Lofi', description: 'Relax e boas vibes', icon: '🎧' },
  { name: 'Ciência', description: 'Descobertas e pesquisa', icon: '🔬' },
  { name: 'Coruja', description: 'Para os notívagos', icon: '🌙' },
  { name: 'Chill', description: 'Conversas leves', icon: '☕' },
  { name: 'Em Alta', description: 'Tendências do momento', icon: '🔥' },
];
