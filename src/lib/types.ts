export interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface TypingIndicator {
  room_id: string;
  user_id: string;
  updated_at: string;
  user?: User;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      typing_indicators: {
        Row: {
          room_id: string;
          user_id: string;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          updated_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

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
