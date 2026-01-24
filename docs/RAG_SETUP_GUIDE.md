# RAG (Retrieval-Augmented Generation) Setup Guide

This guide explains how to set up and configure the RAG system with vector database for the AI-Powered Parent Assistant for Autism.

## Overview

The RAG system uses:
- **ChromaDB**: Vector database for storing document chunks (uploaded documents)
- **Pinecone** (optional): Vector database for term storage
- **OpenAI Embeddings**: `text-embedding-3-small` for generating vector embeddings
- **Hybrid Search**: Combines semantic similarity with keyword matching

## Architecture

```
Document Upload → Chunking → Embedding → ChromaDB Storage
                                                      ↓
User Query → Embedding → Vector Search → Re-ranking → AI Response
```

## Prerequisites

1. **Node.js** v20 or higher
2. **OpenAI API Key** (required for embeddings)
3. **ChromaDB** (for document RAG) - can run locally or use cloud
4. **Pinecone API Key** (optional, for term search)

## Step 1: Install ChromaDB

### Option A: Docker (Recommended for Local Development)

```bash
# Run ChromaDB in a Docker container
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  chromadb/chroma
```

Verify it's running:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

### Option B: Python Package (Alternative)

```bash
pip install chromadb
chroma run --path ./chroma_data --port 8000
```

### Option C: ChromaDB Cloud (Production)

1. Sign up at [https://www.trychroma.com/](https://www.trychroma.com/)
2. Create a new project
3. Get your API key and endpoint URL

## Step 2: Configure Environment Variables

Edit `backend/.env`:

```env
# ChromaDB Configuration (for document chunks)
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION_NAME=autism-documents

# Pinecone Configuration (optional, for term storage)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=autism-terms

# Embedding Configuration
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Document Chunking Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### Configuration Options

- **CHROMA_URL**: ChromaDB server URL
  - Local: `http://localhost:8000`
  - Cloud: Your ChromaDB cloud endpoint
- **CHROMA_COLLECTION_NAME**: Collection name for document chunks (default: `autism-documents`)
- **EMBEDDING_MODEL**: OpenAI embedding model
  - `text-embedding-3-small` (1536 dimensions) - Recommended
  - `text-embedding-3-large` (3072 dimensions) - Higher quality, more expensive
- **CHUNK_SIZE**: Characters per chunk (default: 1000)
- **CHUNK_OVERLAP**: Overlap between chunks in characters (default: 200)

## Step 3: Initialize Vector Database

Run the setup script:

```bash
cd backend
npm run setup-vector-db
```

This script will:
- ✅ Check ChromaDB connection
- ✅ Create collection if it doesn't exist
- ✅ Verify embedding service
- ✅ Validate configuration

Expected output:
```
✅ Vector database initialized successfully
✅ Vector database is healthy
✅ Collection: autism-documents
✅ Embedding service is working
```

## Step 4: Verify RAG Pipeline

Test the complete RAG pipeline:

```bash
npm run verify-rag
```

This script tests:
- ✅ Vector service availability
- ✅ Embedding generation
- ✅ Vector search
- ✅ RAG query processing
- ✅ Embedding cache

## Step 5: Upload Documents

Once the vector database is set up, upload documents via the API:

```bash
curl -X POST http://localhost:3000/api/v1/document/upload \
  -F "document=@sample-iep.pdf"
```

The system will:
1. Extract text from the document
2. Chunk the document (with sentence-aware boundaries)
3. Generate embeddings for each chunk
4. Store chunks in ChromaDB

## Health Checks

### Check Vector Database Status

```bash
curl http://localhost:3000/api/v1/health/vector-db
```

Response:
```json
{
  "status": "healthy",
  "chroma": {
    "configured": true,
    "available": true,
    "status": "healthy",
    "collectionExists": true,
    "documentChunks": 42
  },
  "embeddings": {
    "model": "text-embedding-3-small",
    "expectedDimensions": 1536
  }
}
```

## Troubleshooting

### ChromaDB Connection Failed

**Error**: `Failed to initialize vector database: ECONNREFUSED`

**Solution**:
1. Ensure ChromaDB is running: `docker ps` (if using Docker)
2. Check CHROMA_URL in `.env` matches your ChromaDB instance
3. Test connection: `curl http://localhost:8000/api/v1/heartbeat`

### Embedding Generation Failed

**Error**: `Invalid OpenAI API key`

**Solution**:
1. Verify `OPENAI_API_KEY` is set in `.env`
2. Check API key is valid and has credits
3. Test with: `npm run verify-rag`

### Empty Search Results

**Issue**: Vector search returns no results

**Possible causes**:
1. No documents uploaded yet
2. Query doesn't match any document content
3. Minimum relevance score too high

**Solution**:
1. Upload documents first
2. Check collection stats: `curl http://localhost:3000/api/v1/health/vector-db`
3. Try broader queries

### Dimension Mismatch

**Warning**: `Dimension mismatch: expected 1536, got 3072`

**Solution**:
Update `EMBEDDING_DIMENSIONS` in `.env` to match your embedding model:
- `text-embedding-3-small`: 1536
- `text-embedding-3-large`: 3072

## Performance Tuning

### Chunk Size

- **Smaller chunks (500-800 chars)**: More precise retrieval, more chunks to store
- **Larger chunks (1500-2000 chars)**: Better context, fewer chunks

**Recommendation**: Start with 1000 characters, adjust based on your documents.

### Chunk Overlap

- **Higher overlap (300-400 chars)**: Better context preservation
- **Lower overlap (100-150 chars)**: Fewer duplicate chunks

**Recommendation**: 20% of chunk size (200 chars for 1000 char chunks).

### Embedding Model

- **text-embedding-3-small**: Fast, cost-effective, good quality
- **text-embedding-3-large**: Higher quality, slower, more expensive

**Recommendation**: Use `text-embedding-3-small` unless you need maximum quality.

### Cache Configuration

Embeddings are cached for 24 hours by default. To clear cache:

```typescript
import embeddingService from './services/EmbeddingService';
embeddingService.clearCache();
```

## Production Deployment

### ChromaDB Cloud

1. Sign up for ChromaDB Cloud
2. Create a project and get your endpoint URL
3. Set `CHROMA_URL` to your cloud endpoint
4. Add authentication if required

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  chromadb:
    image: chromadb/chroma
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE

volumes:
  chroma_data:
```

Run: `docker-compose up -d`

### Monitoring

Monitor vector database health:

```bash
# Health check endpoint
GET /api/v1/health/vector-db

# Collection statistics
# (via health endpoint or directly from VectorService)
```

## Advanced Features

### Hybrid Search

The system uses hybrid search combining:
- **Semantic similarity** (70% weight): Vector cosine similarity
- **Keyword matching** (30% weight): Exact word matches

Results are re-ranked to improve relevance.

### Re-ranking

Search results are re-ranked based on:
1. Semantic similarity score
2. Keyword match score
3. Term presence boost (chunks with autism terms get slight boost)

### Metadata Filtering

Filter search by document metadata:

```typescript
const results = await vectorService.searchSimilarChunks(
  query,
  5,
  { fileName: 'iep-2024.pdf' } // Filter by file name
);
```

## Best Practices

1. **Regular Health Checks**: Monitor `/api/v1/health/vector-db` regularly
2. **Backup Collections**: Export ChromaDB data periodically
3. **Monitor Costs**: Track OpenAI embedding API usage
4. **Optimize Chunking**: Adjust chunk size based on document types
5. **Cache Strategy**: Use embedding cache for frequently accessed content

## Support

For issues or questions:
1. Check logs: `backend/logs/`
2. Run verification: `npm run verify-rag`
3. Check health endpoint: `/api/v1/health/vector-db`
4. Review this guide and troubleshooting section

## Additional Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
