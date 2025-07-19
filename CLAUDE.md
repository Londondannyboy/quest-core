# Quest Core - AI Assistant Context

> **Context document for AI assistants working on Quest Core development**

## 🎯 **Project Overview**

Quest Core is a revolutionary professional development platform that guides users through discovering their authentic professional identity via the Trinity system: **Quest** (what drives you), **Service** (how you serve), and **Pledge** (what you commit to).

> "LinkedIn shows who you were. Quest shows who you're becoming."

### **Core Philosophy**
Built using Cole Medin's advanced context engineering methodology to create AI-powered coaching that remembers, evolves, and provides genuinely personalized guidance.

## 🏗️ **Current Architecture**

### **Technology Stack**
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Authentication**: Clerk (user management)
- **Database**: PostgreSQL (Neon) - Single source of truth
- **AI & Voice**: Hume AI EVI, OpenAI GPT-4, Zep (memory management)
- **Future**: Neo4j (professional relationship graphs)
- **Deployment**: Vercel with auto-fix deployment system

### **Data Architecture Decision**
**Hybrid approach with single source of truth**:

1. **PostgreSQL (Neon)** - Master repository for all user data
2. **Zep** - Conversational memory and behavioral insights
3. **Neo4j** (future) - Professional relationship graphs
4. **Clerk** - Authentication (master user ID source)

## 🎯 **Trinity System**

### **The Three Eternal Questions**
1. **Quest** - "What drives you?" (Purpose and motivation)
2. **Service** - "How do you serve?" (Unique contribution to others)
3. **Pledge** - "What do you commit to?" (Promises and accountability)

### **AI Coaching Architecture**
Multi-coach system with specialized AI agents:
- **Master Coach**: Orchestrator and final authority
- **Career Coach**: Long-term strategy and market positioning
- **Skills Coach**: Technical development and competency building
- **Leadership Coach**: Management and interpersonal growth
- **Network Coach**: Professional relationships and networking

## 🗂️ **4-Layer Repository System**

### **Privacy Model**
- **Surface Repo**: Public LinkedIn-style profiles
- **Working Repo**: Selective portfolio with controlled access
- **Personal Repo**: Private goals, notes, development tracking
- **Deep Repo**: AI insights, Trinity analysis, system-managed

## 🔄 **Current Development Status**

### **✅ Completed Features**
- Complete user authentication with Clerk + database integration
- Profile system with searchable companies, skills, institutions
- 3D visualization with React Force Graph
- Voice coaching with Hume AI integration
- Zero-approval auto-fix deployment system
- MCP-Vercel integration for deployment monitoring

### **🚧 In Progress**
- Zep integration for conversational memory
- Multi-coach AI system implementation
- Enhanced context engineering

### **📋 Next Priorities**
1. Zep integration for persistent conversation memory
2. Multi-coach orchestration system
3. Neo4j integration for professional relationship intelligence
4. Advanced Trinity system development

## 🛠️ **Development Guidelines**

### **Code Style**
- TypeScript with strict typing
- Component-based React architecture
- Tailwind CSS for styling
- Prisma ORM for database operations

### **Key Commands**
```bash
npm run dev              # Development server
npm run build            # Production build (includes Prisma generation)
npm run lint             # ESLint checking
npm run type-check       # TypeScript validation
```

### **Database Operations**
```bash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes
npx prisma studio        # Database GUI
```

## 🔑 **Environment Variables**

### **Required Services**
- **Database**: Neon PostgreSQL connection
- **Authentication**: Clerk keys (public/secret)
- **AI Services**: OpenAI API key, Hume AI credentials
- **Memory**: Zep API key and configuration
- **Deployment**: Vercel integration

### **Configuration Files**
- `.env.local` - Local development environment
- `.env.example` - Template with required variables
- `prisma/schema.prisma` - Database schema definition

## 🎤 **Voice Coaching Integration**

### **Hume AI Setup**
- Empathic voice conversations with emotional intelligence
- Real-time coaching feedback and guidance
- Session continuity with memory preservation
- Multiple coaching modes: Trinity, Skills, Career, Wellness

### **Voice Session Flow**
1. User initiates voice session via interface
2. Hume AI processes speech and emotional context
3. System queries Zep for relevant user history
4. AI coaches provide contextual guidance
5. Session insights stored in both Zep and PostgreSQL

## 🧠 **AI Context Engineering**

### **Zep Integration Pattern**
```typescript
// User session management
const sessionId = await zep.memory.add_session({
  session_id: generateSessionId(),
  user_id: clerkUserId,  // Consistent ID across systems
  metadata: { sessionType, coach }
});

// Context retrieval
const relevantFacts = await zep.graph.search({
  user_id: userId,
  query: userMessage,
  limit: 3,
  min_score: 0.7
});
```

### **Multi-Coach Orchestration**
- Single LLM with specialized system prompts
- Master Coach manages conversation flow and conflicts
- Specialist coaches provide domain expertise
- Debate management with authority hierarchy

## 📊 **Data Flow Architecture**

### **User ID Strategy**
- **Master ID**: Clerk user ID used across all systems
- **PostgreSQL**: Stores user with Clerk ID as primary key
- **Zep**: Uses same Clerk ID for consistency
- **Neo4j** (future): Will use Clerk ID for user nodes

### **Sync Strategy**
```typescript
// After each coaching session
const insights = await zep.memory.get_session_summary(sessionId);
await prisma.userInsight.create({
  data: {
    userId: clerkUserId,
    insights: insights.key_points,
    trinityUpdates: insights.extracted_trinity,
    sourceSystem: 'zep'
  }
});
```

## 🚀 **Deployment & Operations**

### **Auto-Fix System**
- GitHub Actions workflow for deployment monitoring
- Automatic error detection and correction
- 5-attempt retry logic with manual fallback
- Zero-approval development operations

### **MCP-Vercel Integration**
- Real-time deployment status monitoring
- Automatic failure detection
- Integration with Claude Code for hands-free fixes

## 🔒 **Security & Privacy**

### **User Data Protection**
- Four-layer privacy model with granular control
- Clerk authentication with secure session management
- Encrypted context storage in Zep
- GDPR-compliant data handling

### **API Security**
- Environment-based configuration
- Secure API key management
- User isolation in all data systems

## 📚 **Key Documentation Files**

### **Architecture Documents**
- `DATA_ARCHITECTURE.md` - Complete data strategy
- `ZEP_INTEGRATION.md` - Zep implementation details
- `MULTI_COACH_AI_ARCHITECTURE.md` - AI coaching system design

### **Status Documents**
- `CURRENT_STATUS.md` - Development progress
- `NEXT_SESSION_TODO.md` - Immediate priorities
- `PRODUCT_REQUIREMENTS.md` - Feature specifications

### **Process Documents**
- `DEVELOPMENT.md` - Development workflows
- `AUTO_FIX_SYSTEM.md` - Deployment automation
- `VOICE_INTEGRATION_SUCCESS.md` - Voice setup guide

## 🎯 **Success Metrics**

### **User Experience**
- Trinity completion and evolution tracking
- Voice coaching engagement and satisfaction
- Goal achievement and progress monitoring
- Professional development outcomes

### **Technical Performance**
- Zep context retrieval latency (target: <300ms)
- Voice coaching response quality
- Multi-coach conversation coherence
- Deployment reliability (99%+ uptime)

## 🤝 **Contributing Guidelines**

### **Development Workflow**
1. Read relevant documentation files
2. Update `CURRENT_STATUS.md` with progress
3. Use auto-fix system for deployment errors
4. Maintain consistent user ID strategy
5. Test both voice and web interfaces

### **Code Review Focus**
- TypeScript type safety
- Zep integration patterns
- User data privacy compliance
- Voice coaching UX quality

---

**Quest Core** - Discover your authentic professional identity through AI-powered coaching and intelligent skill development.

*Built with ❤️ using Cole Medin's context engineering patterns and Zep's temporal knowledge graphs*