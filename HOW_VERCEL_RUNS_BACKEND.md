# How Vercel Makes Your Backend Run: Serverless Functions Explained

## Key Concept: Serverless ≠ Always-On Server

**Traditional Backend (Local Development):**
- Server runs continuously on port 3004
- Always listening for requests
- Consumes resources even when idle
- You manage: starting, stopping, scaling

**Vercel Backend (Production):**
- **No always-on server** - functions are invoked on-demand
- **Serverless functions** - code runs only when requests come in
- **Auto-scaling** - Vercel handles scaling automatically
- **Zero server management** - Vercel manages everything

---

## How It Works: Step-by-Step

### 1. **Build Phase** (During Deployment)

When you deploy to Vercel, here's what happens:

```bash
# Vercel runs your buildCommand from vercel.json:
cd backend && npm install && npm run build
cd frontend && npm install && npm run build
```

**What gets built:**
- ✅ Backend TypeScript → JavaScript (`backend/dist/index.js`)
- ✅ Frontend React → Static files (`frontend/dist/`)
- ✅ Dependencies installed for both

**Result:**
- Your Express app is compiled to `backend/dist/index.js`
- This file contains your entire backend code (routes, services, etc.)

### 2. **Serverless Function Creation**

Vercel detects `api/index.js` and creates a serverless function:

```
/api/index.js  →  Serverless Function
```

**What `api/index.js` does:**
```javascript
// 1. Loads your compiled Express app
const app = require('../backend/dist/index.js');

// 2. Wraps it in a handler function
const handler = (req, res) => {
  // Adjust paths for routing
  // Pass request to Express app
  return app(req, res);
};

// 3. Exports the handler
module.exports = handler;
```

**Key Point:** Your Express app is **NOT running as a server**. It's packaged as a function that Vercel can invoke.

### 3. **Request Routing** (When User Makes Request)

When a user visits your app:

```
User Request: https://your-app.vercel.app/api/v1/health
                    ↓
         Vercel's Edge Network
                    ↓
    Rewrite Rule: /api/:path* → /api/index.js
                    ↓
         Serverless Function Invoked
                    ↓
    api/index.js loads backend/dist/index.js
                    ↓
    Express app handles the request
                    ↓
         Response sent back to user
```

### 4. **Function Lifecycle**

**Cold Start (First Request):**
1. Vercel receives request to `/api/v1/health`
2. Vercel checks: "Is function already running?" → No
3. Vercel **spins up** a new function instance:
   - Loads `api/index.js`
   - Executes: `require('../backend/dist/index.js')`
   - Your Express app initializes (routes, middleware, services)
   - Function is now "warm" and ready
4. Request is processed
5. Response sent

**Warm Start (Subsequent Requests):**
1. Vercel receives request
2. Vercel checks: "Is function already running?" → Yes (warm)
3. Request is processed immediately (no initialization delay)
4. Response sent

**Function Shutdown:**
- After a period of inactivity, Vercel may shut down the function instance
- Next request will be a "cold start" again
- This is why first requests can be slower

---

## Your Specific Setup

### vercel.json Configuration

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.js"  // Routes all /api/* to serverless function
    }
  ],
  "functions": {
    "api/index.js": {
      "includeFiles": "backend/dist/**"  // Includes your compiled backend
    }
  }
}
```

**What this means:**
- Any request to `/api/*` is routed to `api/index.js`
- The `backend/dist/**` files are included in the function package
- Your Express app can access all its compiled code

### Backend Code Adaptation

Your `backend/src/index.ts` detects Vercel environment:

```typescript
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (!isVercel) {
  // Local: Start HTTP server on port 3004
  server = app.listen(config.port, () => {
    console.log('Server running on port 3004');
  });
} else {
  // Vercel: Don't start server, just export the app
  logger.info('Running in Vercel serverless environment');
}

// Export the Express app (used by api/index.js)
module.exports = app;
```

**Key Point:** In Vercel, your code **doesn't call `app.listen()`**. Instead:
- The Express app is exported
- `api/index.js` loads it
- Vercel invokes the function when requests come in

---

## Differences: Local vs Vercel

| Aspect | Local Development | Vercel Production |
|--------|------------------|-------------------|
| **Server** | Always running on port 3004 | No server, serverless functions |
| **Startup** | You run `npm run dev` | Automatic on deployment |
| **Scaling** | Manual (one instance) | Automatic (many instances) |
| **Cost** | Free (your machine) | Pay per request/invocation |
| **Cold Starts** | None (always running) | First request may be slower |
| **Port** | Fixed port 3004 | No port (handled by Vercel) |
| **Environment** | `NODE_ENV=development` | `NODE_ENV=production`, `VERCEL=1` |

---

## Advantages of Serverless

### ✅ **Automatic Scaling**
- One user → One function instance
- 1000 users → 1000 function instances (automatically)
- No manual scaling needed

### ✅ **Cost Efficiency**
- Pay only for what you use
- No cost when no requests (unlike always-on servers)
- Free tier: 100GB-hours/month

### ✅ **Zero Server Management**
- No need to manage servers, ports, or infrastructure
- Vercel handles: deployment, scaling, monitoring, SSL

### ✅ **Global Distribution**
- Functions run close to users (edge network)
- Lower latency worldwide

---

## Limitations & Considerations

### ⚠️ **Cold Starts**
- First request after inactivity can be slow (1-3 seconds)
- Function needs to initialize
- Subsequent requests are fast (warm function)

**Mitigation:**
- Keep functions warm with periodic health checks
- Use Vercel Pro for better cold start performance
- Optimize initialization code

### ⚠️ **Function Timeout**
- Free tier: 10 seconds max execution time
- Pro tier: 60 seconds max
- Your AI calls might timeout if they take too long

**Your Setup:**
- Health checks: Fast ✅
- AI responses: May timeout if > 10s ⚠️
- Document uploads: May timeout if processing > 10s ⚠️

### ⚠️ **State Management**
- Functions are stateless
- Can't maintain in-memory state between requests
- Use databases (PostgreSQL) for persistent data ✅

---

## How Your Backend Stays "Up"

**It doesn't!** That's the key insight:

1. **No always-on process** - Functions are invoked on-demand
2. **First request** - Cold start (slower, initializes everything)
3. **Subsequent requests** - Warm function (fast, already initialized)
4. **After inactivity** - Function may shut down
5. **Next request** - Cold start again

**What keeps it "available":**
- Vercel's infrastructure is always ready to invoke functions
- Your code is deployed and ready to run
- When a request comes, Vercel spins up the function instantly

---

## Monitoring Your Backend

### Vercel Dashboard
1. Go to your project → **Functions** tab
2. See: Invocations, errors, execution time
3. Check logs for each function invocation

### Function Logs
```javascript
// Your logs appear in Vercel Dashboard
console.log('[Vercel Function] Loading Express app...');
logger.info('Request received');
```

### Health Check
```bash
# Test your backend
curl https://your-app.vercel.app/api/v1/health
```

---

## Summary

**Traditional Backend:**
```
Server Process (Always Running)
  ↓
Listens on Port 3004
  ↓
Handles Requests
```

**Vercel Backend:**
```
Request Arrives
  ↓
Vercel Invokes Function
  ↓
Function Loads Express App
  ↓
Handles Request
  ↓
Function May Shut Down
```

**Key Takeaway:** Your backend isn't "running" - it's **ready to run** when needed. Vercel manages the execution, scaling, and infrastructure automatically.

---

## Troubleshooting

### "Function timeout"
- Your code took > 10s (free) or > 60s (pro)
- Optimize slow operations
- Consider breaking into smaller functions

### "Cold start too slow"
- Normal for first request after inactivity
- Keep function warm with periodic pings
- Upgrade to Pro for better performance

### "Backend not responding"
- Check Vercel function logs
- Verify environment variables are set
- Check that `backend/dist/index.js` exists after build

---

## Next Steps

1. **Monitor function invocations** in Vercel Dashboard
2. **Check execution times** - optimize slow endpoints
3. **Set up alerts** for function errors
4. **Consider Pro plan** if you need longer timeouts or better performance

Your backend is now running on Vercel's serverless infrastructure! 🚀
