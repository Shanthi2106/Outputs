# Use Docker for ChromaDB (Recommended)

## Why Use Docker?

- ✅ No Python version conflicts
- ✅ No venv issues
- ✅ Easy to start/stop
- ✅ Works on any system
- ✅ No onnxruntime errors

## Quick Start

### Step 1: Install Docker (if not installed)

Download from: https://www.docker.com/products/docker-desktop/

### Step 2: Start ChromaDB

```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

### Step 3: Verify It's Running

```bash
curl http://localhost:8000/api/v1/heartbeat
```

Or check in browser: http://localhost:8000

### Step 4: Update Your .env

Make sure `backend/.env` has:
```env
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=autism-documents
```

### Step 5: Restart Backend

Your backend will automatically connect to ChromaDB running in Docker!

## Stop ChromaDB

```bash
docker stop chromadb
```

## Start ChromaDB Again

```bash
docker start chromadb
```

## Remove ChromaDB

```bash
docker stop chromadb
docker rm chromadb
```

## Persistent Data (Optional)

To keep data between restarts:

```bash
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v chroma_data:/chroma/chroma \
  chromadb/chroma
```

## That's It!

No Python venv needed. No onnxruntime errors. Just Docker!
