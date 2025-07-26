# Quest Core V2 - Complete Methodology Guide

*Cole Meddin's Context Engineering + Our Learnings = The Ultimate Implementation Playbook*

## 🎯 V2 Philosophy: Manifesto-Driven Development

Build a revolutionary professional awakening platform in 10% of the code by:
1. **Living our Trinity** - Every decision filtered through Quest/Service/Pledge alignment
2. **Making users earn their Quest** through story reflection (never "registration")
3. **Following proven patterns** from V1 combined with manifesto principles
4. **Applying Cole Meddin's context engineering** with sacred purpose
5. **Creating genuine "shock and awe" experiences** that honor human dignity

### Core Innovation: Story → Trinity → Quest
Users don't "sign up" - they discover their professional Trinity (Quest/Service/Pledge) through guided reflection on their career story. Not everyone is ready for their Quest immediately, and that's by design.

### Manifesto-Driven Development Process
1. Read **QUEST_CORE_MANIFESTO.md** for philosophical foundation
2. Consult **QUEST_CORE_TRINITY.md** for organizational purpose
3. Apply **Trinity Filter** to every technical decision:
   - Quest Check: Does this advance professional awakening?
   - Service Check: Does this honor human dignity?  
   - Pledge Check: Does this maintain our sacred commitments?

## 📂 V2 Repository Structure

```
quest-core-v2/
├── README.md                   # Project overview
├── CLAUDE.md                   # AI assistant context (THIS FILE IS CRITICAL)
├── PRODUCT_REQUIREMENTS.md     # Feature specifications
├── DEVELOPMENT.md              # Technical guidelines
├── CONTEXT_ENGINEERING.md      # Context patterns
├── .env.example               # Environment template
├── src/
│   ├── app/                   # Next.js 15 app directory
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # Protected pages
│   │   ├── api/              # API routes
│   │   ├── register/         # Registration flow
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components
│   │   ├── features/        # Feature components
│   │   └── layouts/         # Layout components
│   ├── lib/                 # Core utilities
│   │   ├── auth.ts         # Clerk helpers
│   │   ├── db.ts           # Prisma client
│   │   ├── ai/             # AI integrations
│   │   ├── scraping/       # Apify integration
│   │   └── context/        # Context management
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
├── public/                # Static assets
├── docs/                  # Documentation
└── tests/                 # Test files
```

## 🧠 Cole Meddin's Context Engineering Architecture

### Four-Layer Context System (MUST IMPLEMENT)

```typescript
// src/lib/context/layers.ts
export enum ContextLayer {
  DEEP = 'deep',       // Core identity, Trinity, long-term patterns
  PERSONAL = 'personal', // Private goals, challenges, development
  WORKING = 'working',   // Current session, active context
  SURFACE = 'surface'    // Public profile, shared achievements
}

// Each layer has different:
// - Privacy levels
// - Storage strategies
// - Access patterns
// - Update frequencies
```

### Four Types of Intelligence

```typescript
// src/lib/context/intelligence.ts
interface IntelligenceTypes {
  semantic: {
    // Vector embeddings for content
    embeddings: OpenAIEmbeddings;
    search: (query: string) => Promise<Match[]>;
  };
  relational: {
    // Graph relationships
    neo4j?: Neo4jDriver; // Only if needed
    findConnections: (userId: string) => Promise<Connection[]>;
  };
  temporal: {
    // Time-aware context
    trackProgression: (userId: string, metric: string) => void;
    getTimeline: (userId: string) => Promise<Timeline>;
  };
  multiModal: {
    // Voice, text, visual
    voice: HumeAI;
    text: OpenRouter;
    visual?: ThreeJS; // For 3D viz
  };
}
```

## 📋 Required Files for V2

### 1. CLAUDE.md (CRITICAL - Copy from V1 and update)
```markdown
# Claude - AI Assistant Context

You are Claude, an AI assistant helping to build Quest Core...

## CONSTANT RULES (Rarely Change)
- Project name and vision
- Core architecture decisions
- Naming conventions
- Security principles
- Code style guidelines

## PROJECT STATE (Update Regularly)
- Current phase of development
- Recently completed features
- Known issues/blockers
- Next priorities

## PROVEN PATTERNS (Add As Discovered)
- Successful API patterns
- UI component patterns
- Integration patterns
- Error handling patterns

## COMMON GOTCHAS (Learn From Mistakes)
- Apify data in items[0].element
- Clerk user sync required
- Environment variable formats
- TypeScript strict mode issues

## DO NOT INCLUDE HERE
- Feature-specific logic (use PRPs)
- Temporary workarounds
- One-off solutions
- External API keys
```

### 2. PRODUCT_REQUIREMENTS.md
```markdown
# Quest Core Product Requirements

## Vision
AI-powered professional development platform...

## Core Features
1. LinkedIn "Shock & Awe" Registration
2. 4-Layer Repository System
3. AI Multi-Coach System
4. Trinity Framework
5. Working Repository

## User Journey
[Map complete user flow]

## Success Metrics
[Define measurable outcomes]
```

### 3. DEVELOPMENT.md
```markdown
# Development Guidelines

## Setup
1. Clone repository
2. Install dependencies
3. Configure environment
4. Run migrations
5. Start development

## Coding Standards
- TypeScript strict mode
- Functional components
- Composition over inheritance
- Error boundaries
- Loading states

## Testing Strategy
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows
```

### 4. CONTEXT_ENGINEERING.md
```markdown
# Context Engineering Patterns

## Implementation Strategy
1. Start with Working Repo (immediate value)
2. Add Personal Repo (user goals)
3. Implement Surface Repo (public profile)
4. Build Deep Repo (AI insights)

## Context Flow
User Action → Working Context → AI Processing → Update Repos
```

## 🏗️ V2 Implementation Methodology

### Phase 1: Foundation (3 hours)
```typescript
// 1. Next.js + TypeScript + Tailwind
npx create-next-app@latest quest-core-v2 --typescript --tailwind --app

// 2. Essential packages only
npm install @clerk/nextjs prisma @prisma/client apify-client

// 3. Database schema (start minimal)
model User {
  id       String @id @default(cuid())
  clerkId  String @unique
  email    String @unique
  profile  Profile?
}

model Profile {
  id          String @id @default(cuid())
  userId      String @unique
  linkedinUrl String?
  linkedinData Json?
}

// 4. Environment variables
DATABASE_URL=
CLERK_SECRET_KEY=
APIFY_TOKEN=

// 5. Deploy immediately
vercel --prod
```

### Phase 2: LinkedIn Import (2 hours)
```typescript
// THE KEY LEARNING: items[0].element
const profile = items[0].element; // NOT items[0]

// Simple implementation first
export async function POST(req: Request) {
  const { linkedinUrl } = await req.json();
  const profile = await scrapeLinkedIn(linkedinUrl);
  await saveProfile(profile);
  return Response.json({ success: true });
}
```

### Phase 3: Repository System (1 day)
```typescript
// Start with Working Repo only
interface WorkingRepo {
  projects: Project[];
  access: AccessControl;
  analytics: ViewAnalytics;
}

// Add other repos as needed
// Don't build all 4 layers upfront!
```

### Phase 4: AI Integration (1 day)
```typescript
// Start with one coach
const careerCoach = new Coach({
  model: 'claude-3-sonnet',
  systemPrompt: CAREER_COACH_PROMPT,
  context: userContext
});

// Add others incrementally
// Test each thoroughly
```

## 🎨 Design System Integration

### Brand Tokens (from V1)
```css
:root {
  /* Quest Colors */
  --aurora-fade: #00D4B8;
  --electric-violet: #4F46E5;
  --deep-purple: #8B5CF6;
  
  /* Typography */
  --font-display: 'GT Walsheim', sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI';
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
}
```

### Component Patterns
```typescript
// Consistent component structure
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export function Component({ className, children }: ComponentProps) {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
}
```

## 🚀 V2 Development Principles

### 1. **Sequential Implementation**
- Complete one feature fully before starting next
- Test with real data immediately
- Deploy after each feature

### 2. **Module Approach**
```typescript
// Each feature is a module
// src/lib/features/linkedin-import/
├── api.ts        // API logic
├── components.tsx // UI components
├── types.ts      // TypeScript types
└── utils.ts      // Helper functions
```

### 3. **State Management**
```typescript
// Zustand for complex state
import { create } from 'zustand';

interface CoachingStore {
  session: Session | null;
  messages: Message[];
  addMessage: (message: Message) => void;
}

// React Query for server state
import { useQuery } from '@tanstack/react-query';

function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });
}
```

### 4. **Error Handling**
```typescript
// Consistent error patterns
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// Global error boundary
// API error responses
// User-friendly messages
```

### 5. **Testing Strategy**
```typescript
// Test critical paths only
describe('LinkedIn Import', () => {
  it('should import profile data', async () => {
    const profile = await scrapeLinkedIn(TEST_URL);
    expect(profile.firstName).toBeDefined();
  });
});

// Don't over-test early
// Focus on integration tests
```

## 📊 V2 Metrics & Monitoring

### Success Metrics
1. **Performance**: < 2s page load
2. **Reliability**: < 0.1% error rate
3. **User Success**: 80% complete registration
4. **Engagement**: 5+ coaching sessions/user/week

### Monitoring Stack
```typescript
// Simple logging first
console.log('[Feature] Action', { userId, data });

// Add analytics later
// Consider Posthog or Mixpanel
// Don't over-engineer early
```

## 🔧 V2 Tooling & Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "fix": "next lint --fix && tsc --noEmit"
  }
}
```

### Development Tools
- **VSCode** with TypeScript/Tailwind extensions
- **Prisma Studio** for database management
- **Vercel CLI** for deployments
- **Playwright** for E2E testing (NOT Puppeteer)
- **gh CLI** for GitHub operations

## 🤖 Auto-Fix System (From V1)

### Zero-Approval TypeScript Error Correction
Quest Core V1's auto-fix system automatically detects and fixes deployment failures:

```bash
# Workflow: Push → Build Fails → Auto-Fix → Commit → Push → Success
```

### Components to Port:
1. **MCP-Vercel Server** - Real-time deployment monitoring
2. **GitHub Actions Workflow** - `.github/workflows/auto-fix-deployment.yml`
3. **Local Auto-Fix Script** - `scripts/claude-auto-fix.js`
4. **5-Attempt Tracking** - Smart retry logic

### Why This Matters:
- ✅ Catches TypeScript errors immediately
- ✅ Fixes common import/syntax issues
- ✅ No manual intervention needed
- ✅ Proven in V1 production

## 🎨 Frontend Design Strategy

### Hybrid Approach: thesys.dev + shadcn/ui

#### Primary Tool: thesys.dev Generative UI
- **Purpose**: Adaptive, context-aware interfaces
- **Use Case**: Trinity discovery, coaching dashboards
- **Benefit**: Cutting-edge user experiences

#### Foundation: shadcn/ui Components
- **Purpose**: Consistent base components
- **Use Case**: Buttons, forms, modals, cards
- **Benefit**: Faster development, accessibility

#### Implementation:
```bash
# 1. Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form dialog

# 2. Customize with Quest theme
# 3. Configure thesys.dev to use shadcn components
```

#### Quest Theme Override:
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: '#00D4B8',    // Aurora Fade
      secondary: '#4F46E5',  // Electric Violet
      accent: '#8B5CF6',     // Purple
      background: '#0A0E1A', // Deep Charcoal
      surface: '#1A1D29'     // Card Background
    }
  }
}
```

## 🔧 GitHub Integration

### Using gh CLI (Already Integrated)
```bash
# Examples of current capabilities:
gh pr create --title "Feature" --body "Description"
gh issue list --label "bug"
gh api repos/owner/repo/pulls
```

### No Need for GitHub MCP Server
- ✅ gh CLI provides all needed functionality
- ✅ Auto-fix system handles error correction
- ✅ Simpler than MCP server setup

## 📋 MCP Servers - Strategic Use Only

### Not Needed for V2 Phase 1:
- ❌ **GitHub MCP** - gh CLI is sufficient
- ❌ **Apidog MCP** - TypeScript provides API safety
- ❌ **PostgreSQL MCP** - Prisma is superior
- ❌ **Figma MCP** - No Figma designs exist
- ❌ **File System MCP** - Native access already available

### Valuable for V2 Phase 2 (Enhanced Registration):
- ✅ **Apify MCP** - Access to 5,000+ scrapers for shock & awe
- ✅ **n8n MCP** - Workflow automation for sequential scraping

### Valuable for V2 Phase 3 (Decision Support):
- ✅ **Zen MCP** - Multi-model collaboration for complex decisions

**Phase 1: Foundation + Monitoring | Phase 2: Enhancement + Testing | Phase 3: Intelligence + Hardening**

## 📊 Monitoring & Testing Strategy

### Critical Infrastructure First Approach
Based on V1 failures and 2024 best practices, all challenging integrations must be implemented with comprehensive monitoring from day one.

### Monitoring Stack (Checkly + HyperDX)
```bash
# Checkly - Primary monitoring (Vercel marketplace)
# ✅ Synthetic monitoring + backend traces
# ✅ Works out-of-the-box with Next.js 15
# ✅ Monitors Preview and Production deployments
# ✅ Native Vercel integration

# HyperDX - Backup monitoring
# ✅ Logs, APM & Session Replay in one platform
# ✅ Modern stack compatibility
```

### Testing Framework (Vitest > Jest)
```bash
# Core testing stack (4x faster than Jest)
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @testing-library/react @testing-library/dom @testing-library/jest-dom
npm install -D vite-tsconfig-paths

# E2E testing for async Server Components
npm install -D playwright @playwright/test
```

### Code Quality Pipeline
```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
      - name: Setup Node.js
      - name: Install dependencies
      - name: ESLint + TypeScript check
      - name: Vitest unit tests
      - name: Playwright E2E tests
      - name: Security scan (Dependabot)
      - name: Build validation
```

### Pre-commit Quality Gates
```bash
# Husky + lint-staged setup
npm install -D husky lint-staged
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-config-next eslint-plugin-react-hooks

# Pre-commit hook runs:
# 1. ESLint with auto-fix
# 2. TypeScript compilation check
# 3. Affected unit tests
# 4. Security vulnerability scan
```

### Why This Approach Works
1. **Sentry Issues**: Next.js 15 + Turbopack compatibility problems make it risky for early implementation
2. **Checkly Benefits**: Native Vercel integration with proven Next.js 15 compatibility
3. **Vitest Performance**: 4x faster than Jest with Jest-compatible API for easy migration
4. **Early Integration**: Challenging integrations (scraping, monitoring) tackled first when team energy is highest

### Integration Monitoring Patterns
```typescript
// Monitor Apify scraping operations
const scrapeWithMonitoring = async (url: string) => {
  const startTime = Date.now();
  try {
    const result = await apifyClient.call('linkedin-scraper', { url });
    // Log success metrics to Checkly
    await logMetric('scraping_success', Date.now() - startTime);
    return result;
  } catch (error) {
    // Alert on failure via Checkly
    await logError('scraping_failure', error, { url });
    throw error;
  }
};

// Monitor AI operations
const aiCallWithTracking = async (prompt: string, model: string) => {
  const requestId = generateId();
  try {
    const response = await openRouter.chat({ prompt, model });
    await trackAIUsage(requestId, model, prompt.length, response.length);
    return response;
  } catch (error) {
    await alertAIFailure(requestId, model, error);
    throw error;
  }
};
```

## 🎨 Story → Trinity → Quest Architecture

### The Journey (Not Registration)
1. **Professional Mirror**: "This is how the world sees you" - scraped LinkedIn data
2. **Story Building**: Biographer coach guides through career milestones
3. **Trinity Evolution**: Discover Past → Present → Future Trinity through reflection
4. **Quest Readiness**: 70% earn their Quest, 25% need preparation, 5% aren't ready yet

### Key Innovation: Trinity Through Time
- **Past Trinity**: What drove you, how you served, what you pledged (looking back)
- **Present Trinity**: What drives you now, how you serve now, what you pledge now
- **Future Trinity**: What will drive you, how you'll serve, what you'll pledge (your Quest)

### Implementation Principles
- Never say "register" or "sign up"
- Make Quest something to be earned, not given
- Use coaches as guides, not interrogators
- Create visual journey that builds with story

## 🎯 V2 Implementation Checklist (Story-First Architecture)

### Week 1: Foundation + Story System
**Priority: Professional Mirror and Story Collection**

#### Day 1-2: Monitoring & Core Setup
- [ ] **Checkly Integration** for production monitoring
- [ ] **Testing Framework** (Vitest + Playwright)
- [ ] **GitHub Actions CI/CD** pipeline

#### Day 3-5: Professional Mirror MVP
- [ ] **LinkedIn Scraping** with "shock and awe" data
- [ ] **Timeline Visualization** with React Force Graph
- [ ] **Story Milestone Interface** with corrections
- [ ] **Biographer Coach** personality and prompts

#### Day 6-8: Trinity Pattern Recognition
- [ ] **Pattern Extraction** from story milestones
- [ ] **Past/Present/Future Trinity** visualization
- [ ] **Trinity Evolution** constellation UI
- [ ] **Pattern Seeker Coach** implementation

#### Day 9-10: Quest Readiness Gate
- [ ] **Readiness Assessment** algorithm
- [ ] **Three-path system** (Ready/Preparing/Not Yet)
- [ ] **Not Yet support** experience
- [ ] **Quest activation** ceremony

#### Success Criteria Week 1-2
- All difficult integrations working and monitored
- Comprehensive error tracking and alerting operational
- LinkedIn scraping reliable with 95%+ success rate
- Full CI/CD pipeline preventing broken deployments

### Week 3-4: Enhanced Registration with Robust Monitoring
- [ ] **Enhanced "Shock & Awe" Registration**
  - [ ] Apify MCP integration with full monitoring
  - [ ] X/Twitter, GitHub, Reddit scrapers with error handling
  - [ ] n8n workflow orchestration with observability
  - [ ] E2E testing of entire registration flow
- [ ] **Working Repository** with access control monitoring
- [ ] **Basic AI coach** with performance tracking
- [ ] **Trinity questions** with user interaction analytics

### Month 2: Advanced Features with Production Hardening
- [ ] **Zen MCP Integration** with multi-model monitoring
  - [ ] Multi-model architecture reviews with performance metrics
  - [ ] Complex problem solving with Gemini and cost tracking
  - [ ] Code reviews from multiple perspectives with quality metrics
- [ ] **Production Hardening**
  - [ ] All 4 repository layers with comprehensive monitoring
  - [ ] Neo4j relationships with query performance tracking
  - [ ] Zep memory with context retrieval monitoring
  - [ ] Advanced AI features with usage analytics
  - [ ] Premium features with business metrics

## 🚀 Enhanced "Shock & Awe" Registration (Phase 2)

### Vision
Transform registration from "We found your LinkedIn" to "We discovered your entire professional digital footprint"

### Implementation with Apify MCP + n8n

#### Apify MCP Integration
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["@apify/mcp-server"],
      "env": {
        "APIFY_API_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

#### Available Scrapers for Enhancement:
- **LinkedIn** - Profile, company, employees (existing)
- **X/Twitter** - Profile, recent tweets, engagement
- **GitHub** - Repos, contributions, stars
- **Reddit** - Technical discussions, expertise
- **Google** - Blog posts, conference talks
- **Company websites** - About pages, team info

#### Workflow Example:
```typescript
// Enhanced registration flow
async function shockAndAweRegistration(name: string, email: string) {
  // Phase 1: Basic LinkedIn
  const linkedin = await scrapeLinkedIn(linkedinUrl);
  
  // Phase 2: Enhanced discovery (via Apify MCP)
  const enhanced = await Promise.all([
    findTwitterProfile(name, linkedin.company),
    findGitHubProfile(email, name),
    searchGoogleForUser(name, linkedin.headline),
    scrapeCompanyData(linkedin.company)
  ]);
  
  // Create comprehensive profile
  return aggregateUserInsights(linkedin, ...enhanced);
}
```

#### n8n Orchestration Benefits:
- Sequential scraping with dependencies
- Error handling and retries
- Rate limit management
- Conditional logic (if GitHub found, scrape repos)
- Data transformation and cleaning

#### Expected User Experience:
```
"Welcome Sarah! Here's what we discovered:
✨ Senior Engineer at Meta with 8 years experience
🐦 Your viral TypeScript thread reached 50K developers
⭐ Your React hooks library has 3.2K GitHub stars
🏢 Connected to 127 Meta colleagues in our network
📚 Speaker at ReactConf 2024 on performance optimization
🎯 Top skills: React, TypeScript, System Design"
```

#### Privacy & Cost Considerations:
- Only public data scraped
- ~$0.10 per enhanced registration
- Clear opt-in/opt-out
- GDPR compliant data handling

## 🧠 Multi-Model Collaboration with Zen MCP (Phase 3)

### Vision
Transform from single-model decisions to multi-perspective intelligence for complex architectural choices and problem solving.

### What is Zen MCP?
Orchestrates multiple AI models (Claude + Gemini + GPT + Ollama) as your development team, with each model building upon others' insights while maintaining conversation context.

### Implementation
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "zen": {
      "command": "npx",
      "args": ["@199biotechnologies/zen-mcp"],
      "env": {
        "GEMINI_API_KEY": "YOUR_KEY",
        "OPENAI_API_KEY": "YOUR_KEY",
        "OPENROUTER_API_KEY": "YOUR_KEY" // Optional
      }
    }
  }
}
```

### Use Cases for Quest Core V2
```typescript
// 1. Architecture Decisions
"Use zen consensus to evaluate our 4-layer repository design"

// 2. Complex Problem Solving  
"Use gemini thinkdeep to analyze Trinity coherence scoring algorithm"

// 3. Code Reviews
"Use zen codereview on the enhanced registration workflow"

// 4. Extended Reasoning (1M tokens)
"Use gemini to analyze all our API endpoints for optimization opportunities"
```

### Zen Tools Available
- **chat**: Collaborative thinking partner
- **thinkdeep**: Extended reasoning for edge cases
- **challenge**: Critical thinking that prevents blind agreement
- **planner**: Step-by-step planning for complex features
- **consensus**: Multi-model perspectives
- **codereview**: Professional review with prioritized feedback

### Why Zen MCP Matters for V2
- **Better Decisions**: Multiple AI perspectives catch blind spots
- **Context Persistence**: Models remember across Claude resets
- **Extended Analysis**: Gemini's 1M token context for large codebases
- **Specialized Strengths**: Each model excels at different tasks

### When to Use
- Major architectural decisions
- Complex algorithm design
- Performance optimization strategies
- Security review of critical paths
- When you need a "second opinion"

## 💡 Key V2 Decisions

### What to Keep from V1
- Proven UI patterns
- Working API endpoints
- Successful integrations
- Database schema (simplified)
- Design system

### What to Change
- No MCP/complex abstractions
- Direct API calls instead
- Simpler state management
- Fewer dependencies
- Clearer module boundaries

### What to Add
- Better error handling
- Performance monitoring
- User analytics
- A/B testing capability
- Feature flags

## 🚨 V2 Anti-Patterns (Avoid These!)

1. **Over-abstraction**: Write direct code first
2. **Premature optimization**: Make it work, then fast
3. **Feature creep**: Ship core value first
4. **Complex state**: Use simple patterns
5. **Unnecessary dependencies**: Every package adds weight

## 📋 PRP Framework for Feature Development

### Overview
Use Cole Meddin's PRP (Product Requirements Prompt) framework for systematic feature development with AI assistance.

### Feature Development Workflow
```
1. Create initial.md → 2. Generate PRP → 3. Validate → 4. Execute → 5. Test
```

### 1. Feature Initial.md Template
```markdown
# /prps/features/[feature-name]/initial.md

## Feature: [Name]

### Dependencies
- Required APIs (e.g., Apify, OpenRouter)
- npm packages needed
- Environment variables
- Database tables/changes

### Definition
- User stories (As a user, I want to...)
- Business logic details
- Success criteria
- UI/UX requirements

### Functions/Components
- API endpoints to create
- React components to build
- Database operations needed
- Integration points

### Examples
- Link to similar features in codebase
- Reference implementations
- Design patterns to follow

### Considerations
- Known gotchas with this type of feature
- Performance requirements
- Security considerations
- Error handling needs
```

### 2. Generate Feature PRP
Use AI to expand initial.md into comprehensive PRP:
```bash
# In Claude Code or as prompt:
"Generate a PRP for [feature] based on initial.md, including all Quest Core patterns"
```

### 3. Validation Checklist
Before executing PRP, ensure:
- [ ] All dependencies are correct
- [ ] No sensitive data in PRP
- [ ] File structure makes sense
- [ ] Validation gates included
- [ ] Confidence score addressed

**Ask**: "What would make this PRP 10/10 confidence?"

### 4. Validation Gates
```typescript
// Every feature must pass:
interface ValidationGates {
  compilation: "npm run build succeeds",
  typecheck: "npm run typecheck passes",
  linting: "npm run lint passes",
  tests: "npm test passes for new code",
  manual: "Feature works as specified",
  security: "No exposed secrets or vulnerabilities"
}
```

### 5. PRP Templates by Feature Type
```
/prps/templates/
├── linkedin-scraping.md    # Apify integration patterns
├── ai-coaching.md          # OpenRouter/Zep patterns  
├── ui-component.md         # React/Tailwind patterns
├── api-endpoint.md         # Next.js API patterns
└── database-feature.md     # Prisma patterns
```

### 6. Examples Directory Structure
```
/examples/
├── successful-patterns/
│   ├── apify-scraping/
│   ├── ai-integration/
│   ├── auth-flows/
│   └── ui-components/
├── gotchas/
│   ├── common-errors.md
│   └── solutions.md
└── reference-implementations/
```

### Feature Development Rules
1. **Clear context first**: Always start with initial.md
2. **Validate before execute**: Review every PRP
3. **Test incrementally**: Run validation gates often
4. **Document patterns**: Add successful patterns to /examples
5. **Update CLAUDE.md**: Add new constants/patterns

### Confidence Scoring
Rate each PRP before execution:
- 10/10: Ready to execute
- 8-9/10: Minor clarifications needed
- <8/10: Needs more context/examples

## 📚 V2 Resources

### Internal Documentation
- This methodology guide
- Implementation guide
- Complete learnings doc
- V1 codebase reference

### External Resources
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Guide](https://www.prisma.io/docs)
- [Apify SDK](https://docs.apify.com/sdk/js)

## 🎉 V2 Success Formula

```
Working V1 Patterns +
Cole Meddin's Methodology +
Radical Simplification +
Daily Deployment =
10x Better Product in 10% of Code
```

Remember: Every line of code should directly serve user value. If it doesn't, delete it.

---

*"Your V1 taught you what to build. V2 is about building it right."*