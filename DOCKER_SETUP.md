# Docker Setup for ChromaDB

## Step 1: Start Docker Desktop

1. **Open Docker Desktop** from your Start menu or taskbar
2. **Wait for it to fully start** (you'll see "Docker Desktop is running" in the system tray)
3. The Docker icon in the system tray should be green/active

## Step 2: Start ChromaDB

Once Docker Desktop is running, execute:

```bash
.\start-chromadb-docker.bat
```

Or manually:
```bash
docker run -d --name chromadb -p 8000:8000 -v chroma_data:/chroma/chroma chromadb/chroma
```

## Step 3: Verify It's Running

```bash
docker ps
```

You should see a container named `chromadb` running.

Test the connection:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

Or open in browser: http://localhost:8000

## Your Backend Configuration

Your `backend/.env` is already configured correctly:
```env
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=autism-documents
```

Your backend will automatically connect to ChromaDB once it's running!

## Useful Commands

**Start ChromaDB:**
```bash
.\start-chromadb-docker.bat
# or
docker start chromadb
```

**Stop ChromaDB:**
```bash
.\stop-chromadb-docker.bat
# or
docker stop chromadb
```

**View ChromaDB logs:**
```bash
docker logs chromadb
```

**Remove ChromaDB (if needed):**
```bash
docker stop chromadb
docker rm chromadb
```

## Benefits of Using Docker

✅ No Python version conflicts  
✅ No venv needed  
✅ Easy to start/stop  
✅ Persistent data (stored in Docker volume `chroma_data`)  
✅ Works on any system  

## Troubleshooting

**"Docker is not running":**
- Make sure Docker Desktop is started
- Check the system tray for Docker icon
- Restart Docker Desktop if needed

**"Port 8000 already in use":**
- Stop any existing ChromaDB containers: `docker stop chromadb`
- Or stop any Python ChromaDB server that might be running

**"Cannot connect to Docker daemon":**
- Docker Desktop might not be fully started
- Wait a few seconds and try again
