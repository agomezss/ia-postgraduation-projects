# Demo: Next.js + Better Auth + GitHub + SQLite

Demo minimo com:

- Next.js App Router + TypeScript
- Better Auth com provider GitHub
- SQLite local com better-sqlite3
- Home mostrando estado de sessao

## 1) Configurar variaveis

Copie o exemplo e preencha os dados do OAuth no GitHub:

```bash
cp .env.example .env.local
```

No app OAuth do GitHub, configure callback URL:

```text
http://localhost:3000/api/auth/callback/github
```

## 2) Instalar dependencias

```bash
npm install
```

## 3) Gerar tabelas no SQLite

```bash
npm run migrate
```

Isso cria/atualiza o arquivo local:

```text
better-auth.sqlite
```

## 4) Rodar o projeto

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Arquivos principais

- `lib/auth.ts`: instancia do Better Auth com SQLite + GitHub provider
- `lib/auth-client.ts`: auth client para sign-in social no browser
- `app/api/auth/[...all]/route.ts`: handler do Better Auth no App Router
- `app/page.tsx`: Home com estado de sessao e botoes Entrar/Sair
