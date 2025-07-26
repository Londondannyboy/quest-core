# Quest Core V2 - Complete Product Requirements

> **Single Source of Truth for V2 Implementation**  
> **Last Updated**: January 26, 2025  
> **Status**: Ready for Implementation  
> **Philosophy**: Story → Trinity → Quest  

---

## 📋 **Table of Contents**

1. [Executive Summary](#executive-summary)
2. [Core Product Vision](#core-product-vision)
3. [User Journey Architecture](#user-journey-architecture)
4. [Data & Entity Management](#data--entity-management)
5. [AI & Voice Coaching System](#ai--voice-coaching-system)
6. [Technical Requirements](#technical-requirements)
7. [Implementation Phases](#implementation-phases)
8. [Success Metrics](#success-metrics)

---

## 🎯 **Executive Summary**

Quest Core V2 transforms professional development from a transactional platform to a transformational journey where users must **earn their Quest through story**. 

**Key Differentiators:**
- Users don't "sign up" - they begin their "story"
- 30% must earn Quest readiness (aspirational scarcity)
- Trinity evolves through time (Past → Present → Future)
- Entity-based data (no strings, only validated objects)
- Multi-voice coaching with signature transitions

**Scoring Evolution**: Legacy (6.5/10) → Current (7.6/10) → V2 (9.1/10)

---

## 🏔️ **Core Product Vision**

### **The Sacred Journey**
```
Story Collection → Trinity Recognition → Quest Readiness → Quest Activation
     (Act 1)           (Act 2)              (Gate)           (Begin)
```

### **Philosophy**
- **Quest**: "What drives you?" (Purpose)
- **Service**: "How do you serve?" (Value)
- **Pledge**: "What do you commit to?" (Promise)

### **Manifesto Principles**
1. Every feature must serve the Story → Trinity → Quest journey
2. Human dignity over conversion optimization
3. Earned access creates aspiration
4. Coaches guide, users discover
5. Data serves story, not surveillance

---

## 🎭 **User Journey Architecture**

### **Act 1: Professional Mirror (3-5 minutes)**

#### **Entry Point**
- LinkedIn URL or name search
- Consent: "May we discover your professional story?"

#### **Mirror Presentation**
```typescript
interface ProfessionalMirror {
  visualization: "Timeline with floating nodes",
  messaging: "This is how the world sees you",
  corrections: "Click any node to correct our understanding",
  transparency: "Here's what we found (and might have missed)"
}
```

#### **Enhanced Discovery**
- **Phase 1**: LinkedIn via Apify
- **Phase 2**: Tavily web search (articles, talks, GitHub)
- **Phase 3**: LinkUp market intelligence

#### **Voice**: Story Coach (Female, Warm)
- "Tell me about this transition..."
- "What drew you to [field]?"
- "I notice a pattern here..."

### **Act 2: Trinity Evolution (5-7 minutes)**

#### **Trinity Through Time**
```typescript
interface TrinityEvolution {
  past: {
    quest: "What drove you then?",
    visual: "Faded constellation forming"
  },
  present: {
    quest: "What drives you now?",
    visual: "Bright, active constellation"
  },
  future: {
    quest: "What will drive you?",
    visual: "Emerging, pulsing constellation"
  }
}
```

#### **Pattern Recognition**
- AI identifies themes across timeline
- Coaches highlight evolution
- User validates or corrects

#### **Voice Transition**: Quest Coach (Male, CA/UK)
- *Signature sound effect*
- "Welcome to your Quest. I see your Trinity emerging..."
- More energetic, forward-looking

### **Act 3: Quest Readiness Gate**

#### **Assessment Algorithm**
```typescript
const readinessScore = 
  (storyDepth * 0.3) +        // How much they shared
  (trinityClarity * 0.4) +    // How clear their purpose
  (futureOrientation * 0.3);  // How ready for growth

if (readinessScore >= 70) return "QUEST_READY";
if (readinessScore >= 40) return "PREPARING";
return "NOT_YET";
```

#### **Three Outcomes**
1. **Quest Ready (70%)**: Proceed to Quest activation
2. **Preparing (25%)**: Guided exercises to clarify
3. **Not Yet (5%)**: Supportive redirection

#### **Voice**: OKR/Delivery Coach (Firm, Achievement-focused)
- "I'm taking over now. Let's make this real..."
- "Your Quest requires commitment. Are you ready?"

---

## 🗄️ **Data & Entity Management**

### **Entity-First Architecture**

#### **Core Principle**
Every piece of data is an entity with relationships - NO STRINGS.

#### **Entity Types**
```typescript
interface EntitySystem {
  companies: {
    verified: boolean,
    lastScraped: Date,
    parentCompany?: Company,
    subsidiaries: Company[],
    validatedBy: User[]
  },
  skills: {
    name: string,
    cluster: SkillCluster,
    parentSkill?: Skill,
    relatedSkills: Skill[],
    marketDemand: number
  },
  education: {
    institution: Entity,
    verified: boolean,
    ranking?: number,
    specialties: string[]
  }
}
```

### **Synthetic Organizations**

#### **Concept**
When scraping reveals companies/people, create "synthetic" provisional entities that users validate.

```typescript
interface SyntheticEntity {
  type: "company" | "person" | "skill",
  confidence: number,  // AI confidence in accuracy
  status: "provisional" | "validated" | "rejected",
  validators: User[],  // Users who confirmed
  created: Date,
  source: "linkedin" | "tavily" | "user"
}
```

#### **Validation Flow**
1. Scrape creates provisional entities
2. Display with transparency: "We think this is..."
3. User validates/corrects
4. Validated entities become "real"
5. Build trust network of confirmations

### **Skill Clustering & Intelligence**

#### **AI-Powered Taxonomy**
```typescript
interface SkillCluster {
  name: "Digital Marketing",
  coreSkills: ["SEO", "SEM", "Content Marketing"],
  emergingSkills: ["AI Marketing", "Voice Search"],
  parentCluster: "Marketing",
  demandTrend: "increasing",
  salaryPremium: 15  // % above base
}
```

#### **Dynamic Grouping**
- AI groups related skills automatically
- Market data informs clustering
- User corrections improve taxonomy
- Visualizations show skill relationships

### **Caching & Deduplication**

#### **Smart Rescraping**
```typescript
const shouldRescrape = (entity: Entity): boolean => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return entity.lastScraped < sixMonthsAgo || 
         entity.majorEventFlag || 
         entity.userRequested;
};
```

#### **Deduplication Strategy**
1. Fuzzy matching on names
2. Domain matching for companies
3. LinkedIn URL as unique identifier
4. User validation for conflicts

---

## 🤖 **AI & Voice Coaching System**

### **Multi-Coach Personalities**

#### **1. Story Coach** (Biographer)
- **Voice**: Female, warm, patient
- **Accent**: Gentle British or Midwest American
- **Tone**: Curious, non-judgmental
- **Focus**: Drawing out authentic story

#### **2. Quest Coach** (Pattern Seeker)
- **Voice**: Male, energetic
- **Accent**: California or British
- **Tone**: Insightful, connecting dots
- **Signature**: Transition sound when taking over

#### **3. OKR/Delivery Coach** (Achievement Driver)
- **Voice**: Gender-neutral, firm
- **Accent**: Clear, authoritative
- **Tone**: Direct, results-focused
- **Focus**: Turning insights into action

### **Voice Transitions**
```typescript
interface VoiceTransition {
  trigger: "Trinity clarity reached" | "Quest readiness achieved",
  effect: "Signature sound + brief silence",
  announcement: "New coach introduces themselves",
  continuity: "References previous coach's insights"
}
```

### **AI Model Strategy** (via OpenRouter)

#### **Cost-Optimized Routing**
```typescript
const modelSelection = {
  storyCoach: "anthropic/claude-3-sonnet",     // Empathetic
  questCoach: "openai/gpt-4-turbo",           // Insightful
  deliveryCoach: "moonshotai/kimi-k2",        // Direct, efficient
  skillsAnalysis: "moonshotai/kimi-k2:free",  // Cost-effective
  patternRecognition: "google/gemini-pro"      // Large context
};
```

### **Journey-Aware Responses**
- Voice intensity increases near Quest
- Language becomes more action-oriented
- Celebration at milestones
- Adaptive to user energy

---

## 🛠️ **Technical Requirements**

### **Core Stack**
- **Frontend**: Next.js 15, React 18, TypeScript
- **Database**: PostgreSQL (Neon) + Neo4j (relationships)
- **Auth**: Clerk with proper webhook sync
- **AI Gateway**: OpenRouter for multi-model access
- **Voice**: Hume AI EVI 3 with voice cloning

### **Data Services**
- **Primary Scraping**: Apify (LinkedIn + 5000 actors)
- **Web Search**: Tavily AI search
- **Market Intelligence**: LinkUp API
- **Workflow**: n8n for orchestration

### **Visualization**
- **Journey Graph**: React Force Graph 3D
- **Quest Node**: Pulsing based on proximity
- **Timeline**: Three.js custom implementation
- **Skills Network**: D3.js clustering

### **Performance Requirements**
- Page load: <2 seconds
- Voice response: <500ms
- Graph rendering: 60fps @ 1000 nodes
- Cost per user: <$0.50/month

### **Security Requirements**
- Semgrep from Day 1 (5000+ rules)
- API key rotation policy
- Audit trail for all data access
- GDPR-compliant data handling

---

## 📅 **Implementation Phases**

### **Phase 1: Foundation (Weeks 1-2)**

#### **Core Journey**
- [ ] Story → Trinity → Quest flow
- [ ] Professional Mirror with LinkedIn
- [ ] Basic voice coaching (single voice)
- [ ] Quest Readiness Gate logic

#### **Entity System**
- [ ] Company, Skill, Education entities
- [ ] Deduplication logic
- [ ] Basic validation UI
- [ ] Synthetic entity creation

#### **Infrastructure**
- [ ] Semgrep security scanning
- [ ] Monitoring (Checkly + HyperDX)
- [ ] Error tracking and recovery
- [ ] Basic analytics

### **Phase 2: Enhancement (Weeks 3-4)**

#### **Discovery**
- [ ] Tavily web search integration
- [ ] Multi-platform enrichment
- [ ] Company hierarchy mapping
- [ ] Skill clustering AI

#### **Voice Evolution**
- [ ] Multi-coach personalities
- [ ] Voice transitions
- [ ] EVI 3 migration
- [ ] Journey-aware responses

#### **Relationships**
- [ ] Neo4j integration
- [ ] Professional network graph
- [ ] Synthetic relationship validation
- [ ] Network effects tracking

### **Phase 3: Intelligence (Weeks 5-6)**

#### **Market Intelligence**
- [ ] LinkUp integration
- [ ] Salary benchmarking
- [ ] Skill demand tracking
- [ ] Geographic insights

#### **Advanced AI**
- [ ] Kimi K2 optimization
- [ ] Multi-model debates
- [ ] Pattern recognition
- [ ] Predictive Quest paths

#### **Scale Features**
- [ ] Workflow automation (n8n)
- [ ] Bulk entity validation
- [ ] Community features
- [ ] Performance optimization

---

## 📊 **Success Metrics**

### **Journey Metrics**
- **Story Completion**: >80% finish Act 1
- **Trinity Clarity**: >70% achieve clear Trinity
- **Quest Readiness**: 30% earn Quest (aspirational)
- **Time to Quest**: 15-20 minutes average

### **Data Quality**
- **Entity Validation Rate**: >60% user validates
- **Deduplication Success**: <5% duplicates
- **Skill Clustering Accuracy**: >85% user agreement
- **Rescrape Efficiency**: <10% unnecessary scrapes

### **Business Metrics**
- **Cost per User**: <$0.50/month
- **Conversion to Paid**: >40% of Quest Ready
- **Monthly Retention**: >75%
- **User Satisfaction**: >4.5/5 stars

### **Technical Performance**
- **Uptime**: 99.9%
- **Response Time**: <500ms p95
- **Error Rate**: <0.1%
- **Security Incidents**: 0

---

## 🚀 **Key Differentiators**

1. **Philosophy-Driven**: Every feature serves Story → Trinity → Quest
2. **Earned Access**: Quest must be earned, creating aspiration
3. **Entity Intelligence**: No strings, only validated objects
4. **Voice Journey**: Coaches with personality transitions
5. **Temporal Trinity**: Past → Present → Future evolution

---

## 📋 **Implementation Checklist**

### **Before Starting**
- [ ] All API keys secured (Clerk, OpenRouter, Hume, Apify, Tavily)
- [ ] Database schemas migrated for entities
- [ ] Monitoring stack configured
- [ ] Security scanning enabled

### **Week 1 Deliverables**
- [ ] Professional Mirror working with real LinkedIn data
- [ ] Entity system creating companies/skills
- [ ] Basic voice coach responding
- [ ] Trinity visualization rendering

### **Definition of Done**
- [ ] User can complete Story → Trinity → Quest journey
- [ ] Entities are validated and deduplicated
- [ ] Voice coaches transition naturally
- [ ] Performance meets all benchmarks

---

## 🎯 **Final Note**

This document consolidates all V2 requirements into a single source of truth. Archive other V2 docs except:
- **V2_TECH_STACK.md** (technical reference)
- **V2_STYLE_GUIDE.md** (design reference)
- **CLAUDE.md** (AI assistant context)

Everything needed to build Quest Core V2 is here. Let the implementation begin.

---

*"You can't begin your Quest until we understand your story."*