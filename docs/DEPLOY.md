# Launchly Production Deploy Guide (Free Tier Friendly)

This guide targets a **single VM** deployment (Oracle Cloud Always Free recommended) with managed PostgreSQL and Redis.

## Architecture on one VM

```text
Internet
   |
Caddy (HTTPS, wildcard subdomain)
   |
Next.js web app (:3000)
   |
   +--> PostgreSQL (Neon free tier)
   +--> Redis (Upstash free tier)
   |
Deploy worker (same VM, shared disk)
   |
backend/deployments/  (cloned repos + runtime artifacts)
```

Both **web app** and **deploy worker** must run on the same machine with access to the same `backend/deployments/` directory.

## 1. Free services to create

| Service | Free option | What to copy |
|---------|-------------|--------------|
| VM | Oracle Cloud Always Free ARM | public IP |
| PostgreSQL | [Neon](https://neon.tech) | `DATABASE_URL` |
| Redis | [Upstash](https://upstash.com) | `REDIS_URL` |
| Auth | [Stack Auth](https://stack-auth.com) | 3 Stack keys |
| GitHub OAuth | GitHub Developer Settings | client id/secret |
| Domain | cheap domain or DuckDNS | base domain |

## 2. DNS setup

For apex + wildcard subdomains:

```text
A     launchly.example.com      -> YOUR_VM_IP
A     *.launchly.example.com    -> YOUR_VM_IP
```

If you skip wildcard DNS, deployed projects still work via path URLs:

```text
https://launchly.example.com/project/my-project/
```

## 3. GitHub OAuth App

Authorization callback URL:

```text
https://launchly.example.com/api/github/callback
```

## 4. Stack Auth

Add your production domain in the Stack Auth dashboard so sign-in works on the live URL.

## 5. Environment file

On the server:

```bash
cp .env.example .env.local
nano .env.local
```

Production example:

```env
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...

NEXT_PUBLIC_STACK_PROJECT_ID=...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=...
STACK_SECRET_SERVER_KEY=...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

DEPLOY_ENCRYPTION_KEY=<openssl rand -base64 32>

DEPLOYMENT_BASE_DOMAIN=launchly.example.com
DEPLOYMENT_URL_SCHEME=https
APP_URL_PORT=443

NODE_ENV=production
```

Validate:

```bash
npm run check:env
```

## 6. Deploy on VM (recommended)

```bash
git clone <your-repo> ~/launchly
cd ~/launchly
chmod +x scripts/setup-vm.sh
./scripts/setup-vm.sh
```

Or manually:

```bash
npm ci
npm run check:env
npm run db:migrate
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

## 7. HTTPS with Caddy

```bash
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
# edit domain names inside the file
sudo systemctl reload caddy
```

Open firewall ports **80** and **443** on your cloud provider.

## 8. Docker alternative

Use external Neon + Upstash in `.env.local`, then:

```bash
docker compose up -d --build
```

## 9. Health check

```bash
curl https://launchly.example.com/api/health
```

Expected:

```json
{
  "status": "ok",
  "service": "launchly",
  "checks": { "database": true, "redis": true }
}
```

## 10. Resume demo checklist

1. Landing page loads over HTTPS
2. Sign in works (Stack Auth)
3. GitHub connect works
4. Import a **static** repo first (fastest demo)
5. Deploy completes and URL opens
6. `/api/health` returns `ok`

## 11. Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy stuck on queued | Ensure worker is running: `pm2 status` |
| GitHub callback error | OAuth callback URL must match production domain exactly |
| Subdomain not opening | Add wildcard DNS or use `/project/{id}/` URL |
| Health check degraded | Verify `DATABASE_URL` and `REDIS_URL` |
| Worker env missing | Use `.env.local` or set `DEPLOY_ENV_FILE` |

## 12. Security notes

- Never commit `.env.local`
- Rotate secrets if they were ever committed
- Use `DEPLOY_ENCRYPTION_KEY` generated on the server only
