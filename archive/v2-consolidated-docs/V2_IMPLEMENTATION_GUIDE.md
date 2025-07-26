# Quest Core V2 - Complete Implementation Guide

*A distilled guide based on 42,000+ lines of code and hard-won lessons*

## 🎯 Project Vision
Build a premium professional development platform with AI-powered coaching and LinkedIn-based "Shock & Awe" registration, implemented with radical simplicity.

## 🏗️ Architecture Principles

### 1. **Simple First, Scale Later**
- Start with working code, optimize when needed
- No abstractions until patterns emerge 3+ times
- Direct implementations over clever architectures

### 2. **Use What Works**
- Official SDKs over custom implementations
- Proven patterns from v1
- No experimental features in core flows

### 3. **Fast Feedback Loops**
- Deploy early and often
- Test with real data immediately
- Fix forward, don't over-plan

## 📁 Project Structure

```
quest-core-v2/
├── src/
│   ├── app/                    # Next.js 15 app directory
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/       # Main app pages
│   │   ├── api/               # API routes
│   │   └── register/          # Registration flow
│   ├── components/            # React components
│   ├── lib/                   # Core utilities
│   │   ├── auth.ts           # Clerk helpers
│   │   ├── db.ts             # Prisma client
│   │   ├── scraping.ts       # Apify integration
│   │   └── ai.ts             # OpenRouter client
│   └── styles/               # Global styles
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
└── docs/                     # Documentation

```

## 🚀 Implementation Order

### Phase 1: Foundation (Day 1 Morning)
**Goal**: Basic Next.js app with auth and database

#### 1.1 Initialize Project
```bash
npx create-next-app@latest quest-core-v2 --typescript --tailwind --app
cd quest-core-v2
```

#### 1.2 Essential Dependencies
```bash
# Core
npm install @clerk/nextjs prisma @prisma/client
npm install apify-client dotenv

# Development
npm install -D @types/node

# DON'T install yet: Complex packages we'll add only when needed
```

#### 1.3 Environment Setup
```env
# .env.local
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
APIFY_TOKEN="apify_api_..."
OPENROUTER_API_KEY="sk-or-..."
```

#### 1.4 Database Schema (Simplified)
```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  profile   Profile?
  createdAt DateTime @default(now())
}

model Profile {
  id         String  @id @default(cuid())
  userId     String  @unique
  user       User    @relation(fields: [userId], references: [id])
  
  // Basic Info
  firstName  String?
  lastName   String?
  headline   String?
  location   String?
  linkedinUrl String?
  
  // LinkedIn Import
  linkedinData Json?  // Store raw data for reference
  importedAt   DateTime?
  
  // Trinity
  quest       String?
  service     String?
  pledge      String?
}
```

#### 1.5 Clerk Setup (Simple)
```typescript
// src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/register/linkedin"]
});
```

### Phase 2: LinkedIn "Shock & Awe" (Day 1 Afternoon)
**Goal**: Working LinkedIn import in < 100 lines of code

#### 2.1 Apify Integration (THE SIMPLE WAY)
```typescript
// src/lib/scraping.ts
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

export async function scrapeLinkedIn(url: string) {
  const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
    profileScraperMode: "Profile details no email ($4 per 1k)",
    queries: [url]
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  
  // THE KEY LEARNING: Data is in items[0].element!
  return items[0]?.element || null;
}
```

#### 2.2 Registration Page
```typescript
// src/app/register/linkedin/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function LinkedInRegister() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const handleImport = async () => {
    setLoading(true);
    const res = await fetch('/api/register/linkedin', {
      method: 'POST',
      body: JSON.stringify({ linkedinUrl: url }),
    });
    const data = await res.json();
    setProfileData(data);
    setLoading(false);
  };

  // Simple UI - enhance later
  return (
    <div className="max-w-md mx-auto p-8">
      <h1>Import Your LinkedIn Profile</h1>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://linkedin.com/in/yourprofile"
        className="w-full p-2 border rounded"
      />
      <button 
        onClick={handleImport}
        disabled={loading}
        className="w-full mt-4 p-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Importing...' : 'Import Profile'}
      </button>
      
      {profileData && (
        <div className="mt-8">
          <h2>Preview Your Profile</h2>
          {/* Show imported data */}
        </div>
      )}
    </div>
  );
}
```

#### 2.3 API Route (Direct & Simple)
```typescript
// src/app/api/register/linkedin/route.ts
import { scrapeLinkedIn } from '@/lib/scraping';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const { linkedinUrl } = await req.json();
  
  // Scrape LinkedIn
  const linkedinData = await scrapeLinkedIn(linkedinUrl);
  
  if (!linkedinData) {
    return Response.json({ error: 'Failed to scrape' }, { status: 400 });
  }

  // Create/update profile
  const { userId } = auth();
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: linkedinData.firstName,
      lastName: linkedinData.lastName,
      headline: linkedinData.headline,
      location: linkedinData.location?.linkedinText,
      linkedinUrl,
      linkedinData,
      importedAt: new Date(),
    },
    update: {
      // Same fields
    }
  });

  return Response.json(profile);
}
```

### Phase 3: Core Features (Day 2)
**Goal**: Working app with profile, repo, and basic AI

#### 3.1 Profile Management
- Simple CRUD pages
- Direct database queries
- No complex state management

#### 3.2 Working Repository
- Start with public/private toggle
- Add access control only when needed
- Skip analytics initially

#### 3.3 AI Integration (OpenRouter)
```typescript
// src/lib/ai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function askCoach(message: string, coach: string = 'career') {
  const models = {
    career: 'anthropic/claude-3-sonnet',
    skills: 'openai/gpt-4',
    leadership: 'google/gemini-pro',
  };

  const response = await openai.chat.completions.create({
    model: models[coach] || models.career,
    messages: [{ role: 'user', content: message }],
  });

  return response.choices[0].message.content;
}
```

### Phase 4: Advanced Features (Day 3+)
**Goal**: Add complexity only where it adds value

#### 4.1 Neo4j Integration (If Needed)
```typescript
// src/lib/neo4j.ts
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Only add when we need graph queries
export async function findConnections(userId: string) {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (u:User {id: $userId})-[:WORKED_AT]->(c:Company)<-[:WORKED_AT]-(other:User) RETURN other LIMIT 10',
      { userId }
    );
    return result.records.map(r => r.get('other'));
  } finally {
    await session.close();
  }
}
```

#### 4.2 Company Enrichment
- Use same Apify pattern
- Store in PostgreSQL first
- Move to Neo4j only for graph queries

#### 4.3 Zep Memory (When Needed)
- Add only when conversations get complex
- Start with simple session storage
- Upgrade to Zep for long-term memory

## 🚫 What NOT to Do (Lessons from V1)

### 1. **Don't Abstract Too Early**
❌ Complex ProfileScraper class with MCP fallbacks
✅ Simple function that calls Apify directly

### 2. **Don't Over-Engineer Data Access**
❌ Repository pattern with interfaces
✅ Direct Prisma queries in API routes

### 3. **Don't Guess API Responses**
❌ Assuming data structure
✅ console.log everything first

### 4. **Don't Add All Features Upfront**
❌ 20 API endpoints on day 1
✅ 3 working endpoints, add more as needed

### 5. **Don't Optimize Prematurely**
❌ Complex caching layers
✅ Make it work, then make it fast

## 📋 Implementation Checklist

### Day 1: Foundation + LinkedIn
- [ ] Create Next.js app with TypeScript
- [ ] Set up Clerk authentication
- [ ] Create basic Prisma schema
- [ ] Implement LinkedIn scraping
- [ ] Build registration flow
- [ ] Deploy to Vercel

### Day 2: Core Features  
- [ ] Profile management pages
- [ ] Basic working repository
- [ ] OpenRouter AI integration
- [ ] Simple Trinity questions
- [ ] Deploy updates

### Day 3: Enhancement
- [ ] Company enrichment
- [ ] Improve UI/UX
- [ ] Add access control
- [ ] Voice coaching (if time)
- [ ] Deploy updates

### Week 2: Advanced
- [ ] Neo4j for connections
- [ ] Zep for memory
- [ ] Analytics dashboard
- [ ] Multi-coach system
- [ ] Production polish

## 🎯 Success Metrics

### Technical
- LinkedIn import works in < 30 seconds
- Page loads in < 2 seconds  
- API responses in < 500ms
- Zero errors in production

### User Experience
- Sign up to first value in < 2 minutes
- Profile import accuracy > 95%
- AI responses feel helpful
- UI feels premium

## 🛠️ Quick Reference

### Apify LinkedIn Scraping
```javascript
// Remember: data is in items[0].element!
const profile = items[0].element;
const name = `${profile.firstName} ${profile.lastName}`;
```

### OpenRouter Models
```javascript
// Best models for each coach
career: 'anthropic/claude-3-sonnet'
skills: 'openai/gpt-4'  
leadership: 'google/gemini-pro'
master: 'openai/gpt-4-turbo'
network: 'anthropic/claude-3-sonnet'
```

### Database Queries
```typescript
// Simple is fine!
const profile = await prisma.profile.findUnique({
  where: { userId }
});
```

### Error Handling
```typescript
// Be explicit
if (!data) {
  return { error: 'No data found' };
}
```

## 🚀 Getting Started

1. **Clone this guide** into your new project
2. **Follow Phase 1** exactly as written
3. **Deploy after each phase** to catch issues early
4. **Keep it simple** - you can always add complexity later
5. **Trust the process** - we've learned these lessons the hard way

---

**Remember**: 42,000 lines taught us that 4,000 lines could do the same job better. Start simple, stay simple, ship daily.