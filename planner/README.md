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
cp .env.example .env        # aponta para o SQLite local
npm run db:reset            # cria as tabelas e popula com dados de exemplo
npm run dev                 # http://localhost:3000
```

O `build` já aplica o schema e popula o banco automaticamente (idempotente):
seed só roda se o banco estiver vazio; use `npm run db:reset` para forçar.

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

O banco (tabelas + seed inicial) é montado automaticamente no primeiro build —
não é preciso rodar nada de banco manualmente.

1. Crie o banco no **turso.tech** e gere um token.
2. Na Vercel: **Add New → Project → Import** do repositório do GitHub.
3. **Root Directory** = `planner`.
4. Em **Environment Variables**, adicione:
   - `TURSO_DATABASE_URL` = `libsql://...`
   - `TURSO_AUTH_TOKEN` = token do Turso
   - `DATABASE_URL` = `file:./dev.db` (placeholder; o runtime usa o Turso via adapter)
5. **Deploy**. O build aplica o schema e popula o Turso na primeira vez.

## Roadmap (próximos passos sugeridos)

- Sincronizar com o Notion (espelhar tarefas/projetos).
- Arrastar para reordenar dentro das colunas do kanban.
- Notificações/lembretes de prazos.
