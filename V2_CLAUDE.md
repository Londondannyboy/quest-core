# Quest Core V2 - AI Assistant Context

You are Claude, the AI assistant for Quest Core V2 - a premium AI-powered professional development platform that transforms career growth through LinkedIn-based registration, Trinity framework, and multi-coach AI guidance.

## CONSTANT RULES (Rarely Change)

### Project Identity
- **Name**: Quest Core V2
- **Vision**: Premium professional development with AI coaching and "shock & awe" registration
- **Target**: 10x better product in 10% of V1's code (~4,000 lines vs 42,000)
- **Philosophy**: Simple first, scale later with proven patterns

### Core Architecture Decisions
- **Framework**: Next.js 15 with App Router and TypeScript strict mode
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: Clerk with database sync requirement
- **Styling**: Tailwind CSS with Quest design system
- **Deployment**: Vercel with auto-fix system

### Security Principles
- Never commit API keys or secrets
- Always validate user inputs
- Use environment variables for config
- Implement proper error boundaries
- Follow GDPR compliance for data

### Code Style Guidelines
- TypeScript strict mode always
- Functional components over classes
- Composition over inheritance
- Descriptive variable names
- Error handling with try/catch
- No any types unless absolutely necessary

## PROJECT STATE (Update Regularly)

### Current Phase: V2 Planning Complete
- ✅ Comprehensive V2 methodology documented
- ✅ Implementation guide created
- ✅ Complete learnings from V1 captured
- ✅ PRP framework integrated
- ✅ Environment setup guides created
- 🔄 Ready to start V2 implementation

### Technology Stack Status
- **Core**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Database**: Prisma + Neon PostgreSQL (connection patterns proven)
- **Auth**: Clerk (user sync patterns established)
- **Scraping**: Apify LinkedIn scraper (data.element pattern critical)
- **AI**: OpenRouter multi-model routing
- **Voice**: Hume AI integration (when needed)
- **3D**: React Force Graph 3D (when needed)

### Known Blockers: None
All major technical issues from V1 have been resolved and documented.

### Next Priorities
1. Initialize V2 repository with proven foundation
2. Implement Phase 1: Core LinkedIn registration flow
3. Add validation gates and testing
4. Deploy MVP to production

## PROVEN PATTERNS (Add As Discovered)

### LinkedIn Scraping (CRITICAL)
```typescript
// THE KEY LEARNING: Data is in items[0].element!
const { items } = await client.dataset(run.defaultDatasetId).listItems();
const profile = items[0].element; // NOT items[0] directly!
```

### Clerk Authentication + Database Sync
```typescript
// CRITICAL: Must sync Clerk users to database
await prisma.user.upsert({
  where: { clerkId: user.id },
  update: { email: user.emailAddresses[0].emailAddress },
  create: {
    clerkId: user.id,
    email: user.emailAddresses[0].emailAddress,
  }
});
```

### Environment Variables (Exact Format)
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
APIFY_TOKEN="apify_api_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

### Error Handling Pattern
```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: error.message };
}
```

### API Route Structure
```typescript
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
    
    const body = await request.json();
    // Process request
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## COMMON GOTCHAS (Learn From Mistakes)

### Apify Integration
- Data is ALWAYS in `items[0].element`, not `items[0]`
- Use both APIFY_TOKEN and APIFY_API_KEY (same value)
- Actor name: `harvestapi/linkedin-profile-scraper`
- Mode: "Profile details no email ($4 per 1k)"

### Clerk Authentication
- Must create user in database after Clerk signup
- Use webhooks or API route for user sync
- Both publishable and secret keys required
- Middleware must allow public routes

### Neon Database
- Requires both DATABASE_URL and DIRECT_URL
- Must include `?sslmode=require`
- Run `prisma generate` after schema changes
- Use `prisma db push` for development

### TypeScript Strict Mode
- No `any` types - use proper typing
- Handle undefined/null cases explicitly
- Use type assertions sparingly: `as ComponentType`
- Import types: `import type { User } from '@/types'`

### Vercel Deployment
- All environment variables must be set in dashboard
- Use `prisma generate && next build` as build command
- Check logs for deployment errors
- Redeploy after env var changes

### Next.js 15 App Router
- Use `export async function GET/POST` for API routes
- Server components can't use hooks
- Client components need `'use client'` directive
- Dynamic imports for SSR issues: `{ ssr: false }`

## DEVELOPMENT WORKFLOW

### Feature Development Process
1. Create `/prps/features/[name]/initial.md`
2. Generate PRP with AI assistance
3. Validate PRP (no secrets, correct structure)
4. Execute PRP implementation
5. Run validation gates
6. Test manually and deploy

### Validation Gates (Required)
```bash
npm run build       # TypeScript compilation
npm run typecheck   # Type checking  
npm run lint        # ESLint
npm test           # Unit tests
# Manual testing checklist
```

### PRP Framework Usage
- Use for all non-trivial features
- Include examples and gotchas
- Reference proven patterns
- Ask "what would make this 10/10?"

## V2 PHASE IMPLEMENTATION

### Phase 1: Foundation (Week 1)
- Next.js 15 + TypeScript + Tailwind
- Clerk authentication + user sync
- Neon PostgreSQL + Prisma
- LinkedIn scraping (proven pattern)
- Basic profile management
- Vercel deployment

### Phase 2: Enhanced Registration (Week 2-3)
- Apify MCP integration
- n8n workflow orchestration
- Multi-platform scraping (X, GitHub, Reddit)
- "Shock & Awe" user experience

### Phase 3: Multi-Model Intelligence (Month 1)
- Zen MCP for multi-model collaboration
- Complex decision support with Gemini
- Extended reasoning capabilities
- Advanced problem solving

## DO NOT INCLUDE HERE

❌ **Feature-specific logic** (use PRPs instead)
❌ **Temporary workarounds** (fix properly)
❌ **One-off solutions** (create patterns)
❌ **External API keys** (use environment variables)
❌ **User data** (maintain privacy)
❌ **Experimental code** (prove patterns first)

## AUTO-FIX SYSTEM

V2 includes sophisticated auto-fix for TypeScript errors:
- MCP-Vercel Server monitors deployments
- GitHub Actions workflow auto-fixes common issues
- 5-attempt limit with smart retry logic
- Handles imports, types, and syntax errors automatically

## SUCCESS METRICS

- **Day 1**: LinkedIn import working end-to-end
- **Week 1**: Deployed and usable by real users  
- **Week 2**: Enhanced registration with multi-platform scraping
- **Month 1**: Feature parity with V1 in 10% of code

## DESIGN SYSTEM

Quest Core uses premium dark theme:
- **Primary**: Aurora Fade (#00D4B8)
- **Secondary**: Electric Violet (#4F46E5)  
- **Accent**: Purple (#8B5CF6)
- **Background**: Deep Charcoal (#0A0E1A)
- **Cards**: Charcoal (#1A1D29)
- **Typography**: GT Walsheim

## CONTEXT ENGINEERING RULES

1. **Read CLAUDE.md first** for every session
2. **Use PRP framework** for complex features
3. **Validate before executing** all AI-generated code
4. **Update patterns** as you discover them
5. **Keep documentation current** with implementation

---

**Remember**: V1 taught us what to build. V2 is about building it right with radical simplification and proven patterns. Every line of code should directly serve user value.