# SentiScroll AI: Version 1.5 Enhancement Documentation

SentiScroll AI has been upgraded with five core "Top Seed" features to maximize novelty, technical complexity, and user impact for the XploreInnoQuest challenge.

## 1. Agentic Dialogue (GenAI Integration)
- **Technology**: Google Gemini 1.5 Flash API.
- **Functionality**: The system no longer just logs actions; it "reasons" with the user. Using an empathetic agentic persona, the AI generates context-aware supportive messages in real-time.
- **Example**: *"I noticed you're feeling a bit overwhelmed, switching to a calmer feed to help you relax."*

## 2. Deep Attention Tracking
- **BPM Detection**: Monitors real-time Blink Rate (Blinks Per Minute) using MediaPipe blendshapes to detect digital eye strain.
- **Focus Score**: Analyzes gaze stability and iris movement variance to quantify user engagement level (0-100%).
- **Impact**: Provides a secondary biometric layer beyond emotion, identifying "Zoned Out" vs. "Deep Focus" states.

## 3. Adaptive Emotional UI (Ambient Theming)
- **Immersive Feedback**: The entire application UI (ambient glow, background gradients, and HUD accents) dynamically shifts color based on the dominant emotion.
- **Color Mapping**: 
    - **Joy**: Emerald Green Glow
    - **Stress/Sad**: Magenta/Purple Glow
    - **Neutral**: Cyberpunk Cyan
- **Visuals**: Implemented via CSS variables and hardware-accelerated transitions.

## 4. Personal Emotional Analytics Dashboard
- **Session Reporting**: A post-session "Insights" modal summarizing the user's emotional journey.
- **Metrics Tracked**: 
    - Peak Emotion
    - Average BPM (Eye Strain Level)
    - Average Focus Score
    - Total AI-driven content pivots
- **Purpose**: Demonstrates tangible value and data-driven impact to the user.

## 5. Privacy Shield Certification
- **Privacy-First Design**: A permanent HUD badge certifying that all biometric data (Face landmarks, age, gender) is processed **locally** via WASM (WebAssembly).
- **Security**: No images or facial videos are ever uploaded to a server, ensuring the highest standards of data ethics.

---
### **How to Demo**
1. Open the app and click **START AI SYSTEM**.
2. Observe the **Ambient Glow** change as you change your expression.
3. Check the **Agent Dialogue** bubble for personalized messages.
4. Blink rapidly or stare intently to see the **BPM** and **Focus** metrics update.
5. Click **View Session Report** at any time to see your emotional analytics summary.
