# Sonigram 🔊

> Onde conversas ganham vida.

Sonigram é uma plataforma de chat em tempo real, herdeira espiritual do FlashChat ⚡

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

## Configuração

1. Clone o repositório e instale as dependências: `npm install`
2. Crie um projeto no Supabase e execute o `supabase-setup.sql` no SQL Editor
3. Habilite **Anonymous Sign-Ins** em Authentication → Providers
4. Crie `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
5. Rode: `npm run dev`

## Deploy no Vercel

Conecte o repositório, adicione as env vars, e faça deploy!
