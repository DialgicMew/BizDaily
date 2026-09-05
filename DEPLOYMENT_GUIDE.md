# Deployment Guide — $0/month

This deploys BizDaily on entirely free tiers:

- **Database**: [Neon](https://neon.tech) — free Postgres, doesn't expire
- **Backend (FastAPI)**: [Render](https://render.com) — free web service
- **Frontend (React)**: [Vercel](https://vercel.com) — free static hosting

**Trade-off**: Render's free web services spin down after ~15 minutes of no traffic. The first request after that takes 30-60 seconds to wake up; everything after is normal speed. Fine for a personal or low-traffic deployment — see [Alternatives](#alternatives) below if you need always-on.

## 1. Create the database (Neon)

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string from the dashboard — it looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`. Keep the `?sslmode=require` suffix; the backend connects over TLS via `psycopg2` and Neon requires it.
3. That's it — the backend creates its own tables (`funding`, `company_details`) automatically on first startup.

## 2. Deploy the backend (Render)

This repo includes a [`render.yaml`](render.yaml) blueprint, so Render can configure the service for you:

1. Push this repo to your own GitHub account.
2. In Render, choose **New → Blueprint** and point it at your repo. Render will read `render.yaml` and create a `bizdaily-backend` web service rooted at `/backend`.
3. Under the service's **Environment** tab, set:
   - `OPENAI_API_KEY` — your OpenAI key
   - `DATABASE_URL` — the Neon connection string from step 1
   - `ALLOWED_ORIGINS` — leave a placeholder for now (e.g. `http://localhost:4011`); you'll update it after the frontend is deployed
4. Deploy. Once live, your backend URL will be something like `https://bizdaily-backend.onrender.com`. Confirm it's healthy: `curl https://bizdaily-backend.onrender.com/health`.

No blueprint? You can create the web service manually instead: **Root Directory** `backend`, **Build Command** `pip install -r requirements.txt`, **Start Command** `uvicorn main:app --host 0.0.0.0 --port $PORT`, **Health Check Path** `/health`.

## 3. Deploy the frontend (Vercel)

1. In Vercel, import the same repo.
2. **Root Directory**: `frontend`. **Framework Preset**: Create React App (build command `npm run build`, output `build`).
3. Add an environment variable: `REACT_APP_API_BASE_URL` = your Render backend URL from step 2.
4. Deploy. Your frontend URL will be something like `https://bizdaily.vercel.app`.

## 4. Close the loop: update CORS

Go back to the Render backend's environment variables and set:

```
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

Render will redeploy automatically. Both services also auto-redeploy on every push to your default branch.

## Final architecture

```
User → Vercel (React frontend) → Render (FastAPI backend) → Neon (Postgres)
```

## Alternatives

- **No cold starts, ~$5/month**: [Railway](https://railway.app) (backend + Postgres) + Vercel. This repo also ships a `railway.toml` and `Procfile` for that path — same steps as above, but create the service in Railway instead of Render and add a Railway Postgres instance (or keep using Neon).
- **Full control, ~$4-6/month**: a single small VPS (Fly.io, Hetzner, DigitalOcean) running the backend, frontend build, and Postgres together via Docker Compose.

## Performance notes

- The backend runs FastAPI + `uvicorn` with async LLM calls and thread pools for DB/API work, so it handles concurrent requests reasonably well even on a single free-tier instance.
- `GZipMiddleware` is enabled for response compression.
- If you outgrow the free tier, the first upgrade worth making is usually the backend plan (for always-on + more CPU), not the database.
