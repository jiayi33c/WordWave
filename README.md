# WordWave 🌊
**Interactive AI Music & Language Learning for Kids**

WordWave turns vocabulary building into a musical adventure. Children collect floating word clouds, build rhythmic songs, and interact with "Lulu"—a smart, encouraging AI teacher who listens, explains, and sings along.

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

