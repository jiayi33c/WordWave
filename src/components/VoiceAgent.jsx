/**
 * VoiceAgent - ElevenLabs conversational agent with animated instructor model
 * Agent ID: agent_0601ka0b4fqgevf91eesshqnk5fn
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { Conversation } from '@elevenlabs/client';

// --- CONFIGURATION ---
const THEME = {
  skin: "#FFF0E5",
  skinShadow: "#F0D0C0",
  hair: "#87CEFA", // Sky Blue
  hairDark: "#5F9EA0",
  eye: "#FF69B4", // Hot Pink
  eyeHighlight: "#FFFFFF",
  uniform: "#FFFFFF",
  uniformShadow: "#E6E6FA",
  accent: "#FFB6C1", // Pastel Pink
  gold: "#FFD700",
  dark: "#333333" // For outlines/details
};

const AGENT_ID = 'agent_0601ka0b4fqgevf91eesshqnk5fn';
const APP_PROMPT = `
You are a playful, kind music teacher in the Wordwave app for kids ages 5-10.
- Goal: help kids collect word clouds, make songs, and learn what words mean.
- Encourage: "tap/click the fluffy word clouds to pick words", "want me to explain that word?", "shall we sing it together?"
- Keep messages short, upbeat, and reassuring. Use simple vocabulary. One or two short sentences max.
- If the child seems unsure, offer a quick explanation of the word.
`;

// Instructor visual from provided model (converted to plain JS/React)
export function Instructor({ speaking = false, singing = false, className = "", style = {} }) {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth Springs
  const headX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const headY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  // Physics Springs
  const physicsX = useSpring(mouseX, { stiffness: 40, damping: 15 });

  // Parallax transforms
  const faceX = useTransform(headX, [-1, 1], [-10, 10]);
  const faceY = useTransform(headY, [-1, 1], [-8, 8]);
  const faceRotate = useTransform(headX, [-1, 1], [-5, 5]);
  const eyeX = useTransform(headX, [-1, 1], [-6, 6]);
  const eyeY = useTransform(headY, [-1, 1], [-4, 4]);
  const bangsRotate = useTransform(physicsX, [-1, 1], [5, -5]);

  // Blinking
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    const blinkLoop = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
      setTimeout(blinkLoop, Math.random() * 3000 + 2000);
    };
    const timeout = setTimeout(blinkLoop, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const normX = (e.clientX - centerX) / (window.innerWidth / 2);
      const normY = (e.clientY - centerY) / (window.innerHeight / 2);
      mouseX.set(Math.max(-1, Math.min(1, normX)));
      mouseY.set(Math.max(-1, Math.min(1, normY)));
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: 280,
        height: 340,
        zIndex: 50,
        pointerEvents: 'none',
        filter: 'drop-shadow(0px 5px 15px rgba(0,0,0,0.2))',
        position: 'relative', // Changed from absolute to relative for flex layout
        ...style,
      }}
    >
      <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Hair/back */}
        <motion.g style={{ x: faceX, y: faceY, rotate: faceRotate, originX: "150px", originY: "200px" }}>
          <path d="M40 100 C20 200 30 350 70 390 C90 400 110 380 130 360 C145 380 155 380 170 360 C190 380 210 400 230 390 C270 350 280 200 260 100 C240 80 60 80 40 100 Z" fill={THEME.hairDark} />
          <path d="M50 100 C30 200 40 340 80 380 C100 390 115 360 135 345 C148 360 152 360 165 345 C185 360 200 390 220 380 C260 340 270 200 250 100 C230 85 70 85 50 100 Z" fill={THEME.hair} />
          <path d="M80 150 Q70 280 95 360" stroke={THEME.hairDark} strokeWidth="2" opacity="0.3" fill="none" />
          <path d="M220 150 Q230 280 205 360" stroke={THEME.hairDark} strokeWidth="2" opacity="0.3" fill="none" />
          <path d="M150 120 Q150 280 150 350" stroke={THEME.hairDark} strokeWidth="2" opacity="0.2" fill="none" />
        </motion.g>

        {/* Body */}
        <motion.g
          initial={{ y: 0 }}
          animate={{ y: singing ? [0, -10, 0] : [0, -3, 0] }}
          transition={{ duration: singing ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M135 220 L135 250 L165 250 L165 220" fill={THEME.skinShadow} />
          <path d="M100 250 Q150 240 200 250 L220 400 L80 400 Z" fill={THEME.uniform} stroke={THEME.dark} strokeWidth="2" />
          <path d="M125 250 L150 280 L175 250" fill="none" stroke={THEME.dark} strokeWidth="2" />
          <path d="M140 280 L160 280 L150 300 Z" fill={THEME.dark} />
          <path d="M150 300 L150 400" stroke={THEME.dark} strokeWidth="2" />
        </motion.g>

        {/* Head & face */}
        <motion.g style={{ x: faceX, y: faceY, rotate: faceRotate, originX: "150px", originY: "200px" }}>
          <path d="M90 130 C90 90 210 90 210 130 V200 C210 240 90 240 90 200 V130 Z" fill={THEME.skin} stroke={THEME.skinShadow} strokeWidth="1" />
          <ellipse cx="105" cy="210" rx="12" ry="8" fill={THEME.accent} opacity="0.4" />
          <ellipse cx="195" cy="210" rx="12" ry="8" fill={THEME.accent} opacity="0.4" />
          <path d="M95 210 L100 215 M105 210 L110 215" stroke={THEME.accent} strokeWidth="2" />
          <path d="M190 210 L195 215 M200 210 L205 215" stroke={THEME.accent} strokeWidth="2" />

          <motion.g style={{ x: eyeX, y: eyeY }}>
            <path d="M100 175 Q115 165 130 175" fill="none" stroke={THEME.hairDark} strokeWidth="3" strokeLinecap="round" />
            <path d="M170 175 Q185 165 200 175" fill="none" stroke={THEME.hairDark} strokeWidth="3" strokeLinecap="round" />

            {/* Left Eye */}
            <g transform="translate(115, 190)">
              <mask id="eyeMaskLeft">
                <ellipse cx="0" cy="0" rx="18" ry="20" fill="white" />
                <motion.rect
                  x="-20" y="-20" width="40" height="20" fill="black"
                  initial={{ y: -25 }}
                  animate={{ y: isBlinking ? 0 : -35 }}
                  transition={{ duration: 0.05 }}
                />
              </mask>
              <g mask="url(#eyeMaskLeft)">
                <ellipse cx="0" cy="0" rx="17" ry="19" fill="white" stroke={THEME.dark} strokeWidth="2" />
                <circle cx="0" cy="2" r="12" fill={THEME.eye} />
                <circle cx="0" cy="2" r="6" fill={THEME.dark} />
                <circle cx="-5" cy="-5" r="5" fill="white" />
                <circle cx="6" cy="6" r="3" fill="white" opacity="0.6" />
              </g>
            </g>

            {/* Right Eye */}
            <g transform="translate(185, 190)">
              <mask id="eyeMaskRight">
                <ellipse cx="0" cy="0" rx="18" ry="20" fill="white" />
                <motion.rect
                  x="-20" y="-20" width="40" height="20" fill="black"
                  initial={{ y: -25 }}
                  animate={{ y: isBlinking ? 0 : -35 }}
                  transition={{ duration: 0.05 }}
                />
              </mask>
              <g mask="url(#eyeMaskRight)">
                <ellipse cx="0" cy="0" rx="17" ry="19" fill="white" stroke={THEME.dark} strokeWidth="2" />
                <circle cx="0" cy="2" r="12" fill={THEME.eye} />
                <circle cx="0" cy="2" r="6" fill={THEME.dark} />
                <circle cx="-5" cy="-5" r="5" fill="white" />
                <circle cx="6" cy="6" r="3" fill="white" opacity="0.6" />
              </g>
            </g>

            {/* Mouth */}
            <motion.path
              d="M145 225 Q150 228 155 225"
              stroke={THEME.dark}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              animate={speaking || singing
                ? { d: ["M145 225 Q150 225 155 225", "M145 225 Q150 235 155 225"] }
                : { d: "M148 225 Q150 227 152 225" }
              }
              transition={{ duration: 0.15, repeat: (speaking || singing) ? Infinity : 0 }}
            />
          </motion.g>
        </motion.g>

        {/* Front hair & hat */}
        <motion.g style={{ x: faceX, y: faceY, rotate: bangsRotate, originX: "150px", originY: "150px" }}>
          <path
            d="M70 100 
               C50 150 45 250 65 320 
               L75 300 L80 315 L85 280
               L90 160 
               L100 155 L110 160 L120 155 L130 160 L140 155 L150 160 L160 155 L170 160 L180 155 L190 160 L200 155 L210 160
               L215 280
               L220 315 L225 300 L235 320
               C255 250 250 150 230 100
               C210 80 90 80 70 100 Z"
            fill={THEME.hair}
            stroke={THEME.dark}
            strokeWidth="1"
          />
          <path d="M120 100 V150 M150 100 V150 M180 100 V150" stroke={THEME.hairDark} strokeWidth="1" opacity="0.5" />
          <g transform="translate(0, -10)">
            <rect x="90" y="80" width="120" height="50" rx="10" fill={THEME.uniform} stroke={THEME.dark} strokeWidth="2" />
            <rect x="90" y="110" width="120" height="10" fill={THEME.uniformShadow} />
            <path d="M110 80 C105 40 135 40 130 80" fill={THEME.uniform} stroke={THEME.dark} strokeWidth="2" />
            <ellipse cx="120" cy="60" rx="6" ry="12" fill="#FFB6C1" opacity="0.5" />
            <path d="M170 80 C165 40 195 40 190 80" fill={THEME.uniform} stroke={THEME.dark} strokeWidth="2" />
            <ellipse cx="180" cy="60" rx="6" ry="12" fill="#FFB6C1" opacity="0.5" />
            <path d="M135 90 L165 90 L150 115 Z" fill={THEME.dark} />
          </g>
        </motion.g>
      </svg>
    </div>
  );
}

// VoiceAgent wrapper with conversation controls and client tools
export default function VoiceAgent({ 
  droppedWords = [], 
  topic = "", 
  isPlaying = false, 
  onSing = () => {}, 
  onClearLyrics = () => {} 
}) {
  const [status, setStatus] = useState("disconnected"); // disconnected, connecting, connected
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const conversationRef = useRef(null);
  const prevWordCountRef = useRef(0);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(true);
  const [wakeWordStatus, setWakeWordStatus] = useState("inactive"); // inactive, listening, error
  const [lastHeard, setLastHeard] = useState(""); // Debug: show what it hears
  const [isVisible, setIsVisible] = useState(false); // Control agent visibility
  const wakeWordRecognitionRef = useRef(null);

  const addTranscript = useCallback((speaker, message, isAgent = false) => {
    setTranscript((prev) => {
      const next = [...prev, { speaker, message, isAgent }];
      // keep last 20
      return next.slice(-20);
    });
  }, []);

  // Define client tools the agent can call to interact with the app
  const getClientTools = useCallback(() => {
    return {
      // Tool: Get current app context
      get_current_context: async () => {
        const context = {
          topic: topic || "not set",
          collected_words: droppedWords.map(w => w.text).join(", ") || "none yet",
          word_count: droppedWords.length,
          is_playing: isPlaying,
        };
        console.log("[Tool: get_current_context]", context);
        return JSON.stringify(context);
      },

      // Tool: Play the collected words as a song
      play_song: async () => {
        console.log("[Tool: play_song] Playing lyrics");
        if (droppedWords.length === 0) {
          return JSON.stringify({ success: false, message: "No words collected yet! Ask the child to grab some word clouds first." });
        }
        try {
          onSing();
          return JSON.stringify({ success: true, message: `Playing ${droppedWords.length} words as a song!` });
        } catch (error) {
          return JSON.stringify({ success: false, message: error.message });
        }
      },

      // Tool: Clear all collected words
      clear_words: async () => {
        console.log("[Tool: clear_words] Clearing lyrics");
        try {
          onClearLyrics();
          return JSON.stringify({ success: true, message: "All words cleared! Ready to collect new ones." });
        } catch (error) {
          return JSON.stringify({ success: false, message: error.message });
        }
      },
    };
  }, [droppedWords, topic, isPlaying, onSing, onClearLyrics]);

  const isConnectedRef = useRef(false);
  
  useEffect(() => {
    isConnectedRef.current = status === 'connected' || status === 'connecting';
  }, [status]);

  const startConversation = useCallback(async () => {
    if (isConnectedRef.current || conversationRef.current) {
        console.warn("Conversation already active, ignoring start request");
        return;
    }

    try {
      setStatus("connecting");
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Build dynamic first message based on app state
      let firstMsg = "Hi there superstar! I'm your Wordwave teacher. ";
      if (droppedWords.length === 0) {
        firstMsg += "Want to grab some fluffy word clouds from the sky and make a song together? Just click on them!";
      } else {
        firstMsg += `Wow, you already collected ${droppedWords.length} word${droppedWords.length > 1 ? 's' : ''}! Want to sing them together, or collect more?`;
      }

      // Build dynamic prompt with current context
      const dynamicPrompt = `${APP_PROMPT}

Current app state:
- Topic: ${topic || "not set"}
- Collected words: ${droppedWords.map(w => w.text).join(", ") || "none yet"}
- Word count: ${droppedWords.length}
- Is playing: ${isPlaying}

You can use these tools:
- get_current_context: Get the latest app state
- play_song: Play the collected words as a song
- clear_words: Clear all collected words to start fresh
`;
      
      // Start the ElevenLabs conversation session with client tools
      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        // clientTools: getClientTools(),
        // overrides: {
        //   agent: {
        //     prompt: {
        //       prompt: dynamicPrompt,
        //     },
        //     firstMessage: firstMsg,
        //   },
        // },
        onConnect: () => {
          console.log("🎓 VoiceAgent connected");
          setStatus("connected");
          setIsListening(true);
        },
        onDisconnect: () => {
          console.log("🎓 VoiceAgent disconnected");
          setStatus("disconnected");
          setIsSpeaking(false);
          setIsListening(false);
        },
        onError: (error) => {
          console.error("VoiceAgent error:", error);
          setStatus("disconnected");
        },
        onModeChange: (mode) => {
          // mode.mode can be "speaking", "listening", etc.
          const m = mode.mode || mode;
          setIsSpeaking(m === "speaking");
          setIsListening(m === "listening");
        },
        onMessage: (message) => {
          // message.type: "user_transcript" | "agent_response"
          if (message?.type === "user_transcript") {
            const text = message.message || "";
            addTranscript("You", text, false);
            
            // Check for "Bye" to end conversation
            const lowerText = text.toLowerCase();
            if (lowerText.includes("bye") || lowerText.includes("goodbye") || lowerText.includes("see you")) {
               setTimeout(() => {
                 setIsVisible(false); // Hide agent on bye!
                 endConversation();
               }, 2000); // Delay slightly to let the agent say goodbye if it wants (or just cut it)
            }
          } else if (message?.type === "agent_response") {
            addTranscript("Teacher", message.message || "", true);
          }
        },
      });
      
      conversationRef.current = conversation;
    } catch (e) {
      console.error("Failed to start VoiceAgent:", e);
      setStatus("disconnected");
      
      if (e.name === "NotAllowedError") {
        alert("Microphone access is required. Please allow microphone permission and try again.");
      } else {
        alert("Failed to connect to voice agent. Please try again.");
      }
    }
  }, [droppedWords, topic, isPlaying, getClientTools, addTranscript]);

  const endConversation = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setStatus("disconnected");
    setIsSpeaking(false);
  }, []);

  // Ref to hold the latest startConversation to avoid restarting listener on every state change
  const startConversationRef = useRef(startConversation);
  useEffect(() => {
    startConversationRef.current = startConversation;
  }, [startConversation]);

  // Ref to track listening intent for callbacks
  const isListeningForWakeWordRef = useRef(true);
  
  // Update ref when state changes
  useEffect(() => {
    isListeningForWakeWordRef.current = isListeningForWakeWord;
  }, [isListeningForWakeWord]);

  // Initialize Wake Word Listener
  const startWakeWordListener = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn("Browser does not support Speech Recognition");
      setWakeWordStatus("unsupported");
      return;
    }

    try {
      if (wakeWordRecognitionRef.current) {
          // Already running? stop it first to be clean
          try { wakeWordRecognitionRef.current.stop(); } catch(e){}
          wakeWordRecognitionRef.current = null;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log("👂 Wake word listener STARTED");
        setWakeWordStatus("listening");
      };

      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim().toLowerCase();
        setLastHeard(transcript);
        console.log("👂 Heard:", transcript);

        // Check for wake word variations
        const variations = [
          "hey lulu", "hey lou", "hello lulu", "hi lulu", "hey blue", 
          "lulu", "lou lou", "teacher", "hey teacher", "hello", "hey"
        ];
        
        if (variations.some(v => transcript.includes(v))) {
          setIsVisible(true); // Show agent on wake word!
          if (isConnectedRef.current) {
             console.log("⚠️ Wake word detected but already connected.");
             return;
          }
          console.log("✨ Wake word detected!");
          
          // Stop listening logic immediately
          isListeningForWakeWordRef.current = false;
          setIsListeningForWakeWord(false);
          recognition.stop(); 
          
          if (startConversationRef.current) {
            startConversationRef.current();
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Wake word error:", event.error);
        if (event.error === 'not-allowed') {
           setWakeWordStatus("permission-denied");
           isListeningForWakeWordRef.current = false; // Stop trying
           setIsListeningForWakeWord(false);
        } else if (event.error === 'no-speech') {
           // Ignore no-speech errors, just keep listening
        } else {
           setWakeWordStatus("error");
        }
      };

      recognition.onend = () => {
        console.log("💤 Wake word listener ENDED");
        setWakeWordStatus("inactive");
        wakeWordRecognitionRef.current = null;
        
        // Immediate restart if we should be listening!
        if (isListeningForWakeWordRef.current && status === 'disconnected') {
            console.log("🔄 Restarting listener immediately...");
            setTimeout(() => {
                startWakeWordListener();
            }, 1000); // Increased delay to 1s to prevent browser throttling
        }
      };

      wakeWordRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Failed to start wake word listener:", e);
      setWakeWordStatus("error");
    }
  }, [status]); // Depend on status to ensure fresh callbacks if needed

  // Effect to manage auto-restart logic
  useEffect(() => {
    const checkRestart = () => {
        if (isListeningForWakeWord && status === "disconnected" && wakeWordStatus === "inactive") {
            // Try to restart if we should be listening but are inactive
             if (wakeWordRecognitionRef.current) {
                 try { wakeWordRecognitionRef.current.start(); } catch(e){}
             } else {
                 startWakeWordListener();
             }
        }
    };
    
    const interval = setInterval(checkRestart, 2000);
    return () => clearInterval(interval);
  }, [isListeningForWakeWord, status, wakeWordStatus, startWakeWordListener]);

  useEffect(() => {
    if (isListeningForWakeWord && status === "disconnected") {
        startWakeWordListener();
    }
    return () => {
       // Don't stop on unmount of effect if we want it to persist? 
       // No, we must stop to clean up.
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
        wakeWordRecognitionRef.current = null;
      }
    };
  }, [isListeningForWakeWord, status, startWakeWordListener]);

  // Stop wake word listener when connected to agent
  useEffect(() => {
    if (status === "connected" || status === "connecting") {
      setIsListeningForWakeWord(false);
      wakeWordRecognitionRef.current?.stop();
    } else {
      setIsListeningForWakeWord(true);
      try { wakeWordRecognitionRef.current?.start(); } catch(e){}
    }
  }, [status]);

  // React to word collection events - notify agent when child collects a new word
  useEffect(() => {
    if (!conversationRef.current || !isConnected) return;
    if (isSpeaking) return; // Don't interrupt if speaking

    const currentCount = droppedWords.length;
    if (currentCount > prevWordCountRef.current && currentCount > 0) {
      // A new word was added
      const newWord = droppedWords[droppedWords.length - 1];
      console.log(`[VoiceAgent] Word added: ${newWord.text}`);
      // The agent will notice via context on next interaction
    }
    prevWordCountRef.current = currentCount;
  }, [droppedWords, isConnected, isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession();
      }
    };
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 20, right: 250, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Avatar - Control visibility */}
      <div 
        style={{ 
          opacity: isVisible ? 1 : 0, 
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          pointerEvents: isVisible ? 'auto' : 'none'
        }}
      >
        {/* Click avatar to manually wake up (if visible) */}
        <div 
          onClick={() => {
            if (!isConnected && !isConnecting) {
              startConversation();
            }
          }}
          style={{ cursor: !isConnected ? 'pointer' : 'default' }}
          title="Click to talk!"
        >
          <Instructor speaking={isSpeaking} singing={false} />
        </div>
      </div>
      
      {/* Wake Word Status - Always show when disconnected to allow manual start */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        {!isConnected && (
          <div 
            onClick={() => {
               // Manual start on click to bypass browser autoplay policies
               if (wakeWordStatus !== 'listening' && status === 'disconnected') {
                 startWakeWordListener();
               }
            }}
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.9)",
              borderRadius: 20,
              fontSize: 11,
              color: wakeWordStatus === 'error' ? '#d32f2f' : '#666',
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: 'pointer',
              border: wakeWordStatus === 'permission-denied' ? '2px solid #ff6b6b' : 'none',
              whiteSpace: 'nowrap',
              opacity: isVisible ? 1 : 0.8 // Slightly transparent if avatar hidden
            }}
          >
            {/* Status Dot */}
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: (wakeWordStatus === 'listening' ? '#4CAF50' : wakeWordStatus === 'error' || wakeWordStatus === 'permission-denied' ? '#F44336' : '#9E9E9E'),
              animation: wakeWordStatus === 'listening' ? 'pulse 2s infinite' : 'none'
            }} />
            
            {wakeWordStatus === 'listening' ? 'Listening for "Hey Lulu"...' : 
             wakeWordStatus === 'permission-denied' ? 'Tap to Enable Mic ⚠️' : 
             'Tap to Start Listening 🎙️'}
          </div>
        )}
      </div>

      {/* Status Text Overlay (Connecting/Thinking) - Only if visible */}
      <div style={{
        position: "absolute",
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: "4px 10px",
        fontSize: 11,
        color: "#666",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        minWidth: 100,
        textAlign: "center",
        opacity: (isVisible && (isConnecting || (isConnected && !isSpeaking && !isListening))) ? 1 : 0, 
        pointerEvents: "none",
        transition: "opacity 0.3s ease",
        zIndex: 1001
      }}>
        {isConnecting && "⏳ Connecting..."}
        {isConnected && !isSpeaking && !isListening && "💭 Thinking..."}
      </div>

      {/* Transcript - Speech Bubbles - Only if visible */}
      {isVisible && transcript.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: 350, // Moved up above the avatar
          right: 0,
          width: 280,
          maxHeight: 200,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "10px",
          // Hide scrollbar but allow scrolling
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
        }}>
          {transcript.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.isAgent ? "flex-end" : "flex-start",
              background: msg.isAgent ? "white" : "rgba(255,255,255,0.8)",
              padding: "8px 12px",
              borderRadius: "12px",
              borderBottomRightRadius: msg.isAgent ? "2px" : "12px",
              borderBottomLeftRadius: msg.isAgent ? "12px" : "2px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              maxWidth: "90%",
              fontSize: "13px",
              color: "#444",
              lineHeight: 1.4
            }}>
              <span style={{ fontWeight: "bold", color: msg.isAgent ? "#7e57c2" : "#1565c0", marginRight: "4px" }}>
                {msg.isAgent ? "Lulu:" : "You:"}
              </span>
              {msg.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
