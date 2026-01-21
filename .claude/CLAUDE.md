# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **documentation repository** for the AI-Powered Parent Assistant for Autism project. It contains comprehensive planning documents but no actual code implementation. The repository is in the **Concept & Planning Phase**.

## Document Structure

The repository contains a complete project documentation package organized as follows:

### Core Documents (Read in Order)

1. **00_Executive_Summary_and_Index.md** - Start here for project overview and navigation
2. **01_Project_Specification.md** - Problem definition, scope, and success criteria
3. **02_Technical_Requirements.md** - Functional and non-functional requirements
4. **03_Implementation_Roadmap.md** - 12-month phased implementation plan
5. **04_User_Stories_And_Acceptance_Criteria.md** - 6 epics with detailed acceptance criteria
6. **05_System_Architecture.md** - Complete technical architecture and design decisions

### Document Relationships

```
Executive Summary (00)
        ↓
    ┌───┴───┬───────────┬──────────┐
    ↓       ↓           ↓          ↓
Spec (01) Tech Req (02) Roadmap (03) Stories (04)
    ↓       ↓           ↓          ↓
    └───┬───┴───────────┴──────────┘
            ↓
    Architecture (05)
```

## Project Context

### What This Project Is
An AI-powered conversational assistant to help parents of children on the autism spectrum understand complex terminology from IEPs, therapy notes, and assessment reports through plain-language explanations.

### Key Constraints
- **Educational Focus Only:** Never provides medical advice or diagnosis
- **Privacy-First:** Stateless design, no personal data storage
- **Target Audience:** Parents and caregivers (non-clinical users)
- **MVP Timeline:** 3 months to launch with 200 terms

### Technology Stack (Planned)
- **Frontend:** React.js with TypeScript, Tailwind CSS
- **Backend:** Node.js with Express/Fastify, serverless (AWS Lambda)
- **AI/NLP:** OpenAI GPT-4 Turbo or Anthropic Claude 3
- **Data:** PostgreSQL (structured), Pinecone (vector search), Redis (caching)
- **Infrastructure:** AWS cloud-native, auto-scaling architecture

## Working with This Repository

### When Analyzing Documents

**Priority Reading Order by Role:**

- **Executives:** 00 (Executive Summary) → 01 (Sections 1-3) → 03 (Roadmap Overview)
- **Product Managers:** 01 (Spec) → 04 (User Stories) → 03 (Roadmap)
- **Engineers:** 02 (Tech Requirements) → 05 (Architecture) → 04 (Acceptance Criteria)
- **Designers:** 04 (Epic 5: UX) → 01 (Section 5-6) → 02 (Section 3.2: Usability)

### Key Architectural Decisions (from Section 05)

**Core Services:**
- Query Service (term lookup)
- Context Manager (conversation state)
- Safety Filter (medical advice boundary detection)
- Knowledge Base Service (database access)
- AI Service (LLM integration)

**API Structure:**
```
POST /api/v1/query/term           # Simple term lookup
POST /api/v1/query/context        # Contextual explanation from document
POST /api/v1/conversation/        # Multi-turn conversation
POST /api/v1/feedback/            # User feedback
```

**Safety Boundaries:**
- Filter detects medical advice requests
- Responds with disclaimers and professional referral suggestions
- Never stores PII or medical information

### Understanding Project Scope

**MVP Includes (3 Months):**
- 200 common autism terms with plain-language explanations
- Simple term lookup
- Contextual clarification from document excerpts
- Multi-turn conversational interaction
- Safety filters for medical advice boundaries

**Explicitly Out of Scope:**
- Medical diagnosis or treatment recommendations
- Storage of personal or medical data
- Real-time healthcare system integration
- Mobile apps (Phase 3, months 7-12)

### Success Metrics

**Primary KPIs:**
- 85%+ parents report improved understanding
- 4.0/5.0+ user satisfaction rating
- 60%+ complete multi-turn conversations
- 95%+ expert validation of explanations
- < 3 second response time

## Document Content Guidelines

### When Creating New Documents
- Follow the established document structure (headers, sections, tables)
- Include version number, date, and status in header
- Use markdown formatting consistently
- Reference other documents using their numeric prefix (e.g., "See 02_Technical_Requirements.md")

### When Modifying Existing Documents
- Update version history table at the bottom
- Maintain consistent terminology (see Appendix: Key Terms Reference in 00)
- Ensure cross-references remain valid
- Update the Executive Summary index if structure changes

## Critical Information

### Privacy and Ethics
- **No PII:** This assistant never collects or stores personal information
- **Stateless Design:** Each conversation is independent, no persistent user data
- **Medical Boundaries:** Strong filters prevent providing medical advice
- **Transparency:** Clear disclaimers about limitations

### User Experience Principles (from 01_Project_Specification.md)
1. **Empathy First:** Acknowledge the emotional journey of autism parents
2. **Plain Language:** Explain complex terms in simple, accessible language
3. **Non-judgmental:** Never assume user knowledge level
4. **Contextual:** Understand different document types (IEP vs. therapy notes)
5. **Accessible:** WCAG 2.1 AA compliance, screen reader support

### Technical Priorities (from 02_Technical_Requirements.md)
1. **Performance:** Sub-3-second response time (95th percentile)
2. **Reliability:** 99.5% uptime target
3. **Security:** HTTPS, rate limiting, input validation
4. **Scalability:** Auto-scaling to handle 1,000+ concurrent users
5. **Monitoring:** Comprehensive logging and alerting

## Implementation Phases

### Phase 1: MVP (Months 1-3)
**Deliverable:** Functional web application with 200 terms, 3 core capabilities
- Month 1: Research & Design
- Month 2: Core Development (backend, AI integration, knowledge base)
- Month 3: Frontend, Testing & Launch

### Phase 2: Enhancement (Months 4-6)
- Expand to 500+ terms
- Improve AI accuracy
- Add user-requested features
- Scale infrastructure

### Phase 3: Scale & Diversify (Months 7-12)
- Mobile applications (iOS & Android)
- Document upload capability
- Multilingual support (Spanish)
- Public API for integrations

## Common Terminology

**Autism-Specific:**
- IEP: Individualized Education Program
- ABA: Applied Behavior Analysis
- OT: Occupational Therapy
- ST: Speech Therapy
- Sensory Processing: How the brain receives and responds to sensory information

**Technical:**
- LLM: Large Language Model (GPT-4, Claude)
- NLP: Natural Language Processing
- Vector DB: Database for semantic similarity search
- Embedding: Numerical representation of text for AI
- RAG: Retrieval-Augmented Generation

## Next Steps for Implementation

If code implementation begins, the following structure is recommended (from 05_System_Architecture.md):

### Frontend Structure
```
src/
├── components/
│   ├── Chat/           # Chat interface components
│   ├── Explanation/    # Term display components
│   ├── Document/       # Document excerpt handling
│   └── Common/         # Shared components
├── hooks/              # React hooks
├── services/           # API clients
└── utils/              # Helpers and validators
```

### Backend Structure
```
src/
├── api/
│   ├── routes/         # API endpoints
│   └── middleware/     # Auth, validation, rate limiting
├── services/           # Business logic
│   ├── QueryService.ts
│   ├── ContextService.ts
│   ├── AIService.ts
│   ├── SafetyService.ts
│   └── KnowledgeBaseService.ts
├── models/             # Data models
└── utils/              # Prompt templates, validators
```

## References

- **Project Lead:** Sai Prashanthi Vemula
- **Documentation Version:** 1.0
- **Last Updated:** January 2026
- **Status:** Planning Phase - Awaiting Approval
