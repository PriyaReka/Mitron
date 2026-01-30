import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const { language } = useLanguage();
    const synth = window.speechSynthesis;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const audioRef = useRef(null);

    // Map internal language names to BCP-47 tags
    const getLangTag = (lang) => {
        switch (lang) {
            case 'ta': return 'ta-IN';
            case 'hi': return 'hi-IN';
            case 'te': return 'te-IN';
            case 'kn': return 'kn-IN';
            case 'ml': return 'ml-IN';
            case 'bn': return 'bn-IN';
            case 'gu': return 'gu-IN';
            case 'mr': return 'mr-IN';
            case 'ur': return 'ur-IN';
            case 'en':
            default: return 'en-IN';
        }
    };

    const speak = async (text, forceLang) => {
        const targetLang = forceLang || language;

        // 1. Stop any current audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (synth) synth.cancel();

        // 2. Try Backend TTS (High Quality)
        try {
            const response = await fetch(`/api/chat/tts?text=${encodeURIComponent(text)}&lang=${targetLang}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;
                audio.play();
                audio.onended = () => URL.revokeObjectURL(url);
                return;
            }
        } catch (e) {
            console.warn("Backend TTS failed, falling back to browser", e);
        }

        // 3. Fallback to Browser TTS
        if (!synth) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getLangTag(targetLang);
        synth.speak(utterance);
    };

    // Helper to start listening
    const listen = ({ onResult, onStart, onEnd, onError }) => {
        console.log("VoiceContext: listen() called");
        if (!Recognition) {
            console.error("VoiceContext: SpeechRecognition not supported");
            alert("Speech recognition not supported in this browser.");
            return;
        }

        try {
            const recognition = new Recognition();
            recognition.lang = getLangTag(language);
            recognition.continuous = false;
            recognition.interimResults = false;
            console.log("VoiceContext: Recognition initialized with lang", recognition.lang);

            recognition.onstart = () => {
                console.log("VoiceContext: Recognition started");
                if (onStart) onStart();
            };

            recognition.onresult = (event) => {
                console.log("VoiceContext: Recognition result received", event.results);
                const transcript = event.results[0][0].transcript;
                if (onResult) onResult(transcript);
            };

            recognition.onerror = (event) => {
                console.error("VoiceContext: Recognition error", event.error);
                if (onError) onError(event.error);
                else speak("Sorry, I could not hear you.");
            };

            recognition.onend = () => {
                console.log("VoiceContext: Recognition ended");
                if (onEnd) onEnd();
            };

            recognition.start();
            console.log("VoiceContext: recognition.start() called");
        } catch (e) {
            console.error("VoiceContext: Setup/Start error", e);
        }
    };

    return (
        <VoiceContext.Provider value={{ speak, listen }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => useContext(VoiceContext);
