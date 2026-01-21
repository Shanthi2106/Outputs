# AI-Powered Parent Assistant for Autism

An AI-powered educational assistant that helps parents and caregivers understand complex autism-related terminology through clear, empathetic, plain-language explanations.

## 📋 Project Overview

This application provides:
- **Plain-language explanations** of autism terminology from IEPs, therapy notes, and assessments
- **Contextual clarification** by analyzing document excerpts
- **Conversational interaction** for follow-up questions and deeper understanding
- **Safety boundaries** to prevent medical advice and maintain educational focus

## 🏗️ Project Structure

```
autism-assistant/
├── backend/               # Node.js + TypeScript API server
│   ├── src/
│   │   ├── api/          # Routes and middleware
│   │   ├── services/     # Business logic (AI, Safety, Query)
│   │   ├── models/       # Data models
│   │   ├── utils/        # Utilities (logger, prompts)
│   │   └── config/       # Configuration
│   └── package.json
├── frontend/             # React + TypeScript UI
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript types
│   │   └── styles/       # CSS (Tailwind)
│   └── package.json
├── knowledge-base/       # Autism terminology database
│   └── terms-starter.json
└── docs/                # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **npm** or **yarn**
- **PostgreSQL** (for production) or SQLite (for development)
- **Redis** (optional, for caching)
- **AI API Key**: Either OpenAI or Anthropic

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd autism-assistant

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
# Required:
#   - AI_PROVIDER (openai or anthropic)
#   - OPENAI_API_KEY or ANTHROPIC_API_KEY
#   - DATABASE_URL
```

**Example `.env` configuration:**

```env
# AI Provider
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
AI_MODEL=gpt-4-turbo-preview

# Database
DATABASE_URL=postgresql://localhost:5432/autism_assistant

# Server
PORT=3000
NODE_ENV=development
```

### Step 3: Configure Frontend

```bash
cd ../frontend

# Copy environment template
cp .env.example .env

# Default configuration should work for local development
VITE_API_URL=http://localhost:3000/api/v1
```

### Step 4: Set Up Database

```bash
cd backend

# Run database migrations (coming soon)
# npm run migrate

# Seed initial terminology data (coming soon)
# npm run seed
```

### Step 5: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

## 🧪 Development

### Backend Commands

```bash
cd backend

npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Lint code
npm test             # Run tests
```

### Frontend Commands

```bash
cd frontend

npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm test             # Run tests
```

## 🎯 Core Features

### 1. Term Explanation
Ask about any autism-related term and get a plain-language explanation:
```
User: "What is echolalia?"
Assistant: "Echolalia is when your child repeats words or phrases they've heard..."
```

### 2. Contextual Clarification
Paste a document excerpt for contextual explanations:
```
User: "From my child's IEP: 'Student demonstrates echolalia and requires AAC supports'"
Assistant: [Explains both terms in the context of the IEP]
```

### 3. Conversational Interaction
Ask follow-up questions naturally:
```
User: "Can you explain that more simply?"
User: "What are some examples?"
```

### 4. Safety Boundaries
Automatically detects and redirects medical advice requests:
```
User: "Should I change my child's medication?"
Assistant: [Polite redirection to healthcare professionals]
```

## 🔒 Privacy & Security

- **No PII Storage:** Conversations are not saved
- **Stateless Design:** Each session is independent
- **No Medical Advice:** Strong filtering and clear disclaimers
- **HTTPS Only:** Encrypted communication
- **Rate Limiting:** Protection against abuse

## 📊 Technology Stack

### Backend
- **Runtime:** Node.js v20 with TypeScript
- **Framework:** Express.js
- **AI:** OpenAI GPT-4 / Anthropic Claude
- **Database:** PostgreSQL (production), SQLite (dev)
- **Caching:** Redis
- **Logging:** Winston

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Testing:** Vitest

### Infrastructure (Production)
- **Cloud:** AWS
- **Compute:** Lambda / ECS
- **Database:** RDS PostgreSQL
- **Caching:** ElastiCache Redis
- **CDN:** CloudFront

## 📖 Knowledge Base

The system includes a curated knowledge base of 200+ autism-related terms:

- **Categories:** Therapy, Education, Communication, Sensory, Behavior, Social, Cognitive
- **Each term includes:**
  - Plain-language definition
  - Real-world examples
  - Related terms
  - Relevant document types

See `knowledge-base/terms-starter.json` for the initial 10 terms.

## 🧩 API Endpoints

### Query Endpoints
- `POST /api/v1/query/term` - Simple term lookup
- `POST /api/v1/query/context` - Contextual explanation

### Conversation Endpoints
- `POST /api/v1/conversation` - Multi-turn conversation

### Utility Endpoints
- `POST /api/v1/feedback` - Submit user feedback
- `GET /health` - Health check

### Example API Call

```javascript
// Query a term
const response = await fetch('http://localhost:3000/api/v1/query/term', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ term: 'echolalia' })
});

const data = await response.json();
console.log(data.explanation);
```

## 🎨 UI Components

### Core Components
- `ChatInterface` - Main conversation UI
- `MessageList` - Display conversation history
- `MessageInput` - User input with send button
- `Disclaimer` - Safety disclaimer modal
- `Header` / `Footer` - Navigation and info

### Accessibility Features
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- High contrast mode
- Responsive design

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

## 📝 Contributing

This project is in active development. Key areas for contribution:
1. Expanding the knowledge base (adding more terms)
2. Improving AI prompt engineering
3. Enhancing accessibility features
4. Adding multilingual support

## 📜 License

UNLICENSED - Private project

## 👥 Team

**Project Lead:** Sai Prashanthi Vemula

## 🔗 Resources

- [Project Documentation](./docs/)
- [System Architecture](./docs/05_System_Architecture.md)
- [User Stories](./docs/04_User_Stories_And_Acceptance_Criteria.md)
- [Implementation Roadmap](./docs/03_Implementation_Roadmap.md)

## 🆘 Support

For questions or issues:
1. Check the [documentation](./docs/)
2. Review [troubleshooting guide](#troubleshooting)
3. Contact the project team

## 🚧 Roadmap

### Phase 1: MVP (Current - Month 3)
- ✅ Core backend infrastructure
- ✅ Frontend UI
- ✅ AI integration
- ⏳ Database setup
- ⏳ API endpoints implementation
- ⏳ Testing and deployment

### Phase 2: Enhancement (Months 4-6)
- Expand to 500+ terms
- Improve AI accuracy
- User feedback system
- Performance optimization

### Phase 3: Scale (Months 7-12)
- Mobile applications
- Document upload feature
- Multilingual support (Spanish)
- Public API

---

## Troubleshooting

### Backend won't start
- Check that Node.js v20+ is installed: `node --version`
- Verify AI API key is set in `.env`
- Ensure port 3000 is not in use

### Frontend won't connect to backend
- Verify backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env`
- Check browser console for CORS errors

### AI responses failing
- Verify API key is correct
- Check API provider status
- Review logs in `backend/logs/`

### Database connection errors
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check database credentials

---

**Built with ❤️ for the autism community**
