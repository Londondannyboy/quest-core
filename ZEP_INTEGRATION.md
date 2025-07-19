# Zep Integration - Technical Implementation Guide

> **Architecture Decision**: Hybrid approach with PostgreSQL as single source of truth and Zep for conversational memory management

## 🎯 **Integration Overview**

### **Why Zep for Quest Core**
- **Temporal Knowledge Graphs**: Automatic extraction of relationships from conversations
- **Token Optimization**: 60-70% reduction in LLM context costs
- **Persistent Memory**: Cross-session continuity for voice coaching
- **Trinity Evolution**: Track how user's Quest, Service, Pledge evolve over time
- **Multi-Coach Context**: Shared memory across specialized AI coaches

### **Zep vs Neo4j Distinction**
- **Zep**: Conversational memory, behavioral insights, Trinity evolution
- **Neo4j**: Professional relationships, skill dependencies, company networks
- **PostgreSQL**: Single source of truth for all permanent data

## 🏗️ **Architecture Pattern**

### **Data Flow**
```
Voice Session → Zep → Extract Insights → Sync to PostgreSQL
     ↓                                          ↑
Conversational Memory                    Master Repository
     ↓                                          ↑
Multi-Coach Context ←--------------→ Professional Data
```

### **User ID Strategy**
```typescript
// Master ID: Clerk User ID everywhere
const MASTER_USER_ID = clerkUser.id; // e.g. "user_2NNEqL2nrIRdJ194ndJqAHwEfxC"

// PostgreSQL
user.id = clerkUser.id

// Zep
zep.user.add({ user_id: clerkUser.id })

// No ID translation needed
```

## 🚀 **Implementation Phases**

### **Phase 1: Core Integration (Week 1-2)**

#### **1.1 Environment Setup**
```bash
npm install zep-cloud
```

```env
# Add to .env.local
ZEP_API_KEY=your_zep_api_key_here
ZEP_PROJECT_ID=your_project_id_here
```

#### **1.2 User Management Integration**
```typescript
// lib/zep-client.ts
import { Zep } from 'zep-cloud'

const zep = new Zep({
  apiKey: process.env.ZEP_API_KEY!
})

export async function createZepUser(clerkUser: any) {
  try {
    const zepUser = await zep.user.add({
      user_id: clerkUser.id,  // Use Clerk ID directly
      email: clerkUser.emailAddresses[0].emailAddress,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      metadata: {
        created_at: new Date().toISOString(),
        source: 'quest_core',
        trinity_initialized: false
      }
    })
    
    return zepUser
  } catch (error) {
    console.error('Error creating Zep user:', error)
    throw error
  }
}

export async function initializeUserGraph(userId: string, profileData: any) {
  // Add initial professional data to user's graph
  await zep.graph.add({
    user_id: userId,
    type: 'json',
    data: JSON.stringify({
      profile: {
        name: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        quest_core_joined: new Date().toISOString()
      }
    })
  })
}
```

#### **1.3 Modify User Creation Flow**
```typescript
// Update existing user creation in middleware or auth callbacks
import { createZepUser, initializeUserGraph } from '@/lib/zep-client'

export async function createUser(clerkUser: ClerkUser) {
  // 1. Create in PostgreSQL (existing code)
  const dbUser = await prisma.user.create({
    data: {
      id: clerkUser.id,  // Clerk ID as primary key
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName
    }
  })
  
  // 2. Create in Zep with same ID
  try {
    await createZepUser(clerkUser)
    await initializeUserGraph(clerkUser.id, dbUser)
  } catch (error) {
    console.error('Zep user creation failed:', error)
    // Continue - Zep is enhancement, not critical path
  }
  
  return dbUser
}
```

### **Phase 2: Voice Coaching Integration (Week 2-3)**

#### **2.1 Enhanced Voice Session Management**
```typescript
// lib/voice-session.ts
import { zep } from '@/lib/zep-client'
import { Message } from 'zep-cloud/types'

export async function startVoiceSession(
  userId: string, 
  sessionType: 'trinity' | 'skills' | 'career' | 'wellness'
) {
  // Create Zep session
  const sessionId = `voice_${userId}_${Date.now()}`
  
  await zep.memory.add_session({
    session_id: sessionId,
    user_id: userId,
    metadata: {
      session_type: sessionType,
      started_at: new Date().toISOString(),
      platform: 'hume_voice'
    }
  })
  
  return sessionId
}

export async function addVoiceInteraction(
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  emotionalContext?: any
) {
  const messages: Message[] = [
    {
      role: "Human",
      content: userMessage,
      role_type: "user",
      metadata: {
        emotional_context: emotionalContext,
        timestamp: new Date().toISOString()
      }
    },
    {
      role: "AI Coach",
      content: aiResponse,
      role_type: "assistant",
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  ]
  
  await zep.memory.add(sessionId, { messages })
}
```

#### **2.2 Context-Aware Coaching**
```typescript
// lib/coaching-context.ts
export async function getCoachingContext(
  userId: string, 
  currentMessage: string,
  sessionId?: string
) {
  // Get relevant long-term facts from user's graph
  const relevantFacts = await zep.graph.search({
    user_id: userId,
    query: currentMessage,
    limit: 5,
    min_score: 0.7
  })
  
  // Get recent conversation history
  const recentHistory = sessionId 
    ? await zep.memory.get(sessionId, { limit: 10 })
    : null
  
  // Get Trinity context from PostgreSQL
  const trinityData = await prisma.trinity.findUnique({
    where: { userId }
  })
  
  return {
    relevantFacts: relevantFacts.facts || [],
    recentMessages: recentHistory?.messages || [],
    trinity: trinityData,
    contextSummary: relevantFacts.summary
  }
}
```

#### **2.3 Update HumeVoiceInterface.tsx**
```typescript
// Enhance existing voice interface
import { addVoiceInteraction, getCoachingContext } from '@/lib/voice-session'

export function HumeVoiceInterface({ sessionType, onEndSession }: Props) {
  const [zepSessionId, setZepSessionId] = useState<string>()
  
  // Start Zep session when voice session begins
  useEffect(() => {
    if (status.value === 'connected' && userId) {
      startVoiceSession(userId, sessionType).then(setZepSessionId)
    }
  }, [status.value, userId, sessionType])
  
  // Enhanced message processing with Zep integration
  const processVoiceMessage = async (userMessage: string) => {
    if (!zepSessionId || !userId) return
    
    // Get context before AI response
    const context = await getCoachingContext(userId, userMessage, zepSessionId)
    
    // Send to AI with enhanced context
    const aiResponse = await generateCoachingResponse(userMessage, context)
    
    // Store interaction in Zep
    await addVoiceInteraction(zepSessionId, userMessage, aiResponse)
    
    return aiResponse
  }
}
```

### **Phase 3: Multi-Coach Implementation (Week 3-4)**

#### **3.1 Shared Context Across Coaches**
```typescript
// lib/multi-coach.ts
interface CoachContext {
  role: 'master' | 'career' | 'skills' | 'leadership' | 'network'
  userContext: ZepContext
  conversationHistory: Message[]
  specialistFocus: string[]
}

export async function getSpecialistCoachContext(
  userId: string,
  coachRole: string,
  currentQuery: string
) {
  // Query Zep for coach-specific context
  const coachSpecificQuery = `${currentQuery} ${coachRole} expertise`
  
  const context = await zep.graph.search({
    user_id: userId,
    query: coachSpecificQuery,
    limit: 3,
    min_score: 0.7
  })
  
  return {
    role: coachRole,
    relevantFacts: context.facts,
    userHistory: context.summary,
    specialization: getCoachSpecialization(coachRole)
  }
}

function getCoachSpecialization(role: string): string[] {
  const specializations = {
    career: ['strategy', 'market_trends', 'positioning', 'transitions'],
    skills: ['technical_development', 'learning_paths', 'competency_gaps'],
    leadership: ['management', 'communication', 'team_building'],
    network: ['relationships', 'networking', 'professional_connections']
  }
  
  return specializations[role] || []
}
```

#### **3.2 Master Coach Orchestration**
```typescript
// lib/master-coach.ts
export async function orchestrateCoachingSession(
  userId: string,
  userQuery: string,
  sessionId: string
) {
  // 1. Master coach analyzes query and determines needed specialists
  const masterAnalysis = await analyzeMasterCoachNeed(userQuery)
  
  // 2. Get context from Zep for each needed specialist
  const specialistContexts = await Promise.all(
    masterAnalysis.neededCoaches.map(coach =>
      getSpecialistCoachContext(userId, coach, userQuery)
    )
  )
  
  // 3. Generate specialist responses
  const specialistResponses = await generateSpecialistResponses(
    userQuery,
    specialistContexts
  )
  
  // 4. Master coach synthesizes final response
  const masterResponse = await generateMasterSynthesis(
    userQuery,
    specialistResponses,
    await getCoachingContext(userId, userQuery, sessionId)
  )
  
  // 5. Store complete interaction in Zep
  await addVoiceInteraction(sessionId, userQuery, masterResponse.content)
  
  return {
    masterResponse,
    specialistInputs: specialistResponses,
    coachingFlow: masterAnalysis.flow
  }
}
```

### **Phase 4: PostgreSQL Sync (Week 4)**

#### **4.1 Session Insights Sync**
```typescript
// lib/session-sync.ts
export async function syncSessionInsights(
  userId: string,
  sessionId: string
) {
  try {
    // Get session summary from Zep
    const sessionSummary = await zep.memory.get_session_summary(sessionId)
    
    // Extract key insights
    const insights = {
      keyPoints: sessionSummary.key_points || [],
      trinityUpdates: sessionSummary.trinity_changes || {},
      goalsProgress: sessionSummary.goal_updates || [],
      emotionalInsights: sessionSummary.emotional_patterns || {}
    }
    
    // Store in PostgreSQL
    await prisma.coachingSession.create({
      data: {
        userId,
        sessionId,
        sessionType: sessionSummary.metadata?.session_type,
        insights: insights,
        duration: sessionSummary.duration_minutes,
        satisfaction: sessionSummary.user_satisfaction,
        sourceSystem: 'zep',
        createdAt: new Date()
      }
    })
    
    // Update Trinity if changed
    if (insights.trinityUpdates && Object.keys(insights.trinityUpdates).length > 0) {
      await updateTrinityFromZep(userId, insights.trinityUpdates)
    }
    
    return insights
  } catch (error) {
    console.error('Session sync failed:', error)
    throw error
  }
}

async function updateTrinityFromZep(userId: string, trinityUpdates: any) {
  const existingTrinity = await prisma.trinity.findUnique({
    where: { userId }
  })
  
  const updatedTrinity = {
    ...existingTrinity,
    quest: trinityUpdates.quest || existingTrinity?.quest,
    service: trinityUpdates.service || existingTrinity?.service,
    pledge: trinityUpdates.pledge || existingTrinity?.pledge,
    lastUpdated: new Date(),
    updatedVia: 'zep_session'
  }
  
  await prisma.trinity.upsert({
    where: { userId },
    update: updatedTrinity,
    create: { userId, ...updatedTrinity }
  })
}
```

#### **4.2 Real-time Business Data Sync**
```typescript
// lib/business-data-sync.ts
export async function syncBusinessDataToZep(userId: string) {
  // Get latest profile data from PostgreSQL
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      workExperience: {
        include: { company: true }
      },
      skills: {
        include: { skill: true }
      },
      education: {
        include: { institution: true }
      },
      trinity: true
    }
  })
  
  if (!userData) return
  
  // Format for Zep graph
  const businessData = {
    profile: {
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      current_role: userData.workExperience[0]?.title,
      current_company: userData.workExperience[0]?.company?.name
    },
    work_history: userData.workExperience.map(exp => ({
      title: exp.title,
      company: exp.company.name,
      duration: `${exp.startDate} to ${exp.endDate || 'present'}`,
      achievements: exp.achievements
    })),
    skills: userData.skills.map(skill => ({
      name: skill.skill.name,
      proficiency: skill.proficiencyLevel,
      experience_years: skill.yearsOfExperience
    })),
    trinity: userData.trinity ? {
      quest: userData.trinity.quest,
      service: userData.trinity.service,
      pledge: userData.trinity.pledge,
      last_updated: userData.trinity.lastUpdated
    } : null
  }
  
  // Add to Zep graph
  await zep.graph.add({
    user_id: userId,
    type: 'json',
    data: JSON.stringify(businessData)
  })
}
```

## 🔧 **API Integrations**

### **Voice Coaching API Updates**
```typescript
// pages/api/hume-clm-sse/chat/completions/route.ts
import { getCoachingContext, addVoiceInteraction } from '@/lib/voice-session'

export async function POST(request: Request) {
  const { message, userId, sessionId } = await request.json()
  
  try {
    // Get Zep context
    const context = await getCoachingContext(userId, message, sessionId)
    
    // Generate response with context
    const response = await generateContextualResponse(message, context)
    
    // Store in Zep
    await addVoiceInteraction(sessionId, message, response)
    
    return NextResponse.json({ response, context: context.contextSummary })
  } catch (error) {
    console.error('Voice coaching error:', error)
    return NextResponse.json({ error: 'Coaching failed' }, { status: 500 })
  }
}
```

### **Session Management API**
```typescript
// pages/api/coaching/session/route.ts
export async function POST(request: Request) {
  const { userId, sessionType } = await request.json()
  
  try {
    // Start both Hume and Zep sessions
    const zepSessionId = await startVoiceSession(userId, sessionType)
    
    return NextResponse.json({
      sessionId: zepSessionId,
      status: 'started',
      sessionType
    })
  } catch (error) {
    return NextResponse.json({ error: 'Session start failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { sessionId, userId } = await request.json()
  
  try {
    // Sync insights before ending
    await syncSessionInsights(userId, sessionId)
    
    return NextResponse.json({ status: 'session_ended' })
  } catch (error) {
    return NextResponse.json({ error: 'Session end failed' }, { status: 500 })
  }
}
```

## 📊 **Monitoring & Analytics**

### **Zep Performance Metrics**
```typescript
// lib/zep-analytics.ts
export async function getZepPerformanceMetrics(userId: string) {
  try {
    // Query recent sessions
    const sessions = await zep.memory.search_sessions({
      user_id: userId,
      limit: 10
    })
    
    // Calculate metrics
    return {
      total_sessions: sessions.length,
      avg_session_length: calculateAverageLength(sessions),
      context_retrieval_speed: await measureContextSpeed(userId),
      memory_efficiency: calculateMemoryEfficiency(sessions),
      trinity_evolution: await getTrinityEvolutionMetrics(userId)
    }
  } catch (error) {
    console.error('Zep analytics error:', error)
    return null
  }
}

async function measureContextSpeed(userId: string): Promise<number> {
  const start = Date.now()
  
  await zep.graph.search({
    user_id: userId,
    query: "test query",
    limit: 3
  })
  
  return Date.now() - start
}
```

## 🚨 **Error Handling & Fallbacks**

### **Graceful Degradation**
```typescript
// lib/zep-fallback.ts
export async function getContextWithFallback(
  userId: string,
  query: string,
  sessionId?: string
) {
  try {
    // Try Zep first
    return await getCoachingContext(userId, query, sessionId)
  } catch (error) {
    console.error('Zep unavailable, falling back to PostgreSQL:', error)
    
    // Fallback to PostgreSQL only
    return await getPostgreSQLContext(userId)
  }
}

async function getPostgreSQLContext(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      trinity: true,
      workExperience: true,
      skills: true
    }
  })
  
  return {
    relevantFacts: [],
    recentMessages: [],
    trinity: userData?.trinity,
    contextSummary: `Fallback context for ${userData?.firstName}`
  }
}
```

### **Data Consistency Checks**
```typescript
// lib/data-consistency.ts
export async function validateZepPostgreSQLSync(userId: string) {
  try {
    // Get Trinity from both systems
    const [zepTrinity, pgTrinity] = await Promise.all([
      getZepTrinityData(userId),
      prisma.trinity.findUnique({ where: { userId } })
    ])
    
    // Compare and flag inconsistencies
    const inconsistencies = compareTrinitySources(zepTrinity, pgTrinity)
    
    if (inconsistencies.length > 0) {
      console.warn('Trinity sync inconsistencies:', inconsistencies)
      // Optional: Auto-resolve or alert
    }
    
    return { consistent: inconsistencies.length === 0, issues: inconsistencies }
  } catch (error) {
    console.error('Consistency check failed:', error)
    return { consistent: false, error: error.message }
  }
}
```

## 🔐 **Security & Privacy**

### **Data Encryption in Zep**
```typescript
// lib/zep-security.ts
export async function addSensitiveDataToZep(
  userId: string,
  data: any,
  encryptionLevel: 'standard' | 'high'
) {
  // Zep handles encryption, but we can add metadata about sensitivity
  await zep.graph.add({
    user_id: userId,
    type: 'json',
    data: JSON.stringify(data),
    metadata: {
      sensitivity_level: encryptionLevel,
      data_classification: 'personal_professional',
      retention_policy: '7_years'
    }
  })
}
```

### **GDPR Compliance**
```typescript
// lib/gdpr-zep.ts
export async function deleteUserFromZep(userId: string) {
  try {
    // Delete all user sessions
    const sessions = await zep.memory.search_sessions({
      user_id: userId,
      limit: 1000
    })
    
    for (const session of sessions) {
      await zep.memory.delete_session(session.id)
    }
    
    // Delete user graph data
    await zep.user.delete(userId)
    
    return { success: true, deleted_sessions: sessions.length }
  } catch (error) {
    console.error('Zep user deletion failed:', error)
    throw error
  }
}

export async function exportUserZepData(userId: string) {
  try {
    // Export all user data from Zep
    const [sessions, graphData] = await Promise.all([
      zep.memory.search_sessions({ user_id: userId, limit: 1000 }),
      zep.graph.get_subgraph(userId)
    ])
    
    return {
      sessions: sessions,
      knowledge_graph: graphData,
      exported_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Zep data export failed:', error)
    throw error
  }
}
```

## 📋 **Implementation Checklist**

### **Phase 1: Core Setup**
- [ ] Install Zep SDK and configure environment
- [ ] Update user creation flow to include Zep
- [ ] Test user ID consistency across systems
- [ ] Implement basic session management

### **Phase 2: Voice Integration**
- [ ] Enhance HumeVoiceInterface with Zep session tracking
- [ ] Implement context retrieval for coaching responses
- [ ] Add conversation storage to Zep
- [ ] Test voice coaching with memory continuity

### **Phase 3: Multi-Coach System**
- [ ] Implement specialist coach context retrieval
- [ ] Build master coach orchestration
- [ ] Test debate management with shared context
- [ ] Validate coaching quality with Zep context

### **Phase 4: Data Sync**
- [ ] Implement session insights sync to PostgreSQL
- [ ] Create business data sync to Zep
- [ ] Build consistency validation tools
- [ ] Test full data flow integrity

### **Phase 5: Production Readiness**
- [ ] Implement error handling and fallbacks
- [ ] Add performance monitoring
- [ ] Ensure GDPR compliance
- [ ] Create backup and recovery procedures

---

**Zep Integration** - Bringing persistent memory and temporal knowledge graphs to Quest Core's AI coaching system for truly personalized professional development.