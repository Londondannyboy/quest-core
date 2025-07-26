# Quest Core V2 - Journey Graph Visual Design Specifications

> **Visual Design Document**: Detailed mockups and specifications for the LinkedIn Mirror Journey Visualization

**Status**: 🎨 V2 Design Specification  
**Related**: `V2_LINKEDIN_MIRROR_USE_CASE.md`, `V2_STYLE_GUIDE.md`  

---

## 🎨 **Visual Overview**

The Journey Graph is a 3D interactive timeline that visualizes a user's professional progression from past to future, with their "Quest" as the ultimate destination.

### **Core Visual Metaphor**
- **Left**: Past (education, early career)
- **Center**: Present (current role, glowing)
- **Right**: Future Quest (pulsing with possibility)
- **Flow**: Left-to-right progression mimics reading direction and time

---

## 📐 **Layout Specifications**

### **Full Screen Layout**
```
┌────────────────────────────────────────────────────────────────────┐
│  Quest Core                                    [User Avatar] Menu   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Your Professional Journey                          □ ○ ◊          │
│  ═══════════════════════════════════════════════════════          │
│                                                                     │
│     PAST                    PRESENT                 FUTURE         │
│      │                        │                       │            │
│    ┌─┴─┐                   ┌─┴─┐                  ┌─┴─┐          │
│    │UCLA│ ─────────────── │Tech│ ~~~~~~~~~~~~~~~~ │VP │          │
│    │Mktg│                  │ Co │                  │Grw│          │
│    └───┘                   └─●─┘                  └─⚡─┘          │
│      ▲                       ▲                       ▲            │
│   2018-22                  Now                    Quest           │
│                                                                     │
│  ──────────────────────────────────────────────────────────      │
│                                                                     │
│  [🔍 Explore]  [📊 Analytics]  [🎯 Set Quest]  [💬 Coach Me]    │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│                          Mirror Analysis                            │
│  ┌─────────────────────┬─────────────────────┬─────────────────┐ │
│  │ What We See         │ Quick Wins          │ Quest Alignment │ │
│  │ • Marketing origin  │ • Fix headline      │ Score: 78%      │ │
│  │ • Growth trajectory │ • Add 3 skills      │ On track for VP │ │
│  │ • Leadership emerge │ • Quantify wins     │ 18-24 months    │ │
│  └─────────────────────┴─────────────────────┴─────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎭 **3D Graph Components**

### **Node Types & Visual Treatment**

#### **1. Past Nodes (Education/Early Career)**
```
Visual: Solid spheres with subtle glow
Size: 40-60px diameter
Color: #6B7280 (Cool Gray 500)
Opacity: 0.8
Animation: Gentle float (0.5s ease-in-out)
Interaction: Hover reveals details tooltip
```

#### **2. Experience Nodes (Career Positions)**
```
Visual: Spheres with company logo texture
Size: 60-80px diameter (based on role impact)
Color: Gradient from past gray to present teal
Border: 2px solid with company brand color
Animation: Slow rotation (20s infinite)
Interaction: Click to expand achievement details
```

#### **3. Current Node (Present Position)**
```
Visual: Glowing sphere with particle effects
Size: 100px diameter
Color: #00D4B8 (Quest Primary) with glow
Effects: 
  - Particle emission (subtle sparkles)
  - Pulsing glow (2s cycle, 0.8-1.0 opacity)
  - Light shaft connecting to quest
Animation: Continuous gentle pulse
Interaction: Always highlighted, shows real-time updates
```

#### **4. Quest Node (Future Goal)**
```
Visual: Ethereal sphere with energy field
Size: 120px diameter
Color: Gradient #00D4B8 → #4F46E5 → #8B5CF6
Effects:
  - Pulsing intensity based on proximity (0.5-3s cycle)
  - Energy tendrils reaching toward current
  - Particle vortex effect
  - Aurora-like color shifts
Animation: 
  - Base: Slow rotation
  - Proximity <0.3: Gentle pulse
  - Proximity 0.3-0.7: Moderate pulse + glow
  - Proximity >0.7: Rapid pulse + lightning effects
Interaction: Click to set/modify quest
```

### **Connection Types**

#### **Solid Lines (Completed Journey)**
```
Style: Solid bezier curves
Width: 3px
Color: #D1D5DB → #00D4B8 (gradient)
Animation: None (stable history)
```

#### **Dashed Lines (Projected Path)**
```
Style: Dashed bezier curves (10px dash, 5px gap)
Width: 3px
Color: #00D4B8 with 0.6 opacity
Animation: Dash offset animation (flowing toward quest)
Speed: Based on proximity (faster when closer)
```

#### **Discovery Lines (Real-time Additions)**
```
Style: Glowing lines that materialize
Width: 4px expanding to 3px
Color: #8B5CF6 (bright) fading to normal
Animation: Draw-in effect (1s duration)
```

---

## 🎨 **Visual States & Interactions**

### **Hover States**
```typescript
onNodeHover = {
  past: {
    scale: 1.1,
    glow: 'subtle white',
    tooltip: 'Show period details',
    cursor: 'pointer'
  },
  current: {
    scale: 1.05,
    particles: 'increase emission',
    tooltip: 'Your current position',
    cursor: 'default'
  },
  quest: {
    scale: 1.15,
    pulse: 'accelerate',
    tooltip: 'Click to refine your quest',
    cursor: 'pointer'
  }
}
```

### **Click Interactions**
```typescript
onNodeClick = {
  past: 'Expand to show achievements, skills gained',
  experience: 'Open detailed role view with optimization tips',
  quest: 'Launch quest refinement dialog',
  empty_space: 'Add custom milestone or achievement'
}
```

### **Conversation-Triggered Animations**

#### **New Node Discovery**
```
1. Particle burst at discovery point
2. Node materializes with growth animation (0→full size)
3. Connection line draws from previous node
4. Subtle camera shift to include new node
5. Update proximity calculations
```

#### **Quest Proximity Increase**
```
Proximity 0→0.3: Quest node begins gentle pulse
Proximity 0.3→0.5: Pulse increases, color shifts warmer
Proximity 0.5→0.7: Energy tendrils appear
Proximity 0.7→0.9: Lightning effects between current and quest
Proximity 0.9→1.0: Celebration animation (confetti particles)
```

---

## 🎨 **Color System**

### **Journey Progression Gradient**
```css
/* Past to Future color progression */
--journey-past: #6B7280;      /* Cool Gray 500 */
--journey-early: #9CA3AF;     /* Cool Gray 400 */
--journey-mid: #60A5FA;       /* Blue 400 */
--journey-recent: #00D4B8;    /* Quest Primary */
--journey-current: #00D4B8;   /* Quest Primary + Glow */
--journey-quest: linear-gradient(135deg, #00D4B8, #4F46E5, #8B5CF6);
```

### **Node Glow Effects**
```css
/* Glow intensities */
.node-glow-subtle {
  box-shadow: 0 0 20px rgba(0, 212, 184, 0.3);
}

.node-glow-medium {
  box-shadow: 0 0 40px rgba(0, 212, 184, 0.5);
}

.node-glow-intense {
  box-shadow: 
    0 0 60px rgba(0, 212, 184, 0.7),
    0 0 120px rgba(79, 70, 229, 0.4);
}
```

---

## 📱 **Responsive Design**

### **Desktop (1920x1080)**
- Full 3D graph with all effects
- Side panels for details
- Rich interactions

### **Tablet (768x1024)**
- Simplified 3D graph
- Reduced particle effects
- Touch-optimized interactions
- Bottom sheet for details

### **Mobile (375x812)**
- 2D timeline view option
- Swipe navigation between nodes
- Tap for details
- Minimal effects for performance

---

## 🎬 **Animation Specifications**

### **Base Animations**
```css
@keyframes node-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes quest-pulse {
  0%, 100% { 
    scale: 1;
    opacity: 0.8;
  }
  50% { 
    scale: 1.1;
    opacity: 1;
  }
}

@keyframes energy-flow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -40; }
}
```

### **Proximity-Based Animations**
```typescript
const questPulseSpeed = {
  far: '3s',      // proximity < 0.3
  medium: '2s',   // proximity 0.3-0.6
  close: '1s',    // proximity 0.6-0.8
  veryClose: '0.5s' // proximity > 0.8
};
```

---

## 🎯 **Interaction Guidelines**

### **Camera Controls**
- **Orbit**: Click + drag to rotate view
- **Zoom**: Scroll or pinch to zoom
- **Pan**: Right-click + drag or two-finger drag
- **Reset**: Double-click empty space
- **Focus**: Click node to center and zoom

### **Keyboard Shortcuts**
- `Space`: Play/pause animations
- `R`: Reset camera view
- `Tab`: Navigate between nodes
- `Enter`: Expand selected node
- `Q`: Quick quest refinement

### **Touch Gestures**
- **Tap**: Select node
- **Double-tap**: Focus node
- **Pinch**: Zoom in/out
- **Two-finger rotate**: Orbit camera
- **Long-press**: Show context menu

---

## 🌟 **Special Effects**

### **Quest Achievement Celebration**
```typescript
const questAchievedAnimation = {
  duration: 5000,
  effects: [
    'Confetti particle burst',
    'Node transformation to gold',
    'Radiating light waves',
    'Camera orbit celebration',
    'Achievement sound effect'
  ]
};
```

### **Milestone Discovery Effect**
```typescript
const milestoneDiscovery = {
  particles: 'Starburst at discovery point',
  sound: 'Subtle chime',
  visualization: 'Ripple effect through graph',
  highlight: 'Temporary glow on related nodes'
};
```

---

## 📊 **Performance Considerations**

### **Optimization Strategies**
1. **Level of Detail (LOD)**: Reduce complexity for distant nodes
2. **Frustum Culling**: Don't render off-screen elements
3. **Particle Pooling**: Reuse particle systems
4. **Texture Atlas**: Combine company logos
5. **Progressive Loading**: Load details on demand

### **Performance Targets**
- 60 FPS on desktop with full effects
- 30 FPS on mobile with reduced effects
- <3s initial load time
- <100ms interaction response

---

## 🎨 **Accessibility Features**

### **Visual Accessibility**
- High contrast mode option
- Colorblind-friendly palette alternatives
- Reduced motion mode
- Screen reader descriptions for all nodes

### **Interaction Accessibility**
- Keyboard navigation support
- Focus indicators
- ARIA labels for all elements
- Alternative 2D timeline view

---

**Last Updated**: 2025-07-26  
**Design Status**: Ready for V2 Implementation  
**Figma File**: [Link to be added]  

*This visual design creates an emotionally engaging, professionally valuable experience that makes career progression tangible and exciting.*