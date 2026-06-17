## Launchly Setup

Launchly is a deployment platform with three runtime pieces:

1. the web app
2. the deploy worker
3. Redis + PostgreSQL as shared infrastructure

### Required environment variables

Copy [`.env.example`](.env.example) to `.env.local` if needed — both files should stay in sync locally with your filled values. **Do not commit env files to git.**

- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `DEPLOY_ENCRYPTION_KEYS` or `DEPLOY_ENCRYPTION_KEY`
- `DEPLOYMENT_BASE_DOMAIN`
- `DEPLOYMENT_URL_SCHEME`
- `APP_URL_PORT`

Validate with:

```bash
npm run check:env
```

### Local run order

1. Start PostgreSQL.
2. Start Redis.
3. Run Prisma migrations if needed: `npm run db:migrate`
4. Start the web app with `npm run dev`.
5. Start the worker with `npm run worker:deploy`.

### What to verify first

- Stack Auth sign-in works.
- GitHub connect redirects back correctly.
- `/api/github/status` returns authenticated and connected state.
- `/api/health` returns `status: ok`.
- A deploy request reaches the queue and the worker starts processing it.

### Production deploy (free VM)

For a full free deployment guide (Oracle Cloud + Neon + Upstash), see [docs/DEPLOY.md](docs/DEPLOY.md).

Quick production commands:

```bash
npm ci
npm run check:env
npm run db:migrate
npm run build
pm2 start deploy/ecosystem.config.cjs
```

Or use Docker:

```bash
docker compose up -d --build
```

### Notes

- `DEPLOYMENT_BASE_DOMAIN=localhost` is fine for local dev.
- Production subdomain routing needs a real base domain plus wildcard DNS or reverse-proxy support.
- The worker is separate on purpose; if it is not running, deploy jobs will queue but not finish.
- Deployed apps support GET/HEAD/POST/PUT/PATCH/DELETE through the runtime proxy.
- Worker reads `.env.local` (or `DEPLOY_ENV_FILE`) automatically in production.
