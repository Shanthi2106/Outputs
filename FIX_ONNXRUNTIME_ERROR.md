# Fix onnxruntime Python 3.14 (cp314) Error

## Problem
You're getting an error that `onnxruntime==1.23.2` has no wheels for Python 3.14 (cp314).

## Solution Options

### Option 1: Use Python 3.13 or 3.12 (Recommended)

The venv was created with Python 3.13.9, which should work. The error suggests pip might be detecting Python 3.14 somewhere.

**Fix:**
1. Make sure you're using Python 3.13:
   ```bash
   python --version
   # Should show: Python 3.13.x
   ```

2. Recreate venv with explicit Python version:
   ```bash
   cd backend
   # Delete old venv (close any processes using it first)
   rmdir /s venv
   # Create new venv
   python -m venv venv
   # Activate and install
   venv\Scripts\activate
   pip install chromadb
   ```

### Option 2: Install Without Version Constraint

Update `requirements.txt` to allow pip to find compatible versions:

```txt
chromadb>=0.4.0
```

Then install:
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### Option 3: Use Docker for ChromaDB (Easiest)

Skip the Python venv entirely and use Docker:

```bash
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

Then in your `.env`:
```env
CHROMA_URL=http://localhost:8000
```

No Python venv needed!

### Option 4: Install onnxruntime Separately

If you need the Python package, install onnxruntime first with a compatible version:

```bash
cd backend
venv\Scripts\activate
pip install "onnxruntime>=1.14.1,<1.24.0"
pip install chromadb
```

## Quick Fix (Recommended)

Since ChromaDB is already working (you have the venv with it installed), you can:

1. **Just use the existing venv** - it should work fine
2. **Or use Docker** - easier and no Python version issues

## Verify It's Working

Test ChromaDB:
```bash
cd backend
venv\Scripts\activate
chroma --version
```

If that works, you're all set! The error might have been from a different installation attempt.
