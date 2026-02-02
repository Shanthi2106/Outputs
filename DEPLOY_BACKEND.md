# How to Deploy the Backend

The backend is a **Node.js 20.x** Express app (TypeScript compiled to JS). It lives in `backend/` and uses environment variables from [backend/src/config/index.ts](backend/src/config/index.ts).

**Build:** `npm run build` (from `backend/`) → compiles TS and copies knowledge base  
**Start:** `npm run start` → runs `node dist/index.js`  
**Port:** Set via `PORT` (default 3000)

---

## Required environment variables

Set these wherever you deploy (and in production use real secrets):

| Variable | Purpose |
|----------|--------|
| `PORT` | Server port (host sets this on most platforms) |
| `AI_PROVIDER` | `openai` or `anthropic` |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | API key for the chosen provider |
| `AI_MODEL` | e.g. `gpt-4o` (OpenAI) or a valid Anthropic model |
| `CORS_ORIGIN` | Frontend URL (e.g. `https://your-app.vercel.app`) so the API allows requests from the frontend |

**Optional (for full features):**

- `DATABASE_URL` – PostgreSQL (with pgvector) for document RAG
- `PINECONE_API_KEY`, `PINECONE_INDEX` – term vector search
- `REDIS_URL` – Redis (if you add caching)
- `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`, `CHUNK_SIZE`, `CHUNK_OVERLAP` – tuning

---

## Option 1: Deploy backend on Vercel (same project as frontend)

You previously excluded the backend from Vercel. To deploy it again as a serverless function:

1. **Revert the “backend excluded” changes:**
   - In [vercel.json](vercel.json): restore the `/api/:path*` rewrite and the `functions` block for `api/index.js` (with `includeFiles`: `{backend/dist,node_modules}/**`).
   - In [.vercelignore](.vercelignore): remove the lines that ignore `backend/` and `api/`.
   - In [vercel.json](vercel.json) `buildCommand`: build both backend and frontend, e.g.  
     `npm install && (cd backend && npm install && npm run build) && (cd frontend && npm install && npm run build)`.

2. **Environment variables:** In Vercel → Project → Settings → Environment Variables, add the same vars as above (e.g. `OPENAI_API_KEY`, `CORS_ORIGIN`, `DATABASE_URL` if you use it).

3. **Redeploy.** The API will be at `https://your-project.vercel.app/api/...`.

If you want, I can re-apply the exact `vercel.json` and `.vercelignore` edits to re-enable the backend on Vercel.

---

## Option 2: Railway

1. Go to [railway.app](https://railway.app) and create a project.
2. **New → GitHub repo** (or deploy from CLI). Choose the repo and set the **root directory** to `backend` (so Railway uses only the backend folder).
3. Railway will detect Node and run `npm install`; set **Build Command** to `npm run build` and **Start Command** to `npm run start`.
4. In the service → **Variables**, add all required env vars (including `CORS_ORIGIN` = your Vercel frontend URL).
5. Under **Settings → Networking**, create a public domain. Your API URL will be `https://<your-service>.up.railway.app`.
6. In the frontend (e.g. Vercel env), set `VITE_API_URL` (or whatever your app uses) to that URL so the frontend calls the Railway backend.

---

## Option 3: Render

1. Go to [render.com](https://render.com) → **New → Web Service**.
2. Connect the repo and set **Root Directory** to `backend`.
3. **Build command:** `npm install && npm run build`  
   **Start command:** `npm run start`
4. **Environment:** Add the same env vars; Render will set `PORT` for you.
5. After deploy, use the generated URL (e.g. `https://your-service.onrender.com`) as the backend base URL in your frontend (`VITE_API_URL` or equivalent).

---

## Option 4: Fly.io

1. Install [flyctl](https://fly.io/docs/hub/install/) and log in.
2. From the **project root** (not inside `backend`), run:
   ```bash
   cd backend
   fly launch
   ```
   When prompted, don’t add a Postgres/Redis yet unless you want Fly to host them.
3. Set secrets (env vars):
   ```bash
   fly secrets set OPENAI_API_KEY=sk-... AI_PROVIDER=openai CORS_ORIGIN=https://your-app.vercel.app
   ```
   Add others as needed (`DATABASE_URL`, etc.).
4. Create a `backend/Dockerfile` if Fly doesn’t auto-detect Node, for example:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --omit=dev
   COPY . .
   RUN npm run build
   CMD ["npm", "run", "start"]
   ```
5. Deploy: `fly deploy`. Use the app URL (e.g. `https://your-app.fly.dev`) as the backend URL in the frontend.

---

## Option 5: Docker (recommended for backend)

The repo includes a production-ready **multi-stage** [backend/Dockerfile](backend/Dockerfile) and a root [.dockerignore](.dockerignore). The image uses Node 20 Alpine and includes the built app plus the knowledge-base.

**Build** (from **project root**, not inside `backend/`):

```bash
docker build -f backend/Dockerfile -t autism-backend .
```

**Run** (pass env vars with `-e` or `--env-file`):

```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e OPENAI_API_KEY=your-key \
  -e AI_PROVIDER=openai \
  -e AI_MODEL=gpt-4o \
  -e CORS_ORIGIN=https://your-app.vercel.app \
  autism-backend
```

With an env file (do not commit `.env`):

```bash
docker run -p 3000:3000 --env-file backend/.env autism-backend
```

**Optional:** Add `DATABASE_URL`, `PINECONE_API_KEY`, `PINECONE_INDEX`, etc. to the same `-e` flags or env file.

**Deploying the image:** Push the image to a registry (Docker Hub, GitHub Container Registry, or your cloud’s registry) and run it on any VM, ECS, Cloud Run, App Service, etc. Put the service behind HTTPS (reverse proxy or load balancer) and set `CORS_ORIGIN` to your frontend URL.

---

## After deploying the backend

1. **CORS:** Set `CORS_ORIGIN` to your frontend origin (e.g. `https://your-app.vercel.app`). No trailing slash.
2. **Frontend:** Point the frontend at the new API (e.g. `VITE_API_URL=https://your-backend.up.railway.app`) and redeploy the frontend so it uses that URL.
3. **Health check:** Open `https://your-backend-url/api/health` (or the path your app uses) to confirm the backend is up.

For Docker deployment, use the [backend/Dockerfile](backend/Dockerfile) and build from the project root as shown in Option 5.
