import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext'; // Sync with global app language
import { useVoice } from '../context/VoiceContext';
import { offlineTranslations, offlineResponses } from '../utils/translations';
import {
    MessageCircle,
    Mic,
    MicOff,
    Send,
    X,
    Minimize2,
    Wifi,
    WifiOff,
    Settings,
    Play,
    Pause,
    Volume2,
    Image as ImageIcon,
    Paperclip,
    Globe,
    History,
    Plus,
    MessageSquare
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper for location
const getCurrentLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            }),
            () => resolve(null),
            { timeout: 5000 }
        );
    });
};

const Chatbot = () => {
    console.log("Chatbot Component Mounted");
    // Integration with existing Contexts
    const { language: appLanguage, setLanguage: setAppLanguage } = useLanguage();

    // Local State
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // User Identity for history
    const [userId, setUserId] = useState(null);

    // Chat History State
    const [showHistory, setShowHistory] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Voice & Settings State
    const [voiceMode, setVoiceMode] = useState("push-to-talk"); // "off", "push-to-talk", "continuous"
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [showLanguageSelection, setShowLanguageSelection] = useState(false);
    const [voiceSettings, setVoiceSettings] = useState({
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voiceIndex: 0
    });
    const [availableVoices, setAvailableVoices] = useState([]);
    const [interimTranscript, setInterimTranscript] = useState("");
    const [voiceStatus, setVoiceStatus] = useState("idle"); // idle, listening, processing, speaking

    // Refs
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Language Mapping
    const languageMap = {
        en: "en-US",
        hi: "hi-IN",
        te: "te-IN",
        ta: "ta-IN",
        kn: "kn-IN",
        ml: "ml-IN",
        bn: "bn-IN",
        gu: "gu-IN",
    };

    const languageOptions = [
        { code: "en", name: "English", nativeName: "English" },
        { code: "hi", name: "Hindi", nativeName: "हिंदी" },
        { code: "te", name: "Telugu", nativeName: "తెలుగు" },
        { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
        { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
        { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
        { code: "bn", name: "Bengali", nativeName: "বাংলা" },
        { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    ];

    // Initialization
    useEffect(() => {
        // Load User ID
        const storedProfile = sessionStorage.getItem('userProfile');
        if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            setUserId(profile.mobile || "guest_user");
        } else {
            setUserId("guest_user");
        }

        // Online/Offline listeners
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Speech Recognition Setup
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = languageMap[appLanguage] || "en-US";

                recognitionRef.current.onstart = () => {
                    console.log("Mic started");
                    setIsListening(true);
                    setVoiceStatus("listening");
                };

                recognitionRef.current.onerror = (event) => {
                    console.error("Mic Error:", event.error);
                    setIsListening(false);
                    setVoiceStatus("idle");
                    // alert(`Microphone Error: ${event.error}. Please allow microphone access.`);
                };

                recognitionRef.current.onresult = (event) => {
                    let finalTranscript = '';
                    let interim = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    setInterimTranscript(interim);
                    if (finalTranscript) {
                        setInputText(prev => prev + finalTranscript);
                        setInterimTranscript('');

                        if (voiceMode === "continuous") {
                            sendMessage(finalTranscript);
                        }
                    }
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                    setVoiceStatus("idle");
                    if (voiceMode === "continuous" && !isLoading) {
                        setTimeout(() => {
                            try { recognitionRef.current?.start(); } catch (e) { }
                        }, 500);
                    }
                };
            }

            // Synthesis Setup
            if ('speechSynthesis' in window) {
                synthesisRef.current = window.speechSynthesis;
                const loadVoices = () => {
                    const voices = synthesisRef.current.getVoices();
                    setAvailableVoices(voices);
                };
                window.speechSynthesis.onvoiceschanged = loadVoices;
                loadVoices();
            }
        }

        // Initial Message if empty
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                text: offlineTranslations[appLanguage]?.welcomeMessage || "Hello! Ask me about agriculture.",
                isUser: false
            }]);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            recognitionRef.current?.stop();
            synthesisRef.current?.cancel();
        };
    }, [appLanguage]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch History Logic
    useEffect(() => {
        if (showHistory && userId) {
            fetchChatHistory();
        }
    }, [showHistory, userId]);

    const fetchChatHistory = async () => {
        try {
            const res = await fetch(`/api/chat/history?userId=${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setChatHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/chat/history/${sessionId}`);
            const data = await res.json();

            if (data && data.messages) {
                // Map backend messages to frontend format
                const mappedMessages = data.messages.map((msg, idx) => ({
                    id: idx,
                    text: msg.content,
                    isUser: msg.role === 'user',
                    timestamp: msg.timestamp
                }));
                setMessages(mappedMessages);
                setCurrentSessionId(sessionId);
                setShowHistory(false); // Close history view
            }
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([{
            id: 'welcome',
            text: offlineTranslations[appLanguage]?.welcomeMessage || "Hello! Ask me about agriculture.",
            isUser: false
        }]);
        setShowHistory(false);
    };

    // Helper: Speak
    const speakText = async (text) => {
        if (voiceMode === "off" || !text) return;

        // Cancel previous
        stopSpeaking();

        try {
            setVoiceStatus("speaking");
            setIsSpeaking(true);

            // Construct URL
            const url = `/api/chat/tts?text=${encodeURIComponent(text)}&lang=${appLanguage}`;

            const audio = new Audio(url);
            audio.onended = () => {
                setIsSpeaking(false);
                setVoiceStatus("idle");
            };
            audio.onerror = () => {
                console.error("Audio playback error");
                setIsSpeaking(false);
                setVoiceStatus("idle");
            };

            // Store ref to cancel later if needed
            window.currentAudio = audio;
            await audio.play();

        } catch (e) {
            console.error("TTS Playback failed", e);
            setIsSpeaking(false);
            setVoiceStatus("idle");
        }
    };

    const stopSpeaking = () => {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        synthesisRef.current?.cancel(); // Fallback cleanup
        setIsSpeaking(false);
    };

    const startListening = () => {
        try {
            if (!recognitionRef.current) {
                console.error("SpeechRecognition not initialized");
                return;
            }
            const lang = languageMap[appLanguage] || "en-US";
            console.log(`Starting Mic in ${lang} mode`);
            recognitionRef.current.lang = lang;
            recognitionRef.current.start();
        } catch (e) {
            console.error("Mic start error", e);
        }
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
    };

    const sendMessage = async (overrideText = null) => {
        const textToSend = overrideText || inputText;
        if (!textToSend.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), text: textToSend, isUser: true, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsLoading(true);
        setVoiceStatus("processing");

        try {
            // Prepare User Context (Profile + Mock Sensors)
            let userContext = null;
            const storedProfile = sessionStorage.getItem('userProfile');
            if (storedProfile) {
                const profile = JSON.parse(storedProfile);
                userContext = {
                    name: profile.fullName || "Farmer",
                    location: `${profile.district || ''}, ${profile.state || ''}`,
                    soil: {
                        type: profile.soilProfile?.soilType || profile.farming?.soilType || "Unknown",
                        landSize: profile.farming?.landArea || profile.totalArea || "Unknown",
                        waterSource: profile.farming?.irrigationType || profile.soilProfile?.irrigationAvailable || "Unknown"
                    },
                    // Mock Sensor Data (To be replaced by real Bluetooth data later)
                    sensors: {
                        ph: 6.8,
                        n: 140,
                        p: 45,
                        k: 60,
                        moisture: 42
                    }
                };
            }

            // Call the real backend API with history support
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: textToSend,
                    language: appLanguage,
                    userId: userId,
                    sessionId: currentSessionId, // Pass current session if exists
                    userContext: userContext // Pass the rich context
                }),
            });

            const data = await response.json();

            if (data.reply) {
                const botMsg = { id: Date.now() + 1, text: data.reply, isUser: false, timestamp: new Date() };
                setMessages(prev => [...prev, botMsg]);
                speakText(data.reply);

                // Update Session ID if it was a new chat
                if (data.sessionId) {
                    setCurrentSessionId(data.sessionId);
                }
            } else {
                throw new Error("No reply from server");
            }

        } catch (error) {
            console.error(error);
            let errorMessage = "Sorry, I cannot connect to the server. Please ensure the backend is running.";
            if (error.message === "No reply from server") {
                errorMessage = "The server is running but returned no data.";
            }
            const errMsg = { id: Date.now() + 1, text: errorMessage, isUser: false };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
            if (voiceStatus !== "speaking") setVoiceStatus("idle");
        }
    };


    // UI RENDER
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-mitron-green hover:bg-mitron-dark shadow-2xl z-50 flex items-center justify-center text-white transition-transform hover:scale-110"
            >
                <MessageCircle size={32} />
            </button>
        );
    }

    return (
        <>
            {/* Language Selection Modal (Overlay) */}
            {showLanguageSelection && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-80 shadow-2xl p-4 animate-fade-in">
                        <div className="text-center mb-4">
                            <Globe className="mx-auto text-mitron-green mb-2" size={32} />
                            <h3 className="font-bold text-lg">Select Language</h3>
                            <p className="text-xs text-gray-500">Choose your preferred language</p>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {languageOptions.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setAppLanguage(lang.code); // Update global app context
                                        setShowLanguageSelection(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border ${appLanguage === lang.code ? 'bg-mitron-green text-white border-mitron-green' : 'bg-gray-50 hover:bg-gray-100 border-gray-100'}`}
                                >
                                    <span className="font-bold block text-sm">{lang.nativeName}</span>
                                    <span className="text-xs opacity-80">{lang.name}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowLanguageSelection(false)} className="mt-4 w-full py-2 text-gray-500 text-sm">Cancel</button>
                    </div>
                </div>
            )}

            {/* Chat Window */}
            <div className={`fixed bottom-6 right-6 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px]'}`}>

                {/* Header */}
                <div className="bg-mitron-green text-white p-3 rounded-t-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <div>
                            <h3 className="font-bold text-sm">{offlineTranslations[appLanguage]?.chatTitle || "Assistant"}</h3>
                            <div className="flex items-center gap-1 text-[10px] opacity-90">
                                {isOnline ? <Wifi size={10} className="text-green-300" /> : <WifiOff size={10} className="text-red-300" />}
                                {isOnline ? (showHistory ? "History" : "Online") : "Offline Mode"}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setShowLanguageSelection(true)} className="p-2 hover:bg-white/10 rounded-full" title="Language"><Globe size={16} /></button>
                        <button onClick={() => setShowVoiceSettings(!showVoiceSettings)} className="p-2 hover:bg-white/10 rounded-full" title="Settings"><Settings size={16} /></button>
                        <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-full" title={isMinimized ? "Expand" : "Minimize"}><Minimize2 size={16} /></button>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full bg-red-500/0 hover:bg-red-500/20" title="Close"><X size={16} /></button>
                    </div>
                </div>

                {!isMinimized && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 relative">

                        {/* History Overlay */}
                        {showHistory && (
                            <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in fade-in slide-in-from-bottom-5">
                                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <History size={18} /> Chat History
                                    </h3>
                                    <button
                                        onClick={() => setShowHistory(false)}
                                        className="p-1 hover:bg-gray-200 rounded-full"
                                    >
                                        <X size={18} className="text-gray-500" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    <button
                                        onClick={startNewChat}
                                        className="w-full text-left p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-mitron-green hover:text-mitron-green flex items-center justify-center gap-2 transition-colors mb-2"
                                    >
                                        <Plus size={18} /> Start New Chat
                                    </button>

                                    {chatHistory.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm mt-10">No history found</p>
                                    ) : (
                                        chatHistory.map(session => (
                                            <button
                                                key={session.id}
                                                onClick={() => loadSession(session.id)}
                                                className={`w-full text-left p-3 rounded-xl border transition-colors hover:shadow-sm ${currentSessionId === session.id ? 'bg-green-50 border-green-200 ring-1 ring-green-400' : 'bg-white border-gray-100'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm text-gray-800 line-clamp-1">{session.title}</span>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(session.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                    {session.preview}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Settings Panel Overlay */}
                        {showVoiceSettings && (
                            <div className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur z-10 border-b p-4 space-y-4 shadow-lg animate-in slide-in-from-top-10">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Voice Mode</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        {['off', 'push-to-talk', 'continuous'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setVoiceMode(mode)}
                                                className={`flex-1 py-1 text-xs rounded-md capitalize transition ${voiceMode === mode ? 'bg-white shadow text-mitron-green font-bold' : 'text-gray-500'}`}
                                            >
                                                {mode.replace(/-/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-gray-700">
                                        <span>Rate: {voiceSettings.rate}x</span>
                                        <span>Vol: {Math.round(voiceSettings.volume * 100)}%</span>
                                    </div>
                                    <input type="range" min="0.5" max="2" step="0.1" value={voiceSettings.rate} onChange={e => setVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-mitron-green" />
                                </div>
                                <button onClick={() => setShowVoiceSettings(false)} className="w-full py-1 text-xs text-gray-400">Close Settings</button>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} `}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm relative group ${msg.isUser ? 'bg-mitron-green text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            {msg.isUser ? (
                                                msg.text
                                            ) : (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                        {!msg.isUser && voiceMode !== 'off' && (
                                            <button
                                                onClick={() => speakText(msg.text)}
                                                className="absolute -right-8 top-1 p-1 text-gray-400 hover:text-mitron-green opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Volume2 size={14} />
                                            </button>
                                        )}
                                        <span className={`text-[10px] absolute bottom-1 ${msg.isUser ? 'left-2 text-green-100' : 'right-2 text-gray-400'} opacity-70`}>
                                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 bg-gray-100 text-gray-500 rounded-full px-4 py-2 text-xs">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100 flex items-end gap-2">
                            {/* Mic Button handled by mode */}
                            {voiceMode !== 'off' && (
                                <button
                                    onMouseDown={voiceMode === 'push-to-talk' ? startListening : undefined}
                                    onMouseUp={voiceMode === 'push-to-talk' ? stopListening : undefined}
                                    onClick={voiceMode === 'continuous' ? (isListening ? stopListening : startListening) : undefined}
                                    className={`p-3 rounded-full transition shadow-sm ${isListening
                                        ? (voiceMode === 'continuous'
                                            ? 'bg-green-50 text-green-600 border border-green-200 animate-pulse'
                                            : 'bg-red-50 text-red-500 border border-red-200 animate-pulse')
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                            )}

                            {/* HISTORY BUTTON (Replaces File Upload) */}
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`p-3 rounded-full transition shadow-sm ${showHistory ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                title="Chat History"
                            >
                                <History size={20} />
                            </button>

                            <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-mitron-green/20 transition">
                                {interimTranscript && <p className="text-xs text-gray-500 italic mb-1">"{interimTranscript}"</p>}
                                <textarea
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    placeholder={voiceStatus === 'listening' ? "Listening..." : "Type your question..."}
                                    className="w-full bg-transparent outline-none text-sm resize-none max-h-20"
                                    rows={1}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                />
                            </div>

                            <button
                                onClick={() => sendMessage()}
                                disabled={!inputText.trim()}
                                className={`p-3 rounded-full shadow-lg transition ${inputText.trim() ? 'bg-mitron-green text-white hover:bg-mitron-dark' : 'bg-gray-200 text-gray-400'}`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Chatbot;
