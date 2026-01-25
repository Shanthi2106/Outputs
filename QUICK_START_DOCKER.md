# Quick Start: ChromaDB with Docker

## ⚠️ Important: Start Docker Desktop First!

Before running ChromaDB, you need to start Docker Desktop.

## Steps:

### 1. Start Docker Desktop
- Open **Docker Desktop** from your Start menu
- Wait for it to fully start (the system tray icon should be active/green)
- This may take 30-60 seconds

### 2. Start ChromaDB
Once Docker Desktop is running, execute:

```bash
.\start-chromadb-docker.bat
```

Or manually:
```bash
docker run -d --name chromadb -p 8000:8000 -v chroma_data:/chroma/chroma chromadb/chroma
```

### 3. Verify It's Running
```bash
docker ps
```

You should see `chromadb` in the list.

Test it:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

Or open in browser: **http://localhost:8000**

## ✅ Your Backend is Already Configured!

Your `backend/.env` already has:
```env
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=autism-documents
```

Once ChromaDB is running, your backend will automatically connect!

## Quick Commands

**Start ChromaDB:**
```bash
.\start-chromadb-docker.bat
```

**Stop ChromaDB:**
```bash
.\stop-chromadb-docker.bat
```

**View logs:**
```bash
docker logs chromadb
```

**Check status:**
```bash
docker ps
```

## That's It!

Once Docker Desktop is running and you've started ChromaDB, you're all set! No Python venv needed, no version conflicts. 🎉
