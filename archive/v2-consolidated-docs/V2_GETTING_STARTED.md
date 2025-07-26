# Quest Core V2 - Getting Started Guide

🚀 **Welcome to Quest Core V2** - Build the same sophisticated AI platform in 10% of the code!

## Quick Start (5 Minutes)

1. **Clone and Setup**
   ```bash
   git clone https://github.com/yourusername/quest-core-v2.git
   cd quest-core-v2
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys (see V2_ENVIRONMENT_SETUP.md)
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## Essential V2 Documents

📖 **Read These First:**
- [V2_ENVIRONMENT_SETUP.md](./V2_ENVIRONMENT_SETUP.md) - Complete environment configuration
- [QUEST_CORE_V2_METHODOLOGY.md](./QUEST_CORE_V2_METHODOLOGY.md) - Development methodology
- [CLAUDE.md](./CLAUDE.md) - AI assistant context (CRITICAL)

📚 **Deep Dive:**
- [QUEST_CORE_V2_IMPLEMENTATION_GUIDE.md](./QUEST_CORE_V2_IMPLEMENTATION_GUIDE.md) - Step-by-step implementation
- [QUEST_CORE_V2_COMPLETE_LEARNINGS.md](./QUEST_CORE_V2_COMPLETE_LEARNINGS.md) - All lessons from V1

## V2 Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Next.js 15 + TypeScript + Tailwind
- ✅ Clerk authentication
- ✅ Neon PostgreSQL + Prisma
- ✅ LinkedIn scraping with Apify
- ✅ Deploy to Vercel

### Phase 2: Enhanced Registration (Week 2-3)
- 🔄 Apify MCP integration
- 🔄 n8n workflow orchestration
- 🔄 "Shock & Awe" multi-platform scraping

### Phase 3: Multi-Model Intelligence (Month 1)
- 🔄 Zen MCP for multi-model collaboration
- 🔄 Complex decision support
- 🔄 Advanced problem solving

## Key V2 Principles

1. **Simple First, Scale Later** - Start with working code
2. **Use What Works** - Proven patterns from V1
3. **Fast Feedback Loops** - Deploy early and often
4. **Validation Gates** - Quality checkpoints
5. **Context Engineering** - PRP framework for features

## Prerequisites

- Node.js 18+
- Git
- VS Code (recommended)
- Vercel account
- Database: Neon PostgreSQL

## API Keys Needed

- Clerk (authentication)
- Neon (database)
- Apify (LinkedIn scraping)
- OpenRouter (AI)
- Vercel (deployment)

See [V2_ENVIRONMENT_SETUP.md](./V2_ENVIRONMENT_SETUP.md) for detailed setup.

## Development Workflow

1. **New Feature Process:**
   ```bash
   # 1. Create feature PRP
   /prps/features/[feature-name]/initial.md
   
   # 2. Generate PRP with AI
   # 3. Validate PRP
   # 4. Execute implementation
   # 5. Run validation gates
   ```

2. **Validation Gates:**
   ```bash
   npm run build       # TypeScript compilation
   npm run typecheck   # Type checking
   npm run lint        # Linting
   npm test           # Unit tests
   ```

## Success Metrics

- **Day 1**: LinkedIn import working
- **Week 1**: Deployed and usable
- **Week 2**: Enhanced registration
- **Month 1**: Full feature parity in 10% code

## Getting Help

1. **Check CLAUDE.md** - Most answers are there
2. **Review V2 Complete Learnings** - Common issues solved
3. **Use PRP framework** - For systematic development
4. **GitHub Issues** - For bugs and feature requests

## What's Different in V2?

✅ **Simplified:**
- 10% of V1's code (~4,000 lines vs 42,000)
- Direct API calls (no complex abstractions)
- Proven patterns only
- Clear module boundaries

✅ **Enhanced:**
- Multi-platform scraping (Phase 2)
- Multi-model AI collaboration (Phase 3)
- Better validation and testing
- Comprehensive documentation

✅ **Faster:**
- Auto-fix system for TypeScript errors
- PRP framework for features
- Ready-to-use templates
- Proven development workflow

---

**Ready to build? Start with Phase 1 and follow the methodology!** 🚀