# EVI 3 Migration Guide for Quest Core V2

> **CRITICAL UPDATE**: Hume AI EVI 3 API is now available, bringing speech-to-speech capabilities and voice cloning that will revolutionize Quest Core's coaching experience

**Status**: 🚨 **MANDATORY MIGRATION** - EVI 1 & 2 sunset on August 30, 2025  
**Impact**: Major enhancement to voice coaching capabilities  
**Timeline**: Implement in V2 from day one

---

## 🎯 Why EVI 3 is Game-Changing for Quest Core

### **1. Voice Cloning for Personalized Coaches** 🎭
- Create unique voice personas for each coach with just 30 seconds of audio
- Biographer: Warm, patient voice (think David Attenborough meets Mr. Rogers)
- Pattern Seeker: Insightful, connecting voice (think Malcolm Gladwell)
- Quest Guides: Inspiring, empowering voices (think motivational speakers)

### **2. Speech-to-Speech Architecture** 🗣️
- No more text-to-speech pipeline delays
- Direct emotional understanding and response
- Natural interruption handling for fluid conversations

### **3. Multi-LLM Integration** 🧠
- Seamlessly integrate responses from:
  - Claude 4 (Career/Network Coach)
  - Kimi K2 (Skills Coach)
  - GPT-4 (Master Coach)
  - Custom Quest Core Trinity analysis models

### **4. Performance Superiority** 📊
Blind tests show EVI 3 outperforms GPT-4o in:
- Empathy (critical for coaching)
- Expressiveness (emotional engagement)
- Naturalness (building trust)
- Response speed (fluid conversation)

---

## 🔄 Migration Requirements

### **SDK Upgrades**
```json
{
  "dependencies": {
    "@humeai/voice-react": "^0.2.1",    // Upgrade from current
    "@humeai/voice": "^0.12.1"           // TypeScript SDK
  }
}
```

### **Breaking Changes to Address**

#### **1. Voice Selection (REQUIRED)**
```typescript
// OLD (EVI 2) - Had default voice
const config = {
  evi_version: "2"
};

// NEW (EVI 3) - Must specify voice
const config = {
  evi_version: "3",
  voice: {
    voice_id: "ITO"  // Or custom cloned voice ID
  }
};
```

#### **2. Prosody Score Handling**
```typescript
// OLD (EVI 2) - Prosody in assistant_message
socket.on("assistant_message", (message) => {
  const { content, prosody } = message;
});

// NEW (EVI 3) - Separate prosody message
socket.on("assistant_message", (message) => {
  const { content, id } = message;
});

socket.on("assistant_prosody", (prosody) => {
  const { id, scores } = prosody;
  // Match by shared ID
});
```

---

## 🎤 Voice Strategy for Quest Core V2

### **Coach Voice Personas**

#### **1. The Biographer** (Story Collection)
- **Voice Clone Target**: Warm, patient narrator style
- **Characteristics**: 
  - Gentle curiosity
  - Active listening cues
  - Thoughtful pauses
- **Example Voices**: Documentary narrator meets therapist

#### **2. The Pattern Seeker** (Trinity Recognition)
- **Voice Clone Target**: Insightful analyst style
- **Characteristics**:
  - "Aha!" moment energy
  - Connecting enthusiasm
  - Clarity in complexity
- **Example Voices**: Malcolm Gladwell meets data scientist

#### **3. Quest Guides** (Multiple Specialists)
- **Career Coach**: Professional yet approachable
- **Skills Coach**: Technical but encouraging
- **Leadership Coach**: Authoritative yet supportive
- **Network Coach**: Socially savvy connector

### **Voice Cloning Implementation**
```typescript
// Create custom coach voices
const createCoachVoice = async (coachType: CoachType, audioSample: File) => {
  const voice = await humeClient.createVoice({
    name: `Quest_${coachType}_Coach`,
    audio_file: audioSample,  // 30 seconds minimum
    settings: {
      expressiveness: getExpressivenessForCoach(coachType),
      pace: getPaceForCoach(coachType)
    }
  });
  
  return voice.voice_id;
};
```

---

## 🚀 Implementation Plan

### **Phase 1: Core Migration (Week 1)**
1. Upgrade all Hume AI SDKs to latest versions
2. Update voice configuration to EVI 3 format
3. Implement voice selection logic
4. Refactor prosody handling

### **Phase 2: Voice Design (Week 2)**
1. Source voice samples for each coach persona
2. Create and test voice clones
3. Fine-tune voice characteristics
4. A/B test user preferences

### **Phase 3: Multi-LLM Integration (Week 3)**
1. Implement LLM routing through EVI 3
2. Test Claude 4 + Kimi K2 + GPT-4 integration
3. Optimize response handoff timing
4. Ensure smooth conversation flow

---

## 💻 Code Implementation

### **Updated Voice Configuration**
```typescript
// lib/voice/evi3-config.ts
import { Hume } from '@humeai/voice';

export const createEVI3Client = () => {
  return new Hume({
    apiKey: process.env.HUME_API_KEY,
    clientSecret: process.env.HUME_CLIENT_SECRET,
    configId: process.env.HUME_CONFIG_ID,
    // EVI 3 specific configuration
    eviConfig: {
      version: "3",
      voice: {
        voice_id: process.env.COACH_VOICE_ID || "ITO"
      },
      llm_integration: {
        enabled: true,
        models: {
          primary: "openrouter",  // Use our OpenRouter integration
          fallback: "hume_default"
        }
      }
    }
  });
};
```

### **Voice Selection by Coach**
```typescript
// lib/voice/coach-voices.ts
export const COACH_VOICES = {
  biographer: {
    voice_id: process.env.BIOGRAPHER_VOICE_ID,
    name: "Thoughtful Narrator",
    expressiveness: 0.7,
    pace: 0.9  // Slightly slower for story collection
  },
  pattern_seeker: {
    voice_id: process.env.PATTERN_SEEKER_VOICE_ID,
    name: "Insightful Analyst",
    expressiveness: 0.9,
    pace: 1.1  // Slightly faster for excitement
  },
  career_coach: {
    voice_id: process.env.CAREER_COACH_VOICE_ID,
    name: "Professional Mentor",
    expressiveness: 0.6,
    pace: 1.0
  },
  // ... other coaches
};

export const getVoiceForCoach = (coachType: CoachType) => {
  return COACH_VOICES[coachType] || COACH_VOICES.biographer;
};
```

### **Enhanced Conversation Handler**
```typescript
// components/voice/EVI3ConversationHandler.tsx
import { useVoice } from '@humeai/voice-react';

export function EVI3ConversationHandler({ coachType }: Props) {
  const { connect, disconnect, messages } = useVoice();
  
  // Handle new prosody message type
  useEffect(() => {
    const prosodyMap = new Map();
    
    messages.forEach(msg => {
      if (msg.type === 'assistant_message') {
        // Store message by ID for prosody matching
        prosodyMap.set(msg.id, msg);
      } else if (msg.type === 'assistant_prosody') {
        // Match prosody to message
        const originalMsg = prosodyMap.get(msg.id);
        if (originalMsg) {
          // Process emotional understanding
          analyzeCoachingEffectiveness(originalMsg, msg.scores);
        }
      }
    });
  }, [messages]);
  
  const startSession = async () => {
    const voice = getVoiceForCoach(coachType);
    
    await connect({
      configId: process.env.HUME_CONFIG_ID,
      voice_id: voice.voice_id,
      // EVI 3 allows custom system prompts per session
      system_prompt: getCoachSystemPrompt(coachType)
    });
  };
  
  // ... rest of implementation
}
```

---

## 📊 Expected Benefits

### **User Experience Improvements**
1. **More Natural Conversations**: Speech-to-speech eliminates robotic feel
2. **Emotional Resonance**: Coaches respond to user's emotional state
3. **Personality Depth**: Each coach has unique voice characteristics
4. **Faster Response**: Direct speech processing vs text pipeline

### **Technical Advantages**
1. **Multi-LLM Flexibility**: Use best model for each coaching moment
2. **Voice Consistency**: Cloned voices maintain personality
3. **Lower Latency**: Speech-to-speech architecture
4. **Better Interruption Handling**: Natural conversation flow

### **Cost Optimization**
- Pricing at $0.0X/min (specific rate TBD)
- Potential for volume discounts
- More efficient than GPT-4o voice mode

---

## 🔧 Configuration Updates

### **Environment Variables**
```env
# EVI 3 Configuration
HUME_API_KEY=your_api_key
HUME_CLIENT_SECRET=your_client_secret
HUME_CONFIG_ID=your_evi3_config_id

# Coach Voice IDs (after cloning)
BIOGRAPHER_VOICE_ID=cloned_voice_id_1
PATTERN_SEEKER_VOICE_ID=cloned_voice_id_2
CAREER_COACH_VOICE_ID=cloned_voice_id_3
SKILLS_COACH_VOICE_ID=cloned_voice_id_4
LEADERSHIP_COACH_VOICE_ID=cloned_voice_id_5
NETWORK_COACH_VOICE_ID=cloned_voice_id_6

# EVI 3 Settings
EVI_VERSION=3
ENABLE_LLM_INTEGRATION=true
ENABLE_VOICE_CLONING=true
```

### **Hume Platform Configuration**
1. Log into platform.hume.ai
2. Create new EVI 3 configuration
3. Select voices from Voice Library or upload for cloning
4. Configure LLM integration settings
5. Set up webhook endpoints for prosody data

---

## 📅 Migration Timeline

### **Immediate Actions**
1. Update all V2 documentation to specify EVI 3
2. Plan voice recording sessions for coach personas
3. Budget for voice cloning (30 second samples needed)

### **V2 Launch Requirements**
- [ ] Upgrade to EVI 3 SDKs
- [ ] Implement voice selection logic
- [ ] Create coach voice clones
- [ ] Test multi-LLM integration
- [ ] Update prosody handling
- [ ] Performance testing vs EVI 2

### **Sunset Preparation**
- Mark calendar: August 30, 2025 (EVI 1 & 2 shutdown)
- Ensure all users migrated before deadline
- Test fallback scenarios

---

## 🎤 Journey Proximity Voice Modulation (NEW)

### **Quest-Based Voice Dynamics**

EVI 3 enables revolutionary voice modulation based on the user's position in their professional journey:

#### **Implementation Pattern**
```typescript
// Calculate quest proximity from journey graph
const calculateQuestProximity = (journeyState: JourneyState): number => {
  const currentPosition = journeyState.currentNode.position.x;
  const questPosition = journeyState.questNode.position.x;
  const totalDistance = questPosition - journeyState.startNode.position.x;
  const traveled = currentPosition - journeyState.startNode.position.x;
  
  return Math.min(traveled / totalDistance, 1.0); // 0 to 1
};

// Modulate voice based on proximity
const getJourneyAwareVoiceConfig = (userId: string): VoiceConfig => {
  const journeyState = await getJourneyState(userId);
  const proximity = calculateQuestProximity(journeyState);
  
  // Dynamic voice adjustments
  return {
    voice_id: selectCoachVoiceForJourneyStage(journeyState),
    expressiveness: 0.5 + (proximity * 0.4), // 0.5 to 0.9
    pace: 1.0 + (proximity * 0.15), // 1.0 to 1.15
    
    // Emotional modulation
    enthusiasm: proximity > 0.7 ? 'high' : 'moderate',
    urgency: proximity > 0.8 ? 'increased' : 'normal',
    
    // Context for LLM
    system_context: {
      journey_position: proximity,
      nodes_discovered: journeyState.nodes.length,
      time_to_quest: estimateTimeToQuest(journeyState),
      recent_achievements: journeyState.recentMilestones
    }
  };
};
```

#### **Voice Behavior by Journey Stage**

| Journey Position | Proximity | Voice Characteristics | Example Coaching Style |
|-----------------|-----------|----------------------|----------------------|
| **Early Journey** | 0-0.3 | Warm, patient, exploratory | "Let's discover what drives you..." |
| **Mid Journey** | 0.3-0.6 | Encouraging, insightful | "I see the pattern emerging!" |
| **Approaching Quest** | 0.6-0.8 | Excited, energizing | "You're so close to breakthrough!" |
| **Near Quest** | 0.8-1.0 | Celebratory, affirming | "This is it! Your quest is within reach!" |

#### **Real-time Voice Adaptation**
```typescript
// During conversation, voice adapts to discoveries
socket.on('journey_node_discovered', async (node) => {
  const newProximity = recalculateProximity();
  
  if (newProximity > previousProximity + 0.1) {
    // Significant progress - increase enthusiasm
    await updateVoiceConfig({
      expressiveness: Math.min(currentExpressiveness + 0.1, 0.9),
      message: "I just noticed something exciting about your journey!"
    });
  }
});
```

#### **Coach-Specific Journey Responses**
```typescript
const coachJourneyResponses = {
  biographer: {
    early: "Tell me more about this experience...",
    mid: "I'm starting to see the thread that connects these moments",
    near: "Your story is coming together beautifully!"
  },
  pattern_seeker: {
    early: "Interesting data point, let's explore further",
    mid: "The pattern is becoming clear now!",
    near: "This is the breakthrough pattern we've been looking for!"
  },
  career_coach: {
    early: "Let's understand your professional foundation",
    mid: "Your trajectory is taking shape",
    near: "You're positioned perfectly for your next leap!"
  }
};
```

---

## 🎯 Success Metrics

### **Voice Quality**
- User preference: >80% prefer EVI 3 coaches
- Conversation naturalness: 4.5+ star rating
- Emotional resonance: Measurable via prosody

### **Technical Performance**
- Response latency: <500ms
- Interruption success: >90% handled gracefully
- LLM integration: Seamless model switching

### **Business Impact**
- Session duration: +20% vs EVI 2
- User retention: +15% due to personality
- Coaching effectiveness: Measured via outcomes

---

## 🚨 Critical Notes

1. **No Default Voice**: Must select voice for every session
2. **Voice Library**: EVI 1/2 voices NOT compatible
3. **Prosody Changes**: Update all message handlers
4. **Testing Required**: Each coach voice needs user testing
5. **Cloning Ethics**: Ensure voice sample permissions

---

**EVI 3 transforms Quest Core from "AI that talks" to "Coaches who understand"**

*Last Updated: 2025-07-26*