# HEB · Planner

Planner digital pessoal da Thallyta — dashboard, tarefas (lista + kanban),
projetos coloridos e calendário (semana/mês). App standalone com banco próprio,
pronto pra publicar na web.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite
(local) / Turso libSQL (produção).

## Rodar localmente

```bash
cd planner
npm install
cp .env.example .env        # já vem apontando para o SQLite local
npm run db:push             # cria as tabelas no banco local (prisma/dev.db)
npm run db:seed             # opcional: popula com dados de exemplo
npm run dev                 # http://localhost:3000
```

## Telas

- **Dashboard** — saudação por horário, resumo da semana (gerado dos dados),
  prioridades de hoje, gráfico de prazos da semana e mini-calendário.
- **Minhas tarefas** — alternância Lista ↔ Quadro (kanban). Na lista, seções
  automáticas: Atrasadas · A fazer hoje · Próximos 3 dias · Esta semana · etc.
  Check para concluir; clique no título para editar (projeto, prioridade, prazo).
- **Projetos** — crie quantos quiser, classifique por cor, abra cada um e veja
  só as tarefas dele.
- **Calendário** — visão semanal e mensal; tarefas coloridas pela cor do projeto.

## Publicar na web (Vercel + Turso)

1. **Criar o banco Turso** (grátis):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   turso db create heb-planner
   turso db show heb-planner --url           # copie o libsql://...
   turso db tokens create heb-planner        # copie o token
   ```
2. **Aplicar o schema** no Turso (uma vez):
   ```bash
   turso db shell heb-planner < prisma/schema.sql
   ```
3. **Deploy na Vercel**: importe o repositório, defina o **Root Directory** como
   `planner` e configure as variáveis de ambiente:
   - `TURSO_DATABASE_URL` = `libsql://...`
   - `TURSO_AUTH_TOKEN` = token gerado acima

   O build (`prisma generate && next build`) e o runtime já leem essas variáveis.

## Roadmap (próximos passos sugeridos)

- Sincronizar com o Notion (espelhar tarefas/projetos).
- Arrastar para reordenar dentro das colunas do kanban.
- Notificações/lembretes de prazos.
