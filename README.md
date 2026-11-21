# Private Chat

Etapa 1: estrutura visual, login, registo por convite e painel de administração.

## Correr no computador

1. Instala o Node.js (versão 18 ou superior): https://nodejs.org
2. Nesta pasta, corre `npm install`
3. Copia `.env.example` para `.env` e preenche:
   - `VITE_SUPABASE_URL` (Project URL)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (Publishable key)
4. `npm run dev` e abre o endereço que aparecer (normalmente http://localhost:5173)

## Testar

- Entra com a conta de administrador (separador **Entrar**).
- No separador **Admin**, toca em **Criar convite**.
- Termina sessão, abre o separador **Criar conta** e usa o código para registar uma conta de teste.

## Publicar (Vercel, grátis)

1. Põe esta pasta num repositório do GitHub (o `.env` não vai: está no `.gitignore`).
2. Em vercel.com: **Add New → Project**, escolhe o repositório.
3. Em **Environment Variables**, adiciona as duas variáveis do `.env`.
4. **Deploy**. No iPhone: abre o endereço no Safari → Partilhar → **Adicionar ao ecrã principal**.

## Segurança

- Só a chave **publicável** está no frontend. Nunca uses a secret key nem a connection string aqui.
- Os dados estão protegidos pelo RLS no Supabase.
