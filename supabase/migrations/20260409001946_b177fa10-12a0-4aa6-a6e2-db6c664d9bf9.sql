
-- 1. Alter tables FIRST (before functions that reference new columns)

-- Users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_muted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS friend_code text UNIQUE;

-- Messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text;

-- Rooms table
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS read_only boolean NOT NULL DEFAULT false;

-- 2. Generate friend code function
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists_already boolean;
BEGIN
  LOOP
    code := 'SONI-' || upper(substr(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM public.users WHERE friend_code = code) INTO exists_already;
    IF NOT exists_already THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Backfill friend codes
UPDATE public.users SET friend_code = public.generate_friend_code() WHERE friend_code IS NULL;
ALTER TABLE public.users ALTER COLUMN friend_code SET DEFAULT public.generate_friend_code();
ALTER TABLE public.users ALTER COLUMN friend_code SET NOT NULL;

-- 3. Security definer functions (now columns exist)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND is_banned = true)
$$;

CREATE OR REPLACE FUNCTION public.is_user_muted(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = _user_id AND is_muted = true)
$$;

-- 4. RLS policies for users
CREATE POLICY "Usuários podem atualizar seu perfil"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins podem atualizar qualquer usuário"
ON public.users FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 5. RLS policies for messages
CREATE POLICY "Usuários podem editar suas mensagens"
ON public.messages FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas mensagens"
ON public.messages FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem deletar qualquer mensagem"
ON public.messages FOR DELETE
USING (public.is_admin(auth.uid()));

-- 6. Friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas amizades"
ON public.friendships FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Usuários podem enviar pedidos de amizade"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Usuários podem atualizar pedidos recebidos"
ON public.friendships FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Usuários podem deletar suas amizades"
ON public.friendships FOR DELETE
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 7. Direct messages table
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus DMs"
ON public.direct_messages FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Usuários podem criar DMs"
ON public.direct_messages FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 8. Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins podem ver todos os reports"
ON public.reports FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuários podem ver seus próprios reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

-- 9. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

CREATE POLICY "Qualquer um pode ver mídia"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

CREATE POLICY "Usuários autenticados podem enviar mídia"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar sua mídia"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 10. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
