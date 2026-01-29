# Deploying LiveSchoolPortal to Render (step-by-step)

This guide walks you through provisioning services on Render, configuring environment variables / GitHub secrets, running migrations and seeds, and pointing a custom domain.

Overview
- Host: Render (recommended) — supports Docker, managed Postgres and Redis, automatic TLS and websockets.
- What you'll create on Render: a Web Service (Docker) plus optional managed Postgres and Redis (if you don't use Neon/other provider).

Prerequisites
- GitHub repo with this project pushed (branch `main` or `master`).
- Render account: https://render.com
- (Optional) Domain and DNS access if you want a custom domain.

Required environment variables (Render service -> Environment)
- `DATABASE_URL` — Your Postgres database connection string (e.g. Neon or Render Postgres)
- `SESSION_SECRET` — Strong random secret (required in production)
- `NODE_ENV` — `production`
- `REDIS_URL` — Redis connection string (optional; if not set, MemoryStore used)
- `VITE_API_URL` — Public URL of your app (e.g. https://app.example.com)

GitHub secrets (Repository Settings -> Secrets)
- `RENDER_API_KEY` — Your Render API key (used by the deploy workflow)
- `RENDER_SERVICE_ID` — The service id of the Web Service (set after you create the service)

Step 1 — Create a Render Web Service
1. Log in to Render and click "New" → "Web Service".
2. Connect your GitHub repo and select the repo/branch.
3. For **Environment**, choose `Docker` (we included a `Dockerfile`).
4. Build Command: `npm ci && npm run build`
5. Start Command: `node dist/index.js`
6. Instance: choose the free / starter plan for testing, or a $7+/month plan for production.
7. Create the service.

Step 2 — Add environment variables on Render
1. Open your service → Environment.
2. Add the variables listed above (`DATABASE_URL`, `SESSION_SECRET`, etc.).
3. If you use Neon for Postgres, paste the Neon `DATABASE_URL` here.
4. If you plan to use Redis (recommended), provision Render Redis or Upstash and add `REDIS_URL`.

Step 3 — (Optional) Provision managed Postgres and Redis on Render
- Render offers managed Postgres and Redis in the dashboard. Provision them and copy the connection strings into `DATABASE_URL` and `REDIS_URL`.

Step 4 — Configure GitHub secrets for automated deploys
1. In your GitHub repo, go to Settings → Secrets → Actions.
2. Add `RENDER_API_KEY` (get from Render Account → API Keys).
3. Add `RENDER_SERVICE_ID` — the service id for the Web Service you created (in service URL or API).

Step 5 — Run migrations and create admin user
You can run migrations/seeds in a post-deploy hook or manually once environment variables are set.

Manual commands (run locally or from Render shell):
```
# Run migrations (drizzle)
npm run db:push

# Create admin account (requires env vars available)
node --require dotenv/config scripts/create_admin.js
```

If you want this to run automatically after each successful deploy, add a **Post Deploy Command** in Render service settings:
```
npm run db:push
node --require dotenv/config scripts/create_admin.js
```

Step 6 — Add a custom domain (optional)
1. In your Render service dashboard, go to "Settings" → "Custom Domains" → Add Domain.
2. Render will show a DNS record (CNAME or A) to add to your domain provider.
3. Wait for DNS propagation; Render will automatically provision TLS.

Step 7 — Verify and monitor
- Use the Render Dashboard Logs to inspect server logs.
- Ensure `/api/user` returns 401 for anonymous, and login works for `newadmin` (or other user you created).
- Add health checks and automatic restarts in Render settings.

Troubleshooting
- If the server fails to start complaining about `SESSION_SECRET`, ensure it's defined in Render Environment.
- If sessions don't persist, confirm `REDIS_URL` is set and reachable.
- If database errors occur (relation missing), run `npm run db:push` to apply migrations.

Costs (rough estimate)
- Render web service (small): $7–20/month
- Managed Postgres (small): $7–30/month (or use Neon free tier)
- Managed Redis (small): $7–20/month (or Upstash free tier)
- Domain: ~$10/year

If you want, I can:
- Create a `render.yaml` manifest for infra-as-code on Render.
- Update the GitHub Actions workflow to run `npm run db:push` automatically after build.

Tell me which of those you'd like me to implement next, and if you want I can prepare the exact `RENDER_API_KEY` & `RENDER_SERVICE_ID` secret names and a one-click checklist you can follow.
