import React, { useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';

const VoiceInput = ({ value, onChange, placeholder, type = "text", onFocus }) => {
    const { listen, speak } = useVoice();
    const { t } = useLanguage();
    const [isListening, setIsListening] = useState(false);

    const handleMicClick = () => {
        setIsListening(true);
        listen({
            onStart: () => {
                setIsListening(true);
                speak(t('listening'));
            },
            onResult: (transcript) => {
                onChange(transcript);
                speak(`You said ${transcript}`);
            },
            onError: (err) => {
                setIsListening(false);
                if (err === 'no-speech') {
                    // speak("I didn't hear anything."); // Optional
                }
            },
            onEnd: () => {
                setIsListening(false);
            }
        });
    };

    return (
        <div className="relative w-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{placeholder}</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-mitron-green transition-all bg-white shadow-sm">
                <input
                    type={type}
                    className="flex-1 px-4 py-3 outline-none text-lg"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    onFocus={onFocus}
                />
                <button
                    type="button"
                    onClick={handleMicClick}
                    className={`p-3 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-mitron-green'} text-white transition-colors`}
                >
                    {isListening ? (
                        <span className="material-icons">mic_off</span> // You can use an SVG here if icons need loader
                    ) : (
                        <span className="text-xl">🎤</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default VoiceInput;
