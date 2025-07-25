# Quest Core V2 - Environment Setup Guide

Complete guide to set up your development environment for Quest Core V2.

## Prerequisites

- Node.js 18+ and npm
- Git
- VS Code (recommended)
- Terminal/Command line access

## 1. Project Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/quest-core-v2.git
cd quest-core-v2

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

## 2. Environment Variables

Edit `.env.local` with your API keys:

### Database (Neon PostgreSQL)
```env
# Get from https://neon.tech
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
```
- Both URLs are needed (pooled vs direct)
- Must include `?sslmode=require`

### Authentication (Clerk)
```env
# Get from https://clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```
- Both keys required
- Publishable key starts with `pk_`
- Secret key starts with `sk_`

### LinkedIn Scraping (Apify)
```env
# Get from https://apify.com
APIFY_TOKEN="apify_api_..."
APIFY_API_KEY="apify_api_..."  # Same as token
APIFY_USER_ID="your_user_id"
```
- All three variables needed for compatibility
- Token and API key are the same value

### AI Services (OpenRouter)
```env
# Get from https://openrouter.ai
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```
- Enables multi-model AI routing
- Required for coaching features

### Voice Coaching (Hume AI) - Optional
```env
# Get from https://hume.ai
HUME_API_KEY="your_hume_key"
```
- Only needed for voice coaching features
- Can be added later

### Enhanced Registration (Phase 2) - Optional
```env
# For Zen MCP multi-model collaboration
GEMINI_API_KEY="your_gemini_key"
OPENAI_API_KEY="sk-..."

# For n8n workflow automation
N8N_BASE_URL="your_n8n_instance"
N8N_API_KEY="your_n8n_key"
```

## 3. Service Setup Instructions

### 3.1 Neon Database Setup
1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy connection string from dashboard
4. Use for both `DATABASE_URL` and `DIRECT_URL`

### 3.2 Clerk Authentication Setup
1. Go to [clerk.com](https://clerk.com)
2. Create application
3. Configure sign-in/sign-up methods
4. Copy API keys from dashboard
5. Add webhook endpoint: `https://yourapp.vercel.app/api/webhooks/clerk`

### 3.3 Apify Setup
1. Go to [apify.com](https://apify.com)
2. Create account
3. Go to Settings → Integrations
4. Copy API token and User ID
5. Test with LinkedIn Profile Scraper actor

### 3.4 OpenRouter Setup
1. Go to [openrouter.ai](https://openrouter.ai)
2. Create account and add credits
3. Generate API key
4. Test with Claude or GPT models

## 4. Database Initialization

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

## 5. Development Server

```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## 6. Validation

Test your setup:

```bash
# Check TypeScript compilation
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests (if any)
npm test
```

## 7. Vercel Deployment Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Important:** Add all environment variables in Vercel dashboard under Settings → Environment Variables.

## 8. MCP Servers Setup (Phase 2+)

### Claude Desktop Configuration
Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["@apify/mcp-server"],
      "env": {
        "APIFY_API_TOKEN": "your_token"
      }
    },
    "zen": {
      "command": "npx", 
      "args": ["@199biotechnologies/zen-mcp"],
      "env": {
        "GEMINI_API_KEY": "your_key",
        "OPENAI_API_KEY": "your_key"
      }
    }
  }
}
```

## 9. Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**
```bash
npm run typecheck
# Fix errors, then retry build
```

**Database connection fails:**
- Check DATABASE_URL format
- Ensure `?sslmode=require` is included
- Verify Neon database is running

**Clerk authentication not working:**
- Check both publishable and secret keys
- Verify webhook URL in Clerk dashboard
- Ensure user sync API is working

**Apify scraping returns empty data:**
- Remember: data is in `items[0].element`
- Check API token and user ID
- Verify actor permissions

### Getting Help

1. Check [CLAUDE.md](./CLAUDE.md) for context
2. Review [V2 Complete Learnings](./QUEST_CORE_V2_COMPLETE_LEARNINGS.md)
3. Use GitHub Issues for bugs
4. Follow the PRP framework for new features

## 10. Production Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Database migrations run
- [ ] Clerk webhooks configured
- [ ] API rate limits considered
- [ ] Error monitoring setup
- [ ] Backup strategy in place

---

**Your V2 environment is ready! Start building with the methodology guide.** 🚀