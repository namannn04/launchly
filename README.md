## Launchly Setup

Launchly is a deployment platform with three runtime pieces:

1. the web app
2. the deploy worker
3. Redis + PostgreSQL as shared infrastructure

### Required environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill these values:

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

### Local run order

1. Start PostgreSQL.
2. Start Redis.
3. Run Prisma migrations if needed.
4. Start the web app with `npm run dev`.
5. Start the worker with `npm run worker:deploy`.

### What to verify first

- Stack Auth sign-in works.
- GitHub connect redirects back correctly.
- `/api/github/status` returns authenticated and connected state.
- A deploy request reaches the queue and the worker starts processing it.

### Notes

- `DEPLOYMENT_BASE_DOMAIN=localhost` is fine for local dev.
- Production subdomain routing needs a real base domain plus wildcard DNS or reverse-proxy support.
- The worker is separate on purpose; if it is not running, deploy jobs will queue but not finish.
