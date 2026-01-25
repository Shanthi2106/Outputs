# Migration from ChromaDB to PostgreSQL (pgvector)

This guide explains the changes made to replace ChromaDB with PostgreSQL using the pgvector extension.

## What Changed

### ✅ Removed
- ChromaDB dependency (`chromadb` package)
- ChromaDB configuration (CHROMA_URL, CHROMA_HOST, CHROMA_API_KEY, etc.)
- Docker setup for ChromaDB

### ✅ Added
- PostgreSQL vector storage using pgvector extension
- Automatic table creation and initialization
- Vector similarity search using PostgreSQL

## Benefits

1. **Single Database**: Use one PostgreSQL database for both relational and vector data
2. **No External Services**: No need for separate ChromaDB server or Docker container
3. **Better Integration**: Vector data is stored alongside your application data
4. **Cloud-Friendly**: Works with any PostgreSQL provider that supports pgvector (Neon, Supabase, AWS RDS, etc.)

## Setup Instructions

### 1. Ensure pgvector Extension is Available

Your PostgreSQL database needs the `pgvector` extension installed.

**For Neon (your current provider):**
- ✅ pgvector is pre-installed and available
- No action needed!

**For other providers:**
- Check if pgvector is available in your plan
- For local PostgreSQL: Install pgvector from https://github.com/pgvector/pgvector

### 2. Update Environment Variables

Remove ChromaDB-related variables from your `.env` file:

```env
# Remove these (no longer needed):
# CHROMA_URL=http://localhost:8000
# CHROMA_HOST=...
# CHROMA_API_KEY=...
# CHROMA_TENANT=...
# CHROMA_DATABASE=...
# CHROMA_COLLECTION_NAME=...
```

Keep your existing `DATABASE_URL` - it's now used for vector storage too:

```env
DATABASE_URL=postgresql://neondb_owner:npg_VSDC1vZXAlB4@ep-divine-king-ahwi65s4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Initialize pgvector Extension

Run the setup script:

```bash
cd backend
npm run setup-vector-db
```

This will:
- Connect to your PostgreSQL database
- Enable the pgvector extension
- Verify everything is working

### 4. Install Dependencies

Remove ChromaDB and ensure PostgreSQL client is installed:

```bash
cd backend
npm install
```

The `chromadb` package will be removed automatically.

### 5. Start Your Server

The vector tables will be created automatically when the server starts:

```bash
npm run dev
```

You should see:
```
✓ VectorService initialized with PostgreSQL (pgvector)
✓ Vector database (PostgreSQL pgvector) is available
```

## Database Schema

The following table is created automatically:

```sql
CREATE TABLE document_chunks (
  id VARCHAR(255) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536),  -- or your EMBEDDING_DIMENSIONS
  metadata JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_document_chunks_document_id ON document_chunks (document_id);
CREATE INDEX idx_document_chunks_created_at ON document_chunks (created_at);
CREATE INDEX document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

## API Changes

### Health Endpoint

The `/api/v1/health/vector-db` endpoint now returns:

```json
{
  "status": "healthy",
  "postgres": {
    "configured": true,
    "available": true,
    "status": "healthy",
    "tableExists": true,
    "tableName": "document_chunks",
    "documentChunks": 42
  }
}
```

Instead of the previous `chroma` object.

## Troubleshooting

### "pgvector extension not available"

**Solution**: Ensure your PostgreSQL provider supports pgvector:
- Neon: ✅ Pre-installed
- Supabase: ✅ Pre-installed
- AWS RDS: Install manually
- Local PostgreSQL: Install from https://github.com/pgvector/pgvector

### "Table does not exist"

**Solution**: The table is created automatically on first server start. Make sure:
1. The server has started at least once
2. `DATABASE_URL` is correct
3. Your database user has CREATE TABLE permissions

### "Connection refused"

**Solution**: Check your `DATABASE_URL` connection string:
- Format: `postgresql://user:password@host:port/database`
- For Neon: Use the connection string from your dashboard
- Ensure SSL mode is set if required: `?sslmode=require`

## Migration from Existing ChromaDB Data

If you have existing data in ChromaDB that you want to migrate:

1. **Export from ChromaDB** (if needed):
   - Use ChromaDB's export functionality
   - Or query the data via the ChromaDB API

2. **Import to PostgreSQL**:
   - The new system will automatically create embeddings and store them
   - Re-upload documents through the application
   - Or write a migration script to import existing data

## Performance Notes

- **HNSW Index**: The system tries to create an HNSW index for fast similarity search
- **Fallback**: If HNSW is not available, it falls back to ivfflat index
- **Batch Processing**: Chunks are processed in batches of 100 for optimal performance

## Next Steps

1. ✅ Remove ChromaDB Docker container (if running):
   ```bash
   docker stop chromadb
   docker rm chromadb
   ```

2. ✅ Update your `.env` file (remove ChromaDB variables)

3. ✅ Run setup: `npm run setup-vector-db`

4. ✅ Start your server: `npm run dev`

5. ✅ Test document upload and RAG functionality

## Support

If you encounter any issues:
- Check the server logs for detailed error messages
- Verify your `DATABASE_URL` is correct
- Ensure pgvector extension is enabled
- Check database permissions
