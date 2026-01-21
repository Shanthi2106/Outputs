# Quick Start Guide

Get your AI-Powered Parent Assistant for Autism up and running in 5 minutes!

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js v20 or higher installed ([Download](https://nodejs.org/))
- ✅ An OpenAI API key ([Get one](https://platform.openai.com/api-keys)) OR Anthropic API key
- ✅ A code editor (VS Code recommended)

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (2 minutes)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Backend (1 minute)

```bash
cd backend

# Copy the example environment file
cp .env.example .env

# Open .env in your editor and add your API key:
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-your-actual-key-here
```

**Minimum required configuration in `.env`:**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
DATABASE_URL=postgresql://localhost:5432/autism_assistant
```

### Step 3: Configure Frontend (30 seconds)

```bash
cd frontend

# Copy the example environment file
cp .env.example .env

# Default configuration works for local development
```

### Step 4: Run the Application (30 seconds)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

Wait for the message: `Server running on port 3000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

Wait for the message: `Local: http://localhost:5173`

### Step 5: Open in Browser (30 seconds)

Open your browser and go to: **http://localhost:5173**

You should see the Autism Parent Assistant welcome screen!

## ✅ Verify It's Working

1. Accept the disclaimer
2. Type a question like: "What is echolalia?"
3. You should get a clear, plain-language explanation

## 🎉 You're Done!

The application is now running locally. Try these sample questions:
- "What is ABA therapy?"
- "Explain sensory processing"
- "What does IEP mean?"
- Paste a section from an IEP or therapy note

## 🐛 Troubleshooting

### Backend won't start

**Error: "AI provider not configured"**
```bash
# Make sure you added your API key to backend/.env
# Check that the file is named .env (not .env.txt)
```

**Error: "Port 3000 already in use"**
```bash
# Change the port in backend/.env
PORT=3001
```

### Frontend shows "Network Error"

```bash
# Make sure the backend is running (Terminal 1)
# Check that backend is on port 3000
# Verify frontend .env has: VITE_API_URL=http://localhost:3000/api/v1
```

### AI responses not working

```bash
# Verify your API key is correct in backend/.env
# Check the backend terminal for error messages
# Make sure you have credits/quota on your OpenAI account
```

## 📊 What's Next?

Now that it's running, you can:

1. **Expand the knowledge base** - Add more terms to `knowledge-base/terms-starter.json`
2. **Customize the UI** - Edit components in `frontend/src/components/`
3. **Improve AI responses** - Modify prompts in `backend/src/services/AIService.ts`
4. **Set up a database** - Follow the full README for production setup

## 📖 Need More Help?

- **Full Documentation:** See [README.md](./README.md)
- **Architecture Details:** See [docs/05_System_Architecture.md](./docs/05_System_Architecture.md)
- **User Stories:** See [docs/04_User_Stories_And_Acceptance_Criteria.md](./docs/04_User_Stories_And_Acceptance_Criteria.md)

## 🔑 Getting API Keys

### OpenAI (Recommended for MVP)
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new key
5. Copy it to your `.env` file

### Anthropic (Alternative)
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys
4. Create a new key
5. Set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY=your-key` in `.env`

## 💡 Development Tips

- **Hot Reload:** Both frontend and backend auto-reload on file changes
- **Logs:** Backend logs are in `backend/logs/`
- **Browser DevTools:** Press F12 to see console logs and network requests
- **API Testing:** Use the health check endpoint: http://localhost:3000/health

---

**Happy Building! 🚀**

If you encounter any issues, check the logs in your terminal or the browser console for error messages.
