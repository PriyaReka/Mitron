import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';

const Schemes = () => {
    const navigate = useNavigate();
    const { speak } = useVoice();
    const { t } = useLanguage();

    // State
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { language } = useLanguage();

    // Fetch Recommendation
    useEffect(() => {
        const fetchSchemes = async () => {
            // 1. Check Local Cache (Immediate Render for Offline/Speed)
            const cacheKey = `schemes_cache_${language}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    setSchemes(JSON.parse(cachedData));
                    if (navigator.connection && navigator.connection.saveData) {
                        setLoading(false); // If on data saver, rely on cache
                        return;
                    }
                    // Keep loading true to fetch fresh data in background
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }

            try {
                const userProfile = JSON.parse(sessionStorage.getItem('userProfile') || '{}');

                // Prepare Payload
                const payload = {
                    userProfile: {
                        state: userProfile?.location?.state,
                        farmerType: userProfile?.farming?.farmerType,
                        landSize: parseFloat(userProfile?.farming?.landArea) || 0,
                        caste: userProfile?.demographics?.category,
                        crops: userProfile?.farming?.primaryCrop ? [userProfile.farming.primaryCrop] : []
                    },
                    language: language // Send selected language
                };

                const response = await fetch('/api/schemes/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error("Failed to fetch schemes");

                const data = await response.json();
                setSchemes(data);

                // Update Cache
                localStorage.setItem(cacheKey, JSON.stringify(data));

                // Voice announcement (only if fresh data differs or first load)
                if (data.length > 0 && !cachedData) {
                    speak(t('schemesUpdated') || `Found ${data.length} schemes for you.`);
                }
            } catch (err) {
                console.error(err);
                if (!cachedData) setError(err.message); // Only show error if no cache
            } finally {
                setLoading(false);
            }
        };

        fetchSchemes();
    }, [language, speak, t]); // Re-run when language changes

    const handleVisit = (url) => {
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
            <div className="bg-mitron-green text-white p-4 sticky top-0 shadow-md flex items-center justify-between z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 text-2xl">←</button>
                    <h1 className="text-xl font-bold">{t('governmentSchemes')}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Loader */}
                {loading && (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mitron-green mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300 animate-pulse">
                            Scanning official portals & extracting rules...
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                        Unable to load schemes. Check connection.
                    </div>
                )}

                {/* List */}
                {!loading && schemes.map((item, index) => (
                    <div key={index} className={`p-5 rounded-xl shadow-md border transition-colors ${item.type === 'state'
                        ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700 ring-1 ring-green-300 dark:ring-green-600'
                        : 'bg-gradient-to-br from-white to-green-50 dark:from-green-950 dark:to-green-900 border-green-100 dark:border-green-900'
                        }`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-mitron-dark dark:text-green-50">{item.name}</h3>
                                {item.eligible && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                        Verified Eligible
                                    </span>
                                )}
                            </div>
                            <button onClick={() => speak(item.detailed_description || `${item.name}. ${item.description}`)} className="text-mitron-green text-xl">🔊</button>
                        </div>
                        <p className="text-gray-600 dark:text-green-200 mt-2 text-sm leading-relaxed">
                            {item.detailed_description || item.description}
                        </p>

                        {item.match_reason && (
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 italic">
                                💡 {item.match_reason}
                            </p>
                        )}

                        <div className="mt-4 flex gap-2">
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${item.type === 'state'
                                ? 'bg-green-600 text-white dark:bg-green-500'
                                : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                }`}>
                                {item.type === 'state' ? item.state : 'Central'}
                            </div>
                        </div>

                        <button
                            onClick={() => handleVisit(item.url)}
                            className="w-full mt-4 border border-mitron-green text-mitron-green dark:text-green-400 dark:border-green-400 py-2 rounded-lg font-bold hover:bg-mitron-green hover:text-white transition"
                        >
                            {t('visitPortal')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schemes;
