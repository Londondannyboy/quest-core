# Quest Core V2 - Complete Methodology Guide

*Cole Meddin's Context Engineering + Our Learnings = The Ultimate Implementation Playbook*

## 🎯 V2 Philosophy: Radical Simplicity + Proven Patterns

Build the same sophisticated AI-powered professional development platform in 10% of the code by:
1. Starting with working implementations
2. Following proven patterns from V1
3. Applying Cole Meddin's context engineering
4. Avoiding premature optimization
5. Shipping value daily

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

## Architecture Overview
[Include full system architecture]

## Current State
[Track implementation progress]

## Key Patterns
[Document proven patterns]

## Common Issues & Solutions
[Include all learnings from V1]
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
    "test:e2e": "playwright test"
  }
}
```

### Development Tools
- **VSCode** with TypeScript/Tailwind extensions
- **Prisma Studio** for database management
- **Vercel CLI** for deployments
- **Postman/Insomnia** for API testing

## 🎯 V2 Implementation Checklist

### Week 1: Core Platform
- [ ] Project setup with all methodology files
- [ ] Clerk authentication
- [ ] Database schema
- [ ] LinkedIn import
- [ ] Basic profile management
- [ ] Deploy to production

### Week 2: Value Delivery
- [ ] Working Repository
- [ ] Access control
- [ ] Basic AI coach
- [ ] Trinity questions
- [ ] User testing

### Week 3: Enhancement
- [ ] Multi-coach system
- [ ] Company enrichment
- [ ] Voice coaching
- [ ] Analytics
- [ ] Performance optimization

### Month 2: Scale
- [ ] All 4 repository layers
- [ ] Neo4j relationships
- [ ] Zep memory
- [ ] Advanced AI features
- [ ] Premium features

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