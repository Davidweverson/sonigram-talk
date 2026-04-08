-- Sonigram Database Setup
-- Execute este SQL no Supabase SQL Editor

-- Tabela de usuários
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de salas
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de mensagens
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indicadores de digitação
CREATE TABLE public.typing_indicators (
  room_id UUID REFERENCES public.rooms(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Qualquer um pode ver usuários" ON public.users FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar seu perfil" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Qualquer um pode ver salas" ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Qualquer um pode ver mensagens" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Usuários podem enviar mensagens" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Qualquer um pode ver digitação" ON public.typing_indicators FOR SELECT USING (true);
CREATE POLICY "Usuários podem indicar digitação" ON public.typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar digitação" ON public.typing_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem remover digitação" ON public.typing_indicators FOR DELETE USING (auth.uid() = user_id);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Salas pré-definidas
INSERT INTO public.rooms (name, description, icon) VALUES
  ('Global', 'Converse com todos', '🌍'),
  ('Música', 'Para os amantes de música', '🎵'),
  ('Games', 'Jogos e diversão', '🎮'),
  ('Tech', 'Tecnologia e inovação', '💻'),
  ('Arte', 'Criatividade sem limites', '🎨'),
  ('Comida', 'Receitas e gastronomia', '🍕'),
  ('Livros', 'Leituras e recomendações', '📚'),
  ('Filmes', 'Cinema e séries', '🎬'),
  ('Pets', 'Nossos amigos peludos', '🐾'),
  ('Esportes', 'Esporte e competição', '🏀'),
  ('Espaço', 'Universo e astronomia', '🚀'),
  ('Natureza', 'Meio ambiente e vida', '🌿'),
  ('Ideias', 'Inovação e criatividade', '💡'),
  ('Memes', 'Humor e risadas', '😂'),
  ('Drama', 'Histórias e narrativas', '🎭'),
  ('Lofi', 'Relax e boas vibes', '🎧'),
  ('Ciência', 'Descobertas e pesquisa', '🔬'),
  ('Coruja', 'Para os notívagos', '🌙'),
  ('Chill', 'Conversas leves', '☕'),
  ('Em Alta', 'Tendências do momento', '🔥');
