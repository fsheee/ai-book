# ADR-008: Deployment Platform Selection

**Date**: 2025-12-01
**Status**: Accepted
**Related**: RAG Chatbot Integration (Feature 001)

## Context

The RAG chatbot system needs deployment infrastructure for backend API and frontend static site.

## Decision

**Backend: Railway | Frontend: GitHub Pages**

### Backend Deployment: Railway
- **Platform**: Railway (https://railway.app)
- **Reason**: Python-native, easy setup, built-in Postgres, competitive pricing
- **Configuration**: `railway.toml` + environment variables
- **Database**: Railway Postgres (managed)
- **Cost**: ~$5-20/month (usage-based)

### Frontend Deployment: GitHub Pages
- **Platform**: GitHub Pages (free for public repos)
- **Build**: Docusaurus static site generation
- **Deployment**: `gh-pages` branch, automated via GitHub Actions
- **CDN**: Cloudflare (via GitHub Pages)
- **Cost**: Free

## Rationale

### Why Railway (vs alternatives)?

**vs Heroku**:
- Railway: $5 base, usage-based scaling, modern DX
- Heroku: $7 minimum, dyno sleeping issues, older platform

**vs Vercel/Netlify**:
- Railway: Better for Python/FastAPI, integrated Postgres
- Vercel/Netlify: Optimized for Node.js/static sites, serverless functions have cold start

**vs AWS/GCP**:
- Railway: Simpler setup, no configuration complexity
- AWS/GCP: More power/flexibility, but overkill for educational project

**vs Docker + VPS**:
- Railway: Managed infrastructure, automatic SSL, monitoring
- VPS: More control but requires DevOps expertise

### Why GitHub Pages?

**vs Netlify/Vercel**:
- GitHub Pages: Free, simple, integrated with repo
- Netlify/Vercel: More features (edge functions, analytics), but unnecessary for static site

**vs Railway frontend**:
- GitHub Pages: Free, optimized for static content
- Railway: Would add cost for serving static files

## Architecture

```
┌─────────────────┐         HTTPS          ┌──────────────────┐
│                 │ ◄──────────────────────►│                  │
│  GitHub Pages   │                         │  Railway Backend │
│  (Static Site)  │     REST API + SSE      │   (FastAPI)      │
│                 │ ─────────────────────── ►│                  │
└─────────────────┘                         └──────────────────┘
                                                      │
                                                      ├─► Neon Postgres
                                                      ├─► Qdrant Cloud
                                                      └─► OpenAI API
```

## Configuration

### Railway (Backend)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "uvicorn src.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
```

Environment Variables:
- `OPENAI_API_KEY`
- `QDRANT_URL`, `QDRANT_API_KEY`
- `DATABASE_URL` (auto-provided by Railway)
- `API_KEY`, `CORS_ORIGINS`

### GitHub Pages (Frontend)
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install and Build
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/build
```

## Cost Analysis

| Service | Cost | Notes |
|---------|------|-------|
| Railway (Backend) | $5-20/month | Usage-based, includes Postgres |
| GitHub Pages | Free | Unlimited bandwidth for public repos |
| Neon Postgres | Free (optional) | If using external DB |
| Qdrant Cloud | Free tier | Up to 1GB |
| OpenAI API | ~$5-100/month | Based on usage |
| **Total** | **$10-120/month** | Scales with usage |

## Monitoring

- **Railway**: Built-in metrics, logs, alerts
- **GitHub Pages**: Uptime via GitHub status
- **Backend health**: `/health` endpoint checked every 5 minutes
- **Alerts**: Email notifications for deployment failures

## Future Considerations

- If traffic exceeds Railway's pricing sweet spot (>10K requests/day), consider AWS Lambda
- If GitHub Pages rate limits become an issue, migrate to Cloudflare Pages
- If multi-region latency is critical, deploy backend replicas in multiple regions

## References

- [Railway Documentation](https://docs.railway.app/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- Research: `specs/001-rag-chatbot-integration/research.md` (Section: Deployment)
- Quickstart: `specs/001-rag-chatbot-integration/quickstart.md`
