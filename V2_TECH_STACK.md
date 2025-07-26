# Quest Core V2 - Complete Technology Stack

> **Comprehensive reference of all technologies, services, and tools used in Quest Core V2**

Last Updated: 2025-07-26

---

## 📋 Table of Contents

1. [Core Technologies](#core-technologies)
2. [AI & Voice Services](#ai--voice-services)
3. [Data & Storage](#data--storage)
4. [Scraping & Automation](#scraping--automation)
5. [Authentication & Security](#authentication--security)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Testing Frameworks](#testing-frameworks)
8. [Development Tools](#development-tools)
9. [MCP Servers](#mcp-servers)
10. [Design & UI](#design--ui)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Future/Planned Technologies](#futureplanned-technologies)

---

## 🎯 Core Technologies

### Next.js 15
- **Purpose**: Full-stack React framework for production
- **Version**: 15.x (App Router, Server Components)
- **Website**: https://nextjs.org/
- **Documentation**: https://nextjs.org/docs
- **Key Features Used**:
  - App Router with nested layouts
  - Server Components for performance
  - API Routes for backend logic
  - Middleware for auth protection
- **Related Files**: `next.config.js`, `app/` directory

### React 18
- **Purpose**: UI component library
- **Version**: 18.x (with Concurrent Features)
- **Website**: https://react.dev/
- **Documentation**: https://react.dev/learn
- **Key Features Used**:
  - Server Components
  - Suspense boundaries
  - Concurrent rendering
- **Related Files**: All `.tsx` components

### TypeScript
- **Purpose**: Type-safe JavaScript
- **Version**: 5.x
- **Website**: https://www.typescriptlang.org/
- **Documentation**: https://www.typescriptlang.org/docs/
- **Configuration**: Strict mode enabled
- **Related Files**: `tsconfig.json`

### Tailwind CSS
- **Purpose**: Utility-first CSS framework
- **Version**: 3.x
- **Website**: https://tailwindcss.com/
- **Documentation**: https://tailwindcss.com/docs
- **Custom Config**: Quest design system tokens
- **Related Files**: `tailwind.config.js`, `globals.css`

---

## 🤖 AI & Voice Services

### OpenRouter
- **Purpose**: AI gateway for multi-model routing and cost optimization
- **Website**: https://openrouter.ai/
- **Documentation**: https://openrouter.ai/docs
- **Models Used**:
  - GPT-4 Turbo (Master Coach)
  - Claude-3 Sonnet (Career/Network Coach)
  - Gemini Pro (Leadership Coach)
- **Cost Savings**: 40-60% vs direct API calls
- **Related Files**: `OPENROUTER_INTEGRATION.md`

### Hume AI EVI
- **Purpose**: Empathic voice conversations with emotional intelligence
- **Website**: https://www.hume.ai/
- **Documentation**: https://dev.hume.ai/docs
- **Key Features**:
  - Real-time voice processing
  - Emotional context understanding
  - WebSocket integration
- **Related Files**: `components/voice/`, `VOICE_INTEGRATION_SUCCESS.md`

### Zep
- **Purpose**: Long-term memory management for AI conversations
- **Website**: https://www.getzep.com/
- **Documentation**: https://docs.getzep.com/
- **Key Features**:
  - Temporal knowledge graphs
  - Fact extraction
  - Session management
- **Related Files**: `ZEP_INTEGRATION.md`

### PocketFlow
- **Purpose**: Rapid AI prototyping and experimentation
- **Website**: https://github.com/pocketflow/pocketflow
- **Documentation**: https://pocketflow.dev/docs
- **Use Cases**:
  - Multi-agent debates
  - Rapid coaching pattern testing
  - Python microservices
- **Related Files**: `POCKETFLOW_EVALUATION.md`

---

## 💾 Data & Storage

### PostgreSQL (Neon)
- **Purpose**: Primary relational database
- **Website**: https://neon.tech/
- **Documentation**: https://neon.tech/docs
- **Features**:
  - Serverless Postgres
  - Branching for development
  - Auto-scaling
- **Related Files**: `prisma/schema.prisma`

### Prisma
- **Purpose**: Type-safe database ORM
- **Version**: 5.x
- **Website**: https://www.prisma.io/
- **Documentation**: https://www.prisma.io/docs
- **Features**:
  - Schema-first development
  - Migrations
  - Type generation
- **Related Files**: `prisma/`, `lib/prisma.ts`

### Neo4j (Future)
- **Purpose**: Graph database for professional relationships
- **Website**: https://neo4j.com/
- **Documentation**: https://neo4j.com/docs/
- **Planned Use**: Trinity connections, network analysis
- **Status**: Planned for Phase 3

---

## 🕷️ Scraping & Automation

### Apify
- **Purpose**: Web scraping platform for professional data
- **Website**: https://apify.com/
- **Documentation**: https://docs.apify.com/
- **Actors Used**:
  - LinkedIn Profile Scraper
  - Twitter/X Scraper
  - GitHub Profile Scraper
  - Reddit Scraper
- **Related Files**: `APIFY_INTEGRATION_FIX.md`, `APIFY_SOLUTIONS.md`

### n8n (Planned)
- **Purpose**: Workflow automation for data orchestration
- **Website**: https://n8n.io/
- **Documentation**: https://docs.n8n.io/
- **Use Cases**:
  - Multi-platform scraping orchestration
  - Rate limit handling
  - Visual workflow debugging
- **Status**: Planned MCP integration

---

## 🔐 Authentication & Security

### Clerk
- **Purpose**: User authentication and management
- **Website**: https://clerk.com/
- **Documentation**: https://clerk.com/docs
- **Features**:
  - Social login (Google, GitHub)
  - User profiles
  - Session management
  - Webhooks for user sync
- **Related Files**: `middleware.ts`, `app/api/clerk-webhook/`

### Semgrep (Planned)
- **Purpose**: Static analysis security scanning
- **Website**: https://semgrep.dev/
- **Documentation**: https://semgrep.dev/docs/
- **Rules**: 5,000+ vulnerability patterns
- **Status**: Planned MCP integration

---

## 📊 Monitoring & Analytics

### Checkly
- **Purpose**: Synthetic monitoring and testing
- **Website**: https://www.checklyhq.com/
- **Documentation**: https://www.checklyhq.com/docs/
- **Features**:
  - API monitoring
  - Browser checks
  - Vercel integration
- **Related Files**: `.checkly/`

### HyperDX
- **Purpose**: Unified observability platform
- **Website**: https://www.hyperdx.io/
- **Documentation**: https://docs.hyperdx.io/
- **Features**:
  - Logs, metrics, traces
  - Session replay
  - Error tracking
- **Status**: Backup monitoring solution

### OpenTelemetry (Future)
- **Purpose**: Observability framework
- **Website**: https://opentelemetry.io/
- **Documentation**: https://opentelemetry.io/docs/
- **Use Case**: Distributed tracing for AI calls
- **Status**: Future implementation

---

## 🧪 Testing Frameworks

### Vitest
- **Purpose**: Unit testing framework (4x faster than Jest)
- **Website**: https://vitest.dev/
- **Documentation**: https://vitest.dev/guide/
- **Features**:
  - ESM first
  - TypeScript support
  - React Testing Library integration
- **Related Files**: `vitest.config.ts`

### Playwright
- **Purpose**: E2E testing and browser automation
- **Website**: https://playwright.dev/
- **Documentation**: https://playwright.dev/docs/intro
- **Features**:
  - Cross-browser testing
  - Visual regression
  - Accessibility testing
- **Related Files**: `playwright.config.ts`, `e2e/`

### Testing Library
- **Purpose**: React component testing utilities
- **Website**: https://testing-library.com/
- **Documentation**: https://testing-library.com/docs/react-testing-library/intro/
- **Packages**:
  - @testing-library/react
  - @testing-library/jest-dom
  - @testing-library/user-event

---

## 🛠️ Development Tools

### Zustand
- **Purpose**: Lightweight state management
- **Website**: https://zustand-demo.pmnd.rs/
- **Documentation**: https://github.com/pmndrs/zustand
- **Use Cases**:
  - Coach conversation state
  - UI preferences
  - Complex form state
- **Related Files**: `stores/`

### React Query (TanStack Query)
- **Purpose**: Server state management
- **Website**: https://tanstack.com/query/latest
- **Documentation**: https://tanstack.com/query/latest/docs/react/overview
- **Features**:
  - Data caching
  - Background refetching
  - Optimistic updates

### React Force Graph
- **Purpose**: 3D network visualizations
- **Website**: https://github.com/vasturiano/react-force-graph
- **Documentation**: https://github.com/vasturiano/react-force-graph#readme
- **Use Cases**:
  - Trinity visualizations
  - Professional network graphs
- **Related Files**: `components/three/`

### Three.js
- **Purpose**: 3D graphics library
- **Website**: https://threejs.org/
- **Documentation**: https://threejs.org/docs/
- **Use Cases**:
  - Professional Mirror timeline
  - 3D sphere visualizations

### Framer Motion
- **Purpose**: Animation library
- **Website**: https://www.framer.com/motion/
- **Documentation**: https://www.framer.com/docs/
- **Use Cases**:
  - Page transitions
  - Component animations
  - Gesture handling

---

## 🔌 MCP Servers

### REF MCP
- **Purpose**: Smart documentation with 85% token reduction
- **Status**: Phase 1 - Immediate implementation
- **Repository**: https://github.com/ref-tools/ref-tools-mcp
- **Benefits**:
  - Session-aware search
  - Smart chunking
  - Cost optimization

### Playwright MCP
- **Purpose**: AI-graded UI testing
- **Status**: Phase 1 - Immediate implementation
- **Repository**: https://github.com/microsoft/playwright-mcp
- **Use Cases**:
  - Style guide compliance
  - Accessibility validation
  - Visual regression

### Semgrep MCP
- **Purpose**: Security vulnerability scanning
- **Status**: Phase 2 - Before user data
- **Repository**: https://github.com/semgrep/semgrep-mcp
- **Rules**: 5,000+ security patterns

### Apify MCP
- **Purpose**: Enhanced web scraping
- **Status**: Phase 2 - High priority
- **Integration**: Access to 5,000+ scrapers

### n8n MCP
- **Purpose**: Workflow automation
- **Status**: Phase 2 - High priority
- **Use Cases**: Scraping orchestration

### Zen MCP
- **Purpose**: Multi-model AI collaboration
- **Status**: Phase 3 - Scale phase
- **Use Cases**: Trinity analysis with different models

### Pieces MCP
- **Purpose**: Developer memory and context
- **Status**: Phase 3 - Team scaling
- **Repository**: https://github.com/pieces-app/pieces-mcp
- **Token overhead**: ~500-1000 per interaction

---

## 🎨 Design & UI

### GT Walsheim Font
- **Purpose**: Primary typography
- **License**: Commercial license required
- **Fallback**: System UI fonts
- **Usage**: Headers and body text

### thesys.dev C1 API
- **Purpose**: Generative UI and adaptive interfaces
- **Website**: https://thesys.dev/
- **Documentation**: https://docs.thesys.dev/c1
- **Features**:
  - Real-time UI generation
  - Context-aware layouts
  - Claude-3 Sonnet powered
- **Related Files**: `GENERATIVE_UI.md`

### Design Tokens
- **Purpose**: Consistent design system
- **Colors**:
  - Primary: #00D4B8 (Aurora Fade)
  - Secondary: #4F46E5 (Electric Violet)
  - Accent: #8B5CF6 (Purple)
- **Related Files**: `DESIGN_TOKENS.md`, `V2_STYLE_GUIDE.md`

---

## 🚀 Deployment & Infrastructure

### Vercel
- **Purpose**: Hosting and deployment
- **Website**: https://vercel.com/
- **Documentation**: https://vercel.com/docs
- **Features**:
  - Edge functions
  - Preview deployments
  - Analytics
  - Auto-fix integration
- **Related Files**: `vercel.json`

### GitHub Actions
- **Purpose**: CI/CD and automation
- **Website**: https://github.com/features/actions
- **Documentation**: https://docs.github.com/en/actions
- **Workflows**:
  - Auto-fix deployment
  - Type checking
  - Linting
- **Related Files**: `.github/workflows/`

### MCP-Vercel Integration
- **Purpose**: Deployment monitoring and auto-fixing
- **Features**:
  - Real-time status
  - Automatic error detection
  - Claude Code integration
- **Related Files**: `AUTO_FIX_SYSTEM.md`

---

## 🔮 Future/Planned Technologies

### LangChain (Evaluation)
- **Purpose**: LLM application framework
- **Status**: Under evaluation
- **Alternative**: Current OpenRouter + Zep solution

### Vector Database (TBD)
- **Purpose**: Embedding storage for semantic search
- **Options**: Pinecone, Weaviate, Qdrant
- **Status**: Evaluating need

### Redis (Potential)
- **Purpose**: Caching and session storage
- **Use Case**: High-performance caching layer
- **Status**: If performance requires

### Temporal (Potential)
- **Purpose**: Workflow orchestration
- **Use Case**: Complex multi-step AI workflows
- **Status**: If n8n insufficient

---

## 📚 Documentation References

### Internal Documentation
- `CLAUDE.md` - AI assistant context
- `V2_MCP_INTEGRATION_STRATEGY.md` - MCP roadmap
- `GENERATIVE_UI.md` - thesys.dev patterns
- `DESIGN_SYSTEM.md` - Visual standards
- `DATA_ARCHITECTURE.md` - Data flow strategy

### External Resources
- [Quest Core Manifesto](./QUEST_CORE_MANIFESTO.md)
- [V2 Style Guide](./V2_STYLE_GUIDE.md)
- [Implementation Guide](./QUEST_CORE_V2_IMPLEMENTATION_GUIDE.md)

---

## 🔧 Version Management

### Package Management
- **npm**: Primary package manager
- **Node.js**: v18+ required
- **Package.json**: Central dependency management

### Version Control
- **Git**: Source control
- **GitHub**: Repository hosting
- **Branching**: Feature branches → main

---

## 💡 Quick Reference

### Essential Environment Variables
```env
# Database
DATABASE_URL=             # Neon PostgreSQL

# Authentication  
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# AI Services
OPEN_ROUTER_API_KEY=      # AI Gateway
HUME_API_KEY=            # Voice AI
HUME_CLIENT_SECRET=

# Scraping
APIFY_API_TOKEN=         # Web scraping

# Future
ZEP_API_KEY=             # Memory (pending)
THESYS_API_KEY=          # Generative UI (future)
```

### Key Commands
```bash
npm run dev              # Development
npm run build            # Production build
npm run lint             # Linting
npm run type-check       # TypeScript check
npx prisma studio        # Database GUI
npm run test             # Vitest
npm run e2e              # Playwright
```

---

**Last Updated**: 2025-07-26  
**Maintained By**: Quest Core Development Team

*This document serves as the single source of truth for all technologies used in Quest Core V2.*