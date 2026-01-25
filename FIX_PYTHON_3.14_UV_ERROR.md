# Fix: Python 3.14 + uv pip install Error

## Problem

You're using `uv pip install` with Python 3.14, but `onnxruntime` (a ChromaDB dependency) doesn't have stable wheels for Python 3.14 yet.

**Error:**
```
hint: You require CPython 3.14 (`cp314`), but we only found wheels for
      `onnxruntime` (v1.23.2) with the following Python ABI tags: `cp310`,
      `cp311`, `cp312`, `cp313`, `cp313t`
```

## Solutions

### Option 1: Use Pre-Release Versions (Quick Fix)

Pre-release versions of `onnxruntime` and `chromadb` may support Python 3.14:

```bash
cd backend
uv pip install --prerelease=allow chromadb
```

**Pros:**
- Quick fix
- Works with Python 3.14

**Cons:**
- Uses pre-release (beta) versions
- May have bugs or instability

### Option 2: Use Python 3.13 (Recommended)

Python 3.13 is fully supported and stable:

```bash
cd backend

# If you have Python 3.13 installed:
python3.13 -m venv venv
venv\Scripts\activate
uv pip install chromadb
```

**If you don't have Python 3.13:**
1. Download from: https://www.python.org/downloads/
2. Install Python 3.13.x
3. Then run the commands above

**Pros:**
- Stable and well-tested
- All packages have wheels
- No pre-release versions needed

**Cons:**
- Need to install Python 3.13

### Option 3: Use Docker (Easiest - No Python Issues)

Skip Python entirely and use Docker:

```bash
# Start ChromaDB in Docker
docker run -d --name chromadb -p 8000:8000 chromadb/chroma

# Verify it's running
curl http://localhost:8000/api/v1/heartbeat
```

Then in `backend/.env`:
```env
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=autism-documents
```

**Pros:**
- No Python version conflicts
- No venv needed
- Easy to start/stop
- Works on any system

**Cons:**
- Need Docker installed

## Quick Fix Script

I've created a helper script:

```bash
cd backend
.\install-chromadb-with-uv.bat
```

This will guide you through the options.

## Recommendation

**Use Docker** - It's the easiest solution and avoids all Python version issues. Your backend will work exactly the same, just connecting to ChromaDB in Docker instead of a local Python installation.

## Verify Installation

After installing, test ChromaDB:

```bash
cd backend
venv\Scripts\activate
chroma --version
```

Or if using Docker:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

## Current Status

- ✅ You have Python 3.14 installed
- ❌ onnxruntime doesn't have stable wheels for Python 3.14 yet
- ✅ Pre-release versions available (with `--prerelease=allow`)
- ✅ Python 3.13 fully supported
- ✅ Docker option available (no Python needed)
