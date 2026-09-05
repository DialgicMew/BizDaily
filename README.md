# BizDaily

BizDaily tracks Indian startup funding news and turns it into a daily, readable brief. It pulls funding rounds from [Inc42](https://inc42.com)'s public data API, uses an LLM to research and summarize each newly-funded company (problem, solution, traction, founders, risks, sources), and serves it all through a searchable table and a "notebook"-style daily digest.

## Features

- **Funding table** — searchable, paginated feed of funding rounds, with a mobile-friendly card view.
- **Daily brief** — an LLM-generated Q&A style summary for every company funded on a given day, browsable by date.
- **Company detail pages** — deep dive on a single funding round plus its generated company profile.
- **Bring your own LLM key** — the backend only needs an OpenAI API key; no other accounts required to run it yourself.

## Architecture

```
frontend/   React + TypeScript + MUI (3 routes: Home, Daily Brief, Funding Detail)
backend/    FastAPI, split into 3 mounted sub-apps (funding, brief, company details)
            + PostgreSQL for storage
            + OpenAI Responses API (with web search) for company research
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the full request flow and a step-by-step deploy walkthrough.

## Prerequisites

- Python 3.11+
- Node.js 18+
- A PostgreSQL database (local, or a free one from [Neon](https://neon.tech), Railway, Supabase, etc.)
- An [OpenAI API key](https://platform.openai.com/api-keys) with access to the Responses API and web search

## Local setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # then fill in OPENAI_API_KEY and DATABASE_URL
python run.py                 # serves on http://localhost:4010
```

Tables are created automatically on first startup. Visit `http://localhost:4010/docs` for interactive API docs.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # defaults to http://localhost:4010, adjust if needed
npm start                     # serves on http://localhost:3000
```

### 3. Load some data

The funding table starts empty. Trigger a sync from Inc42 by hitting the refresh endpoint (or click **Refresh Data** in the UI once the frontend is running):

```bash
curl -X POST http://localhost:4010/api/funding/funding/refresh
```

This walks Inc42's paginated API and can take a while the first time. The Daily Brief page will generate company profiles on demand (via the LLM) the first time you view a given date.

## Configuration reference

| Variable | Where | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | `backend/.env` | LLM company research (required) |
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string (required) |
| `ALLOWED_ORIGINS` | `backend/.env` | CORS allowlist for the frontend origin |
| `REACT_APP_API_BASE_URL` | `frontend/.env` | Where the frontend looks for the backend API |

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for a free-tier deployment path (Render + Neon + Vercel).

## Using a different LLM provider

`backend/llm_service.py` is the only file that talks to an LLM (currently OpenAI's Responses API with web search). To swap providers, replace `get_async_client()` and the `client.responses.create(...)` call with your provider's equivalent — the rest of the app only depends on `get_company_details()` returning a `(company_name, sections_dict)` tuple.

## Contributing

Issues and PRs are welcome. Please open an issue before starting large changes so we can discuss approach first.

## License

[MIT](LICENSE)
