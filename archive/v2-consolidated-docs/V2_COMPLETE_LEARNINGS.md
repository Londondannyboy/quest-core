# Quest Core V2 - Complete Learnings & Integration Reference

*All libraries, gotchas, and hard-won lessons from V1*

## 📚 Complete Technology Inventory

### Core Dependencies Checklist
- ✅ **Next.js 15** - App router, server components
- ✅ **TypeScript** - With strict mode
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Clerk** - Authentication (CRITICAL: Sync users to DB)
- ✅ **Prisma** - ORM with type safety
- ✅ **Neon** - Serverless PostgreSQL
- ❓ **React Force Graph 3D** - Network visualization
- ❓ **Three.js** - 3D rendering (via Force Graph)
- ✅ **Apify Client** - LinkedIn scraping
- ✅ **OpenRouter/OpenAI** - AI gateway
- ❓ **Hume AI** - Voice coaching
- ❓ **Zep** - Conversation memory
- ❓ **Neo4j** - Graph database (planned, not implemented)
- ✅ **Vercel** - Deployment platform

### NPM Packages (Exact Versions from V1)
```json
{
  "dependencies": {
    "@clerk/nextjs": "^4.29.5",
    "@prisma/client": "^6.11.1",
    "apify-client": "^2.12.6",
    "react-force-graph-3d": "^1.24.2",
    "openai": "^4.28.4",
    "dotenv": "^17.2.1",
    "@types/three": "^0.160.0"
  }
}
```

## 🔑 Critical Environment Variables

### Development (.env.local)
```env
# Neon Database (EXACT format matters!)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# Clerk (Both needed!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Apify (All three for compatibility)
APIFY_TOKEN="apify_api_..."
APIFY_API_KEY="apify_api_..."  # Same as token
APIFY_USER_ID="oagG2IEtw87XfSn3x"

# OpenRouter
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# Optional (Add when needed)
HUME_API_KEY="..."
ZEP_API_KEY="..."
NEO4J_URI="neo4j+s://..."
NEO4J_USER="neo4j"
NEO4J_PASSWORD="..."
```

### Production (Vercel Dashboard)
**CRITICAL**: Must add each env var in Vercel settings!
- Environment Variables → Add all from above
- Redeploy after adding

## 💡 Key Integration Learnings

### 1. Clerk + Database Sync
```typescript
// CRITICAL: After Clerk signup, MUST sync to database
// src/app/api/auth/create-user/route.ts
import { currentUser } from '@clerk/nextjs';
import { prisma } from '@/lib/db';

export async function POST() {
  const user = await currentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // MUST create user in DB or everything breaks
  await prisma.user.upsert({
    where: { clerkId: user.id },
    update: { email: user.emailAddresses[0].emailAddress },
    create: {
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
    }
  });

  return new Response('User synced', { status: 200 });
}
```

### 2. Neon Database Gotchas
```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")        // Direct for migrations
}

// GOTCHA: Neon needs both URLs!
// GOTCHA: Must run 'prisma generate' after schema changes
// GOTCHA: 'prisma db push' for dev, migrations for prod
```

### 3. 3D Force Graph Implementation
```typescript
// LEARNING: Dynamic imports required for SSR
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
);

// GOTCHA: Must handle window undefined
// GOTCHA: Performance degrades > 100 nodes
// GOTCHA: Custom node rendering needs Three.js knowledge

// Working implementation:
<ForceGraph3D
  graphData={{
    nodes: [{ id: '1', name: 'User', val: 10 }],
    links: [{ source: '1', target: '2' }]
  }}
  nodeThreeObject={(node) => {
    // Custom sphere with gradient
    const geometry = new THREE.SphereGeometry(10);
    const material = new THREE.MeshBasicMaterial({
      color: node.color || 0x00d4b8
    });
    return new THREE.Mesh(geometry, material);
  }}
/>
```

### 4. Apify Scraping Pattern
```typescript
// THE CRITICAL LEARNING: Data structure!
const { items } = await client.dataset(run.defaultDatasetId).listItems();
const profile = items[0].element; // NOT items[0] directly!

// Full working pattern:
export async function scrapeLinkedIn(url: string) {
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  
  const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
    profileScraperMode: "Profile details no email ($4 per 1k)",
    queries: [url]
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  
  if (!items?.[0]?.element) {
    throw new Error('No profile data found');
  }
  
  const profile = items[0].element;
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    headline: profile.headline,
    location: profile.location?.linkedinText,
    experience: profile.experience || [],
    education: profile.education || [],
    skills: profile.skills || []
  };
}
```

### 5. CRUD Operations Best Practices
```typescript
// LEARNING: Prisma handles most complexity
// LEARNING: Always use upsert for profile updates
// LEARNING: Include relations when needed

// ❌ BAD: Separate queries
const user = await prisma.user.findUnique({ where: { clerkId } });
const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

// ✅ GOOD: Include relations
const user = await prisma.user.findUnique({
  where: { clerkId },
  include: { profile: true }
});

// ✅ BEST: Upsert pattern
const profile = await prisma.profile.upsert({
  where: { userId },
  create: { userId, ...data },
  update: { ...data },
  include: { user: true }
});
```

### 6. Creating Test Users
```typescript
// LEARNING: Use Clerk's test mode
// GOTCHA: Must sync to DB after creation

// Option 1: Clerk Dashboard
// - Create test users in Clerk dashboard
// - Trigger webhook to sync to DB

// Option 2: Seed script
// prisma/seed.ts
async function seed() {
  // Create test user (if using email/password)
  const testUser = await prisma.user.create({
    data: {
      clerkId: 'test_user_' + Date.now(),
      email: 'test@example.com',
      profile: {
        create: {
          firstName: 'Test',
          lastName: 'User',
          headline: 'Test Profile',
          linkedinUrl: 'https://linkedin.com/in/test'
        }
      }
    }
  });
}
```

### 7. Deployment Checklist
```bash
# Local works but production fails? Check:
1. ✓ All env vars in Vercel dashboard
2. ✓ Database URLs correct format
3. ✓ Prisma generate in build command
4. ✓ API routes use proper auth checks
5. ✓ CORS headers for external calls

# Vercel settings:
Build Command: prisma generate && next build
Install Command: npm install
Root Directory: ./
```

## 🚨 Common Pitfalls & Solutions

### 1. "User not found" after signup
```typescript
// PROBLEM: Clerk user exists but not in DB
// SOLUTION: Add webhook or API route to sync

// src/app/api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const { type, data } = await req.json();
  
  if (type === 'user.created') {
    await prisma.user.create({
      data: {
        clerkId: data.id,
        email: data.email_addresses[0].email_address
      }
    });
  }
}
```

### 2. "Window is not defined" errors
```typescript
// PROBLEM: SSR tries to run browser code
// SOLUTION: Dynamic imports with ssr: false

const ClientComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
);
```

### 3. Prisma client errors
```typescript
// PROBLEM: Prisma client not found
// SOLUTION: Always run after install
npm install
npx prisma generate

// Add to package.json:
"postinstall": "prisma generate"
```

### 4. API route 405 errors
```typescript
// PROBLEM: Wrong HTTP method
// SOLUTION: Name functions correctly
export async function GET() { }  // For GET requests
export async function POST() { } // For POST requests
```

## 📋 V2 Complete Tech Stack

### Required from Day 1
- Next.js 15 + TypeScript
- Clerk (auth)
- Prisma + Neon (database)
- Apify (LinkedIn scraping)
- Tailwind CSS

### Add in Phase 2
- React Force Graph 3D (visualization)
- OpenRouter (AI coaching)

### Add When Needed
- Hume AI (voice)
- Zep (memory)
- Neo4j (graph queries)
- thesys.dev (generative UI)

## 🎯 Testing Strategy

### 1. Local Testing
```bash
# Always test with real data
npm run dev
# Create real Clerk account
# Import real LinkedIn profile
# Check database has data
```

### 2. Production Testing
```bash
# Deploy early
vercel --prod
# Test immediately after deploy
# Check logs for errors
# Verify env vars loaded
```

### 3. Debug Endpoints
```typescript
// Always add these for sanity checks
// src/app/api/debug/env/route.ts
export async function GET() {
  return Response.json({
    hasDatabase: !!process.env.DATABASE_URL,
    hasClerk: !!process.env.CLERK_SECRET_KEY,
    hasApify: !!process.env.APIFY_TOKEN,
    // Don't expose actual values!
  });
}
```

### 8. thesys.dev Generative UI Integration
```typescript
// LEARNING: Adaptive interfaces based on user context
// GOTCHA: Requires careful prompt engineering
// STATUS: Planned but not implemented in V1

// Future implementation pattern:
import { ThesysClient } from '@thesys/sdk';

const thesys = new ThesysClient({
  apiKey: process.env.THESYS_API_KEY,
  model: 'claude-3-sonnet'
});

// Generate adaptive interface
export async function generateCoachingUI(userContext: any) {
  const uiSpec = await thesys.generateInterface({
    context: {
      user: userContext,
      stage: 'trinity-discovery',
      brand: {
        colors: ['#00D4B8', '#4F46E5', '#8B5CF6'],
        style: 'premium-professional'
      }
    },
    constraints: {
      framework: 'react',
      styling: 'tailwind',
      responsive: true
    }
  });
  
  return uiSpec;
}

// IMPORTANT: Start with static UI, add generative features gradually
// IMPORTANT: Test generated code thoroughly
// IMPORTANT: Have fallback to static components
```

### 9. Complete Integration Priority Order

Based on V1 learnings, here's the optimal integration sequence:

1. **Week 1 - Core Platform**
   - ✅ Next.js + TypeScript + Tailwind
   - ✅ Clerk authentication
   - ✅ Neon + Prisma database
   - ✅ Apify LinkedIn scraping
   - ✅ Basic CRUD operations

2. **Week 2 - Intelligence Layer**
   - ✅ OpenRouter AI gateway
   - ✅ Multi-coach system
   - ⏳ React Force Graph 3D (if needed)

3. **Week 3 - Advanced Features**
   - ⏳ Hume AI voice coaching
   - ⏳ Zep conversation memory
   - ⏳ Enhanced "Shock & Awe" Registration
   - ⏳ Company/employee enrichment

4. **Month 2 - Innovation & Intelligence**
   - ⏳ Zen MCP multi-model collaboration
   - ⏳ Neo4j graph database
   - ⏳ thesys.dev generative UI
   - ⏳ Advanced analytics

### 10. Enhanced Registration Strategy (Phase 2 Learning)

**LEARNING: Single LinkedIn scrape is not enough for "shock & awe"**
**SOLUTION: Apify MCP + n8n workflow orchestration**

```typescript
// Phase 1: Basic LinkedIn only
const profile = await scrapeLinkedIn(url);

// Phase 2: Enhanced discovery via Apify MCP
const enhanced = await discoverDigitalFootprint(name, company);
```

#### Apify MCP Server Benefits:
- Access to 5,000+ scrapers without individual setup
- Dynamic scraper discovery (`search-actors` API)
- Unified interface for all scrapers
- Pay-per-use pricing (~$0.10 per registration)

#### Available Scrapers for Shock & Awe:
```typescript
const scrapers = {
  'twitter-scraper': '$0.40 per 1K results',
  'reddit-scraper': '$45/month after trial',
  'github-scraper': 'Free tier available',
  'google-search': 'Results + snippets',
  'company-websites': 'Team pages, about'
};
```

#### n8n Workflow Orchestration:
```typescript
// Sequential scraping with error handling
workflow: 'Enhanced Registration'
├── LinkedIn scrape
├── Extract company name
├── Find Twitter/X profile
├── Scrape GitHub if found
├── Google search for talks/blogs
└── Aggregate into unified profile
```

#### Integration Code:
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["@apify/mcp-server"],
      "env": { "APIFY_API_TOKEN": "..." }
    }
  }
}
```

#### CRITICAL LEARNINGS:
- Start with Phase 1 (LinkedIn only) for MVP
- Add enhanced discovery in Phase 2 for differentiation
- Use n8n for complex multi-step workflows
- Always handle scraper failures gracefully
- Respect rate limits and privacy

### 11. Multi-Model Collaboration Strategy (Phase 3 Learning)

**LEARNING: Single AI model can have blind spots in complex decisions**
**SOLUTION: Zen MCP for multi-model collaboration and perspectives**

```typescript
// Phase 1-2: Single model (Claude) for all decisions
const decision = await makeArchitectureDecision();

// Phase 3: Multi-model consensus for critical decisions
const consensus = await zen.consensus({
  question: "Should we use Neo4j or extend PostgreSQL?",
  models: ['claude', 'gemini', 'gpt-4']
});
```

#### Zen MCP Benefits:
- **Context Persistence**: Models remember across Claude resets
- **Extended Analysis**: Gemini's 1M token context window
- **Diverse Perspectives**: Each model has different strengths
- **Collaborative Building**: Models build on each other's insights

#### Key Zen Tools:
```typescript
const zenTools = {
  'chat': 'Quick collaborative thinking',
  'thinkdeep': 'Extended reasoning for edge cases',
  'challenge': 'Critical analysis, prevents groupthink',
  'planner': 'Complex feature planning',
  'consensus': 'Multi-model agreement',
  'codereview': 'Comprehensive code analysis'
};
```

#### When to Use Zen MCP:
```typescript
// Architecture decisions
"Use zen consensus to evaluate microservices vs monolith"

// Algorithm design
"Use gemini thinkdeep to optimize Trinity scoring algorithm"

// Security review
"Use zen codereview for authentication implementation"

// Large codebase analysis
"Use gemini to analyze all 60+ API endpoints"
```

#### Integration:
```json
{
  "mcpServers": {
    "zen": {
      "command": "npx",
      "args": ["@199biotechnologies/zen-mcp"],
      "env": {
        "GEMINI_API_KEY": "...",
        "OPENAI_API_KEY": "..."
      }
    }
  }
}
```

#### CRITICAL LEARNINGS:
- Start with single model (Claude) for speed
- Add Zen MCP only for complex decisions
- Models maintain conversation context
- Gemini excels at large context analysis
- GPT-4 strong at code generation
- Use consensus for architecture choices

### 12. Package.json for V2
```json
{
  "name": "quest-core-v2",
  "version": "2.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    // Core (Day 1)
    "next": "15.2.5",
    "react": "^18",
    "react-dom": "^18",
    "@clerk/nextjs": "^4.29.5",
    "prisma": "^6.11.1",
    "@prisma/client": "^6.11.1",
    "apify-client": "^2.12.6",
    
    // Styling
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    
    // AI (Week 2)
    "openai": "^4.28.4",
    
    // 3D Viz (When needed)
    "react-force-graph-3d": "^1.24.2",
    "three": "^0.160.0",
    
    // Future additions (as needed)
    // "neo4j-driver": "^5.x",
    // "@thesys/sdk": "^x.x",
    // "hume": "^x.x"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/three": "^0.160.0",
    "typescript": "^5"
  }
}
```

## ✅ Pre-V2 Checklist

Before starting V2, ensure you have:
- [ ] All API keys ready (see env vars section)
- [ ] Neon database created
- [ ] Clerk app configured
- [ ] Vercel account ready
- [ ] Apify token working
- [ ] This guide + implementation guide
- [ ] Test LinkedIn profile URL
- [ ] 3 hours for Phase 1

## 🎯 Success Metrics for V2

- **Day 1**: LinkedIn import working end-to-end
- **Day 3**: Full profile management + basic AI
- **Week 1**: Deployed and usable by real users
- **Week 2**: Core value proposition delivered
- **Month 1**: Feature parity with V1 (in 10% of code)

---

**Final Wisdom**: Every integration was chosen for a reason. Start with the minimum, add others only when their specific value is needed. The 3D graph looks cool but isn't needed for MVP. Voice coaching is powerful but can wait. Graph database is overkill until you have real connection queries. Generative UI is cutting-edge but static UI works fine initially.