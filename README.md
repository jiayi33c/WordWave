# WordWave 🌊
**Interactive AI Music & Language Learning for Kids**

What if children learned new words by moving, speaking, and playing with an AI companion in the room, rather than filling in worksheets or repeating the same drills?

At a time when AI in education often means more screens and more content, I kept asking myself how I would have wanted to learn as a child. What if learning listened, moved, and played along with you, turning curiosity into sound and motion?

That question became the starting point for WordWave, a multimodal learning system that blends computer vision, real time melody, and an AI agent to turn gestures and speech into playful vocabulary exploration. When a child selects a word, its synonyms and opposites appear as cloud shaped forms drifting across the sky. With a point, a pinch, or a spoken prompt, children bring these words to life, triggering music, sound cues, and visual responses in real time.

An AI agent is woven into the experience as a conversational companion. By saying "Hey Lulu", children can ask what a word means or hear it used in context. Instead of red marks on worksheets, WordWave offers an immersive, low pressure environment where language is explored through movement, sound, and conversation. Learning becomes something children inhabit with their whole body, not something they passively consume on a screen.

### 📸 Demo

**With camera mode on, children use pinch gestures to grab words floating in the sky**

![WordWave Demo 1](./1.gif)

**Once a word is selected, an OK gesture cues the system to start singing it**

![WordWave Demo 2](./2.gif)

*Remark: GIF shown without sound. Full experience available in WordWave.*

WordWave uses a real time multimodal architecture with a browser based frontend and a lightweight backend deployed on Vercel. Three.js renders the 3D scene and maps hand and gesture inputs directly to interactive word states. Magenta generates structured musical feedback in response to user actions. Speech interaction is handled by an ElevenLabs voice agent, activated via the wake phrase "Hey Lulu", enabling spoken queries and vocal output.

While WordWave is an early prototype, it points toward broader possibilities for embodied learning beyond vocabulary. The same interaction patterns could be extended to concepts like numbers, emotions, or storytelling. Future iterations may explore adaptive difficulty, collaborative play, and integration into classroom settings.

### 🚀 Key Features

*   **🗣️ Conversational AI Teacher ("Lulu")**
    *   Powered by **ElevenLabs Conversational AI**, Lulu understands the app's context (e.g., "You collected 'Sunshine'!").
    *   Provides real-time, encouraging feedback and definitions in a warm, child-friendly voice.
    *   Connects via **WebRTC** for low-latency natural conversation.

*   **🎙️ Voice Activation**
    *   Just say **"Hey Lulu"**! Integrated wake-word detection allows hands-free interaction using the Web Speech API.

*   **🎵 Dynamic Music Generation**
    *   Words are analyzed for **syllable timing** and rhythmically synced to a background beat.
    *   Uses **Tone.js** and **Magenta.js** to generate unique melodies based on the collected words.

*   **🛡️ Safe & Adaptive Content**
    *   Powered by **Google Gemini 2.0 Flash** (via **Convex** backend), generating age-appropriate synonyms and rhymes on the fly.
    *   Ensures a safe, curated learning environment for kids ages 5-10.

*   **🎨 Immersive 3D World**
    *   Physics-based interactive word clouds, animated avatars, and a playful "Sky Station" environment built with **Three.js (React Three Fiber)** and **Framer Motion**.

### 🛠️ Tech Stack
*   **Frontend**: React, Vite, Three.js (React Three Fiber), Framer Motion
*   **AI/Voice**: ElevenLabs Conversational AI, Google Gemini 2.0
*   **Audio**: Tone.js, Magenta.js, Web Audio API
*   **Backend**: Convex (Serverless Functions)

---
*Built for the AI & Voice Hackathon 2025*

