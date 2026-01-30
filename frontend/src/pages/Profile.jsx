import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';

const Profile = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { speak } = useVoice();

    // Mock User Data (would come from Context/API)
    const user = {
        name: "Ramesh Kumar",
        mobile: "9876543210",
        location: "Coimbatore, Tamil Nadu",
        landType: "Wet",
        language: "English"
    };

    useEffect(() => {
        speak(`This is your profile, ${user.name}.`);
    }, []);

    return (
        <div className="min-h-screen bg-mitron-light pb-20">
            <div className="bg-mitron-green text-white p-4 sticky top-0 shadow-md flex items-center">
                <button onClick={() => navigate(-1)} className="mr-4 text-2xl">←</button>
                <h1 className="text-xl font-bold">{t('myProfile')}</h1>
            </div>

            <div className="p-6 space-y-6">

                <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                    <div className="w-24 h-24 bg-mitron-light rounded-full mx-auto flex items-center justify-center text-4xl mb-4 border-2 border-mitron-green">
                        👤
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                    <p className="text-gray-500 font-medium">{user.mobile}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b pb-2">Details</h3>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('locationDetails')}</span>
                        <span className="font-bold text-gray-800">{user.location}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('landType')}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{user.landType}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('language')}</span>
                        <span className="font-bold text-gray-800">{user.language}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b pb-2">Settings</h3>

                    <button className="w-full flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                        <span>🌙 Dark Mode</span>
                        <div className="w-10 h-5 bg-gray-300 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full shadow-md transform scale-110"></div>
                        </div>
                    </button>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold border border-red-100 hover:bg-red-100"
                >
                    {t('logout')}
                </button>
            </div>
        </div>
    );
};

export default Profile;
