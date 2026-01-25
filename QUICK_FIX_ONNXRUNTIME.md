# Quick Fix: onnxruntime Python 3.14 Error

## Good News! 🎉

**ChromaDB is already installed and working!** The error you're seeing is likely from trying to reinstall or update packages.

## Solution

### If ChromaDB is Already Working

**You can ignore this error!** Your ChromaDB installation is fine. The error only appears when:
- Trying to reinstall packages
- Updating requirements
- Creating a new venv

**To verify ChromaDB works:**
```bash
cd backend
venv\Scripts\activate
chroma --version
```

If that works, you're all set!

### If You Need to Reinstall

**Option 1: Use Docker (Easiest - No Python Issues)**

```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

Then in `backend/.env`:
```env
CHROMA_URL=http://localhost:8000
```

**Option 2: Fix the Venv**

The venv is corrupted. To fix:

1. **Close all terminals** using the venv
2. **Run the fix script:**
   ```bash
   .\fix-venv-onnxruntime.bat
   ```

3. **Or manually:**
   ```bash
   cd backend
   # Delete venv (close processes first)
   rmdir /s venv
   # Create new venv
   python -m venv venv
   # Activate
   venv\Scripts\activate
   # Install
   pip install chromadb
   ```

## Why This Error Happens

- `onnxruntime` (a ChromaDB dependency) doesn't have pre-built wheels for Python 3.14 yet
- Your system has Python 3.13.9, which should work
- The error appears when pip tries to find Python 3.14 wheels

## Recommended: Use Docker

Docker is the easiest solution - no Python version conflicts:

```bash
# Start ChromaDB
docker run -d --name chromadb -p 8000:8000 chromadb/chroma

# Verify it's running
curl http://localhost:8000/api/v1/heartbeat
```

Then your backend will connect to it automatically!

## Current Status

✅ ChromaDB is installed  
⚠️ Venv has some corruption (but ChromaDB works)  
✅ You can use ChromaDB as-is  
✅ Or switch to Docker for easier management  
