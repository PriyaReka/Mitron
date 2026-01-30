import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import VoiceInput from '../components/VoiceInput';

const Login = () => {
    const navigate = useNavigate();
    const { language, setLanguage, t } = useLanguage();
    const { speak } = useVoice();

    const [mobile, setMobile] = useState('');
    const [aadhar, setAadhar] = useState('');

    useEffect(() => {
        // Auto-redirect if already logged in
        const storedProfile = sessionStorage.getItem('userProfile');
        if (storedProfile) {
            navigate('/dashboard');
            return;
        }

        // Voice greeting on load
        speak(t('welcomeBack') + ". " + t('selectLanguage'));
    }, [language, speak, t, navigate]);

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setLanguage(lang);
        speak(`Language changed to ${lang}`, lang);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        // 1. Check for Admin Login (Mock Logic)
        // In a real app, this role check would happen on the backend
        if (mobile === "9999999999" && aadhar === "123412341234") {
            sessionStorage.setItem('adminAuth', 'true');
            speak(t('welcomeOfficial'));
            navigate('/admin');
            return;
        }

        speak(t('loggingIn'));

        try {
            // check mobile existence first or direct login
            // For now, let's assume direct login or check-mobile flow.
            // But since the UI has Login separate from Register, let's try login.
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: mobile }) // Sending mobile only as per current UI
            });
            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('userProfile', JSON.stringify(data.user));
                sessionStorage.setItem('token', data.token);
                speak(`Welcome back, ${data.user.fullName || 'Farmer'}`);
                if (data.user.onboardingCompleted) {
                    navigate('/dashboard');
                } else {
                    navigate('/profile-setup');
                }
            } else {
                // If user not found, maybe redirect to register?
                // For this demo, let's just say user not found. 
                // OR if the user clicks "Register" they go to profile setup.
                speak(t('userNotFound'));
            }
        } catch (err) {
            console.error(err);
            speak(t('connectionError'));
        }
    };

    return (
        <div className="min-h-screen bg-mitron-light dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <h2 className="text-3xl font-bold text-mitron-dark dark:text-white mb-8 mt-4">{t('signIn')}</h2>

            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-5 md:p-8 rounded-2xl shadow-lg space-y-6 transition-colors">

                {/* Language Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('selectLanguage')}</label>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="w-full p-4 md:p-3 border rounded-xl text-lg bg-gray-50 border-gray-300 outline-none focus:ring-2 focus:ring-mitron-green dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="te">Telugu</option>
                        <option value="ta">Tamil</option>
                        <option value="kn">Kannada</option>
                        <option value="ml">Malayalam</option>
                    </select>
                </div>

                {/* Mobile Input */}
                <VoiceInput
                    value={mobile}
                    onChange={setMobile}
                    placeholder={t('enterMobile')}
                    type="tel"
                />

                {/* Aadhar Input */}
                <VoiceInput
                    value={aadhar}
                    onChange={setAadhar}
                    placeholder={t('enterAadhaar')}
                    type="number"
                />

                <button
                    onClick={handleLogin}
                    className="w-full bg-mitron-green text-white py-4 rounded-xl text-xl font-bold hover:bg-mitron-dark transition-transform transform active:scale-95 shadow-md"
                >
                    {t('signIn')}
                </button>

                <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
                    {t('newHere')} <span className="text-mitron-green font-bold cursor-pointer" onClick={() => navigate('/profile-setup')}>{t('register')}</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
