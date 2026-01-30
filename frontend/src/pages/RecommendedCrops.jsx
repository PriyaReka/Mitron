import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import { useCrop } from '../context/CropContext';
import {
    Sprout, MapPin, Calendar, Droplets, X, ChevronLeft
} from 'lucide-react';
import { cropDatabase, calculateSoilSuitability, getSoilMatchDetails } from '../utils/cropData';
import ThemeToggle from '../components/ThemeToggle';

const RecommendedCrops = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { speak } = useVoice();
    const { plantCrop } = useCrop();

    const [userProfile, setUserProfile] = useState(null);
    const [availableCrops, setAvailableCrops] = useState([]);

    // Modal State
    const [showVarietiesModal, setShowVarietiesModal] = useState(false);
    const [selectedCropForModal, setSelectedCropForModal] = useState(null);
    const [modalMarketPrice, setModalMarketPrice] = useState(null);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

    const fetchMarketPriceForCrop = async (cropName) => {
        setModalMarketPrice(null); // Reset
        setIsFetchingPrice(true);
        try {
            const district = userProfile?.district || "Madurai";
            const state = userProfile?.state || "Tamil Nadu";

            const response = await fetch(`/api/market/prices?state=${state}&district=${district}`);
            if (!response.ok) throw new Error("API Error");

            const data = await response.json();

            const match = data.find(item =>
                item.commodity.toLowerCase().includes(cropName.toLowerCase()) ||
                cropName.toLowerCase().includes(item.commodity.toLowerCase()) ||
                (item.name && item.name.toLowerCase().includes(cropName.toLowerCase()))
            );

            if (match) {
                setModalMarketPrice(match);
            }
        } catch (err) {
            console.error("Failed to fetch market price", err);
        } finally {
            setIsFetchingPrice(false);
        }
    };

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load Profile
        const storedProfile = sessionStorage.getItem('userProfile');
        if (!storedProfile) {
            navigate('/profile-setup');
            return;
        }

        const profile = JSON.parse(storedProfile);
        setUserProfile(profile);

        // --- FETCH ML RECOMMENDATIONS ---
        const fetchMLRecommendations = async () => {
            if (!profile.district) {
                setIsLoading(false);
                return;
            }
            try {
                // 1. Fetch Weather (Same logic as Dashboard)
                const preciseQuery = encodeURIComponent(`${profile.district}, ${profile.state || ''}`);
                let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${preciseQuery}&count=1&format=json`);
                let geoData = await geoRes.json();

                if (!geoData.results || geoData.results.length === 0) {
                    const broadQuery = encodeURIComponent(profile.district);
                    geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${broadQuery}&count=1&format=json`);
                    geoData = await geoRes.json();
                }

                if (!geoData.results || geoData.results.length === 0) {
                    setIsLoading(false);
                    return;
                }

                const { latitude, longitude } = geoData.results[0];

                // Fetch Current Weather for T, H
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
                const weatherRes = await fetch(weatherUrl);
                const wData = await weatherRes.json();

                // Fetch Rainfall (NASA)
                let rainfallVal = 100; // Default fallback
                try {
                    const rainRes = await fetch(`/api/weather/rainfall?lat=${latitude}&lon=${longitude}`);
                    const rainData = await rainRes.json();
                    if (rainData && rainData.rainfall !== undefined) {
                        rainfallVal = rainData.rainfall;
                    }
                } catch (e) { console.error("Rainfall fetch failed", e); }

                // --- FETCH LIVE SENSORS (New) ---
                let sensorData = {};
                try {
                    const sensRes = await fetch('/api/sensors/live');
                    const sensJson = await sensRes.json();
                    if (sensJson && sensJson.status !== "Disconnected") {
                        sensorData = sensJson;
                    }
                } catch (e) { console.error("Sensor fetch failed", e); }

                // 2. Call ML Endpoint
                // Rule: Use Sensor N, P, K, pH, Humidity (if available).
                // Leave Temperature and Rainfall (use API/Weather).
                const payload = {
                    N: sensorData.N || 140,
                    P: sensorData.P || 45,
                    K: sensorData.K || 60,
                    temperature: wData.current.temperature_2m, // API
                    humidity: sensorData.HUM || wData.current.relative_humidity_2m, // Sensor or API
                    ph: sensorData.PH || 6.5,
                    rainfall: rainfallVal // API
                };

                const mlRes = await fetch('/api/ml/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const mlData = await mlRes.json();

                if (mlData.crops && mlData.crops.length > 0) {
                    // Merge ML results with Database Details
                    const mlCrops = mlData.crops.map(rec => {
                        // Find matching details in local DB (search all keys)
                        // Flatten DB for search
                        const allDbCrops = Object.values(cropDatabase).flat();
                        const match = allDbCrops.find(c => c.id === rec.name.toLowerCase() || c.name.toLowerCase() === rec.name.toLowerCase());

                        // Construct image path dynamically based on crop name
                        // Remove spaces and convert to lowercase: e.g. "Kidney Beans" -> "kidneybeans.jpg"
                        const dynamicImage = `/images/${rec.name.toLowerCase().replace(/\s+/g, '')}.jpg`;

                        if (match) {
                            return {
                                ...match,
                                suitability: rec.confidence, // Use ML confidence
                                soilMatch: { matches: [`${t('aiModelConfidence')}: ${rec.confidence}%`], concerns: [] },
                                isML: true,
                                image: dynamicImage // Override image with dynamic path
                            };
                        } else {
                            // Generic Fallback for crops not in local DB (e.g. Jute, Lentil)
                            return {
                                id: rec.name.toLowerCase(),
                                name: rec.name.charAt(0).toUpperCase() + rec.name.slice(1),
                                suitability: rec.confidence,
                                image: dynamicImage,
                                season: "Recommended",
                                waterRequirement: "Variable",
                                varieties: [],
                                soilMatch: { matches: [`${t('aiModelConfidence')}: ${rec.confidence}%`], concerns: [] },
                                isML: true
                            };
                        }
                    });

                    // Deduplicate (in case same crop in ML and local fallbacks? No, we replace list)
                    // We will prioritize ML crops
                    setAvailableCrops(mlCrops);
                }

            } catch (err) {
                console.error("ML Recommendation Failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMLRecommendations();

    }, [navigate]);

    return (
        <div className="min-h-screen bg-mitron-light dark:bg-gray-900 pb-24 font-sans transition-colors duration-300">
            {/* Top Bar */}
            <div className="bg-mitron-green text-white p-4 sticky top-0 z-50 flex items-center shadow-md">
                <button onClick={() => navigate('/dashboard')} className="mr-4">
                    <ChevronLeft size={28} />
                </button>
                <h1 className="text-xl font-bold flex-1">{t('recommendedCrops')}</h1>
                <ThemeToggle />
            </div>

            <div className="p-4 space-y-6">

                {/* Intro Card */}
                <div className="bg-gradient-to-br from-white to-green-50 dark:from-green-950 dark:to-green-900 p-4 rounded-xl shadow-sm border-l-4 border-mitron-green dark:border-green-600 transition-colors">
                    <p className="text-sm text-gray-600 dark:text-green-100 mb-1">
                        {t('basedOnYourSoil')} ({userProfile?.district})
                    </p>
                    <div className="flex items-center gap-2">
                        <Sprout className="text-mitron-green dark:text-green-400" />
                        <span className="font-bold text-mitron-dark dark:text-white">
                            {availableCrops.length} {t('cropsFound')}
                        </span>
                    </div>
                </div>

                {/* Grid of Crops */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-mitron-green dark:border-green-500 mb-4"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300 animate-pulse font-medium">
                            {t('analyzingSoil') || 'Analyzing soil and weather data...'}
                        </p>
                    </div>
                ) : availableCrops.length === 0 ? (
                    <div className="text-center py-20">
                        <Sprout size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            {t('noRecommendations') || 'No crop recommendations found for your region.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                        {availableCrops.map(crop => (
                            <div key={crop.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all">
                                <div className="h-48 w-full relative">
                                    <img
                                        src={crop.image}
                                        alt={crop.name}
                                        onError={(e) => { e.target.onerror = null; e.target.src = "/images/placeholder_crop.jpg"; }}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                        <span className={crop.suitability >= 80 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                                            {crop.suitability}% {t('match') || 'Match'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t(crop.id)}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <Calendar size={12} />
                                                <span>{crop.season}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium`}>
                                            {crop.waterRequirement} Water
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-1">
                                        {crop.soilMatch.matches.slice(0, 3).map((m, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                <span>{m}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            disabled={!crop.varieties || crop.varieties.length === 0}
                                            className={`flex-1 py-2 rounded-lg font-bold text-sm shadow transition ${crop.varieties && crop.varieties.length > 0
                                                ? "bg-mitron-green text-white hover:bg-mitron-dark"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                                }`}
                                            onClick={() => {
                                                if (!crop.varieties || crop.varieties.length === 0) return;
                                                setSelectedCropForModal(crop);
                                                setShowVarietiesModal(true);
                                                fetchMarketPriceForCrop(crop.name);
                                                speak(`${t('varietiesAvailable')} ${t('for')} ${t(crop.id)}`);
                                            }}
                                        >
                                            {t('viewVarieties')}
                                        </button>
                                        <button
                                            onClick={() => navigate('/crop-calendar')}
                                            className="px-3 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            <Calendar size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Varieties Modal */}
            {showVarietiesModal && selectedCropForModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-5 bg-mitron-green text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold">{t(selectedCropForModal.id)} {t('varieties') || 'Varieties'}</h3>
                                <p className="text-sm opacity-90 text-green-50">Best suited for your region</p>
                            </div>
                            <button onClick={() => setShowVarietiesModal(false)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-5 overflow-y-auto min-h-0">
                            <div className="grid gap-4">
                                {selectedCropForModal.varieties.map((variety) => (
                                    <div key={variety.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-800 dark:text-white text-lg">{t(variety.id)}</h4>
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                                {variety.suitability}% Match
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} className="text-blue-500" />
                                                <span>{variety.duration} days</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Sprout size={14} className="text-green-500" />
                                                <span>{variety.yield}</span>
                                            </div>
                                            {isFetchingPrice ? (
                                                <div className="col-span-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                                                    <span className="text-xs text-gray-400 animate-pulse">Checking market rates...</span>
                                                </div>
                                            ) : modalMarketPrice ? (
                                                <div className="col-span-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600 flex justify-between items-center">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Market Price ({modalMarketPrice.market})</span>
                                                    <span className="font-bold text-green-700 dark:text-green-400">
                                                        ₹{modalMarketPrice.price}/{modalMarketPrice.unit ? modalMarketPrice.unit.split('/')[1] : 'q'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="col-span-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                                                    <span className="text-xs text-gray-400 italic">Price data unavailable</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                console.log("Plant cycle button clicked");
                                                alert("Starting planting process...");
                                                try {
                                                    const cropData = {
                                                        cropId: selectedCropForModal.id,
                                                        cropName: selectedCropForModal.name,
                                                        varietyId: variety.id,
                                                        varietyName: variety.name,
                                                        image: selectedCropForModal.image
                                                    };
                                                    console.log("Sending Data:", cropData); // Debug log

                                                    const success = await plantCrop(cropData);
                                                    if (success) {
                                                        console.log("Planting successful, navigating...");
                                                        navigate('/crop-calendar');
                                                    } else {
                                                        console.error("Planting failed (activeCrop returned false)");
                                                    }
                                                } catch (e) {
                                                    console.error("Click Handler Error:", e);
                                                    alert("Handler Error: " + e.message);
                                                }
                                            }}
                                            className="w-full mt-3 bg-mitron-green text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                                        >
                                            <Calendar size={16} /> <span>Start Crop Cycle</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
                            <button onClick={() => setShowVarietiesModal(false)} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendedCrops;
