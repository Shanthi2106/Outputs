# Fix: DATABASE_URL Not Provided Error

## Problem

You're getting an error that PostgreSQL URL is not provided, even though you've configured it in `.env`.

## Common Causes

### 1. DATABASE_URL Split Across Lines

The most common issue is that `DATABASE_URL` is split across multiple lines in your `.env` file. Environment variables must be on a single line.

**❌ Wrong (split across lines):**
```env
DATABASE_URL=postgresql://user:pass@host:port/neon
db?sslmode=require
```

**✅ Correct (single line):**
```env
DATABASE_URL=postgresql://user:pass@host:port/neondb?sslmode=require
```

### 2. Server Not Restarted

After updating `.env`, you must restart your backend server for changes to take effect.

### 3. .env File Location

Make sure the `.env` file is in the `backend/` directory, not the root directory.

## Solution

### Step 1: Verify DATABASE_URL is on Single Line

Open `backend/.env` and ensure `DATABASE_URL` is on a single line with no line breaks:

```env
DATABASE_URL=postgresql://neondb_owner:npg_VSDC1vZXAlB4@ep-divine-king-ahwi65s4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 2: Test Configuration

Run the test script:

```bash
cd backend
tsx test-db-connection.ts
```

Or use the batch file:

```bash
.\verify-env.bat
```

### Step 3: Restart Backend Server

After fixing the `.env` file:

1. **Stop** your backend server (Ctrl+C)
2. **Start** it again:
   ```bash
   npm run dev
   ```

## Verification

You should see in the server logs:

```
✓ Configuration validated successfully
✓ VectorService initialized with PostgreSQL (pgvector)
✓ Vector database (PostgreSQL pgvector) is available
```

## Quick Fix Script

I've created a verification script. Run:

```bash
cd backend
.\verify-env.bat
```

This will check:
- ✅ .env file exists
- ✅ DATABASE_URL is present
- ✅ DATABASE_URL is on a single line
- ✅ Node.js can read it

## Still Having Issues?

1. **Check for hidden characters:**
   - Open `.env` in a text editor
   - Make sure there are no extra spaces or special characters
   - Ensure no line breaks in the middle of the URL

2. **Verify the connection string format:**
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

3. **Test the connection manually:**
   ```bash
   cd backend
   tsx test-db-connection.ts
   ```

4. **Check server logs:**
   - Look for the exact error message
   - Check if it says "DATABASE_URL not configured" or a connection error

## Your Current Configuration

Your `DATABASE_URL` should be:
```
postgresql://neondb_owner:npg_VSDC1vZXAlB4@ep-divine-king-ahwi65s4-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Make sure this entire string is on **one line** in your `.env` file.
