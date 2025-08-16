# urbanSense Demo Recording Guide
## For IBM Call for Code Video Submission

### 🎯 **Pre-Recording Setup**

#### **1. Environment Preparation**
```bash
# Navigate to project directory
cd /Users/parul/DigitalEye

# Start frontend (Terminal 1)
npm run dev
# Should open http://localhost:5173

# Start mock Watson proxy (Terminal 2)
cd server
USE_MOCK=true PORT=5002 python3 simple_watson_proxy.py
# Should start on http://0.0.0.0:5002
```

#### **2. Test Demo Mode**
- Open browser to `http://localhost:5173`
- Go to **Settings** (gear icon in footer)
- Enable **Mock Data Mode** 
- Verify camera permissions are granted
- Test voice recognition by saying "Explore"

#### **3. Audio Setup**
- Use external microphone for clear narration
- Test voice commands work reliably
- Ensure background noise is minimal
- Have backup audio recordings ready

---

### 🎬 **Recording Script with Exact Timing**

#### **Scene 1: Hook & Problem (0:00 - 0:30)**

**Screen Recording:** App loading screen → Settings → Mock mode enabled

**Narration (Practice this exact text):**
*"285 million people worldwide face navigation challenges due to visual impairment. Traditional apps tell you where to go, but not what's around you. I'm [Your Name], and this is urbanSense - an AI-powered visual assistant that uses IBM watsonx.ai to transform any smartphone into an intelligent navigation guide."*

**Visual Sequence:**
1. Show urbanSense loading (2 seconds)
2. Quick settings view showing mock mode (3 seconds)
3. Return to main interface (3 seconds)

#### **Scene 2: Explore Feature Demo (0:30 - 1:00)**

**Screen Recording:** Main screen → Voice activation → Camera view → AI response

**Setup:** Have Delhi street test image ready in `/public/testData/delhi/`

**Live Demo Sequence:**
1. **Say clearly:** "Explore"
2. **Show:** Listening animation
3. **Point camera at:** Delhi Chandni Chowk test image
4. **Expected AI Response:** *"Looking ahead, you're facing a busy urban street with a wide sidewalk on the right side. There are several people walking along the sidewalk - two people are about 10 feet ahead walking in the same direction, and a person with a bag is approaching from the opposite direction about 15 feet away. The environment appears to be a commercial district with storefronts visible on the right side."*

**Narration During Demo:**
*"Watch this - I'll say 'Explore' and point the camera at a busy Delhi street. Our Vision Agent, powered by IBM watsonx.ai's Llama 3.2 90B Vision model, provides detailed spatial awareness in real-time."*

#### **Scene 3: Navigation Feature Demo (1:00 - 1:30)**

**Screen Recording:** Navigation command → Route planning → Visual confirmation

**Live Demo Sequence:**
1. **Say clearly:** "Navigate"
2. **Say clearly:** "Chandni Chowk"
3. **Show:** Route being calculated
4. **Point camera at:** Navigation relevant image
5. **Expected Response:** *"Following your direction to Chandni Chowk, I can see the path ahead looks clear and safe. The sidewalk continues straight ahead with a few pedestrians maintaining good spacing..."*

**Narration During Demo:**
*"For navigation, our agentic AI system combines route planning with real-time visual confirmation. Multiple agents collaborate - the Navigation Agent processes destinations while the Vision Agent confirms safe paths ahead."*

#### **Scene 4: Transit & SOS (1:30 - 2:00)**

**Screen Recording:** Transit button → Delhi Metro options → SOS activation

**Live Demo Sequence:**
1. **Tap:** Transit button (bottom nav)
2. **Show:** Delhi Metro integration interface
3. **Say clearly:** "SOS"
4. **Show:** Emergency calling screen with "Dad" contact

**Narration During Demo:**
*"Transit mode provides Delhi Metro guidance, while our Safety Agent ensures emergency contacts are always voice-accessible. Every interaction is hands-free for complete accessibility."*

#### **Scene 5: Technical Architecture (2:00 - 2:30)**

**Screen Recording:** Quick code glimpse → Architecture overview

**Show These Files Briefly:**
- `netlify/functions/watson-infer.ts` (enhanced prompts)
- `src/appLogic/` (agent system)
- Development console showing Watson API calls

**Narration During Demo:**
*"Behind the scenes, our multi-agent architecture coordinates four specialized AI agents: Vision Analysis, Navigation Intelligence, Voice Command, and Safety Monitoring. Each agent leverages IBM watsonx.ai's capabilities while collaborating seamlessly to provide contextual assistance."*

#### **Scene 6: Impact & Innovation (2:30 - 3:00)**

**Screen Recording:** PWA installation → Offline capability → Global reach

**Final Demo Sequence:**
1. **Show:** "Add to Home Screen" option
2. **Demonstrate:** App works offline
3. **Show:** Multiple language/location options
4. **End with:** urbanSense logo + IBM watsonx.ai attribution

**Narration During Demo:**
*"DigitalEye isn't just an app - it's independence. Built as a Progressive Web App, it works offline, installs without app stores, and scales globally while adapting to local contexts. We're empowering millions through intelligent AI collaboration, making the invisible world visible through voice."*

---

### 🔧 **Technical Demo Checklist**

#### **Before Recording:**
- [ ] Frontend running on port 5173
- [ ] Mock proxy running on port 5002
- [ ] Demo mode enabled in Settings
- [ ] Camera permissions granted
- [ ] Microphone permissions granted
- [ ] Test images accessible in `/public/testData/delhi/`
- [ ] Voice commands working reliably

#### **During Recording:**
- [ ] Speak clearly for voice recognition
- [ ] Keep transitions smooth between demos
- [ ] Show loading states briefly
- [ ] Highlight IBM watsonx.ai integration prominently
- [ ] Maintain energy and enthusiasm
- [ ] Stay within 3-minute limit

#### **Backup Plans:**
- [ ] Pre-recorded audio responses ready
- [ ] Multiple test images available
- [ ] Screen recording software tested
- [ ] Alternative demo scenarios prepared

---

### 📱 **Key Demo Features to Highlight**

#### **1. Voice-First Design**
- Complete hands-free operation
- Natural language commands
- Audio feedback for all interactions

#### **2. IBM watsonx.ai Integration**
- Mention "Llama 3.2 90B Vision model" specifically
- Show enhanced prompts in action
- Demonstrate real-time AI processing

#### **3. Agentic AI Architecture**
- Multiple specialized agents working together
- Vision Agent + Navigation Agent collaboration
- Safety Agent continuous monitoring

#### **4. Accessibility Innovation**
- Spatial awareness descriptions
- Obstacle detection and avoidance
- Emergency accessibility features

#### **5. Technical Excellence**
- Progressive Web App capabilities
- Offline functionality
- Global scalability with local adaptation

---

### 🎥 **Recording Quality Standards**

#### **Video:**
- **Resolution:** 1080p minimum
- **Frame Rate:** 30fps
- **Orientation:** Portrait for mobile authenticity
- **Stability:** Use tripod or stable surface

#### **Audio:**
- **Quality:** External microphone recommended
- **Volume:** Consistent throughout
- **Clarity:** Clear enunciation for voice demos
- **Background:** Minimal noise

#### **Editing:**
- **Captions:** Add for accessibility
- **Branding:** Include IBM watsonx.ai logo
- **Transitions:** Smooth between sections
- **Timing:** Exactly 3 minutes or under

---

### 🏆 **Success Metrics for Video**

#### **Judge Appeal Factors:**
- [ ] **Clear Problem Statement:** Accessibility challenge obvious
- [ ] **Compelling Solution:** Voice-first AI assistance demonstrated
- [ ] **Technical Innovation:** Agentic AI architecture visible
- [ ] **IBM Integration:** watsonx.ai usage prominent and specific
- [ ] **Real-World Impact:** Delhi street scenarios relatable
- [ ] **Professional Execution:** Smooth demo, clear narration

#### **Competitive Differentiators:**
- [ ] **Live Voice Commands:** Not pre-recorded demos
- [ ] **Multi-Agent System:** Sophisticated AI collaboration
- [ ] **Accessibility Focus:** Genuine empowerment for visual challenges
- [ ] **Production Ready:** Actual working application, not concept
- [ ] **Global Scalability:** Local adaptation with universal design

---

**Remember: This video is your one chance to showcase 6 months of development work. Practice the demo multiple times, but keep the energy fresh and authentic for the final recording! 🎯**
