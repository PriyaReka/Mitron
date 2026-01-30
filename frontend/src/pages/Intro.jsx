import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Intro = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const timer = setTimeout(() => {
            const userProfile = sessionStorage.getItem('userProfile');
            if (userProfile) {
                navigate('/dashboard');
            } else {
                navigate('/login');
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="h-screen w-full bg-gradient-to-b from-mitron-green to-mitron-dark flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
            <div className="z-10 text-center animate-fade-in">
                <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">MITRON</h1>
                <p className="text-xl font-light italic animate-pulse-slow">"{t('introTagline')}"</p>
            </div>

            {/* Background decoration */}
            <div className="absolute bottom-0 w-full h-1/3 bg-mitron-light opacity-10 rounded-t-full transform scale-150"></div>
        </div>
    );
};

export default Intro;
