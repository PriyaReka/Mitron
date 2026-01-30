import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import {
    Sprout, User, Settings, MapPin, Ruler, TrendingUp, RefreshCw,
    Calendar, Droplets, Thermometer, Cloud, TestTube, Beaker, X,
    Clock, History, UserCheck, ChevronRight, Droplet, Lightbulb
} from 'lucide-react';
import { cropDatabase, calculateSoilSuitability, getSoilMatchDetails } from '../utils/cropData';
import Chatbot from '../components/Chatbot';
import { useCrop } from '../context/CropContext';


import ThemeToggle from '../components/ThemeToggle';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { speak } = useVoice();
    const { activeCrop } = useCrop();

    const [userProfile, setUserProfile] = useState(null);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [showIrrigationModal, setShowIrrigationModal] = useState(false);

    // Mock Data States
    const [weatherData, setWeatherData] = useState({
        locationName: t('loading') + "...",
        temperature: "--",
        humidity: "--",
        rainfall: "--",
        soilMoisture: "--",
        isDefault: true
    });
    const [liveSensorData, setLiveSensorData] = useState(null);
    const [plantingAdvice, setPlantingAdvice] = useState(null);
    const [irrigationSummary, setIrrigationSummary] = useState(null); // { current, upcoming }

    // Poll Sensors
    useEffect(() => {
        const fetchSensors = async () => {
            try {
                const res = await fetch('/api/sensors/live');
                const data = await res.json();
                if (data && data.status !== "Disconnected") {
                    setLiveSensorData(data);
                }
            } catch (err) {
                console.error("Sensor fetch error", err);
            }
        };

        fetchSensors();
        const interval = setInterval(fetchSensors, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        console.log("Dashboard Mounted"); // Debug
        // Load Profile
        const storedProfile = sessionStorage.getItem('userProfile');
        console.log("Stored Profile:", storedProfile ? "Found" : "Not Found"); // Debug

        if (!storedProfile) {
            console.log("Redirecting to profile setup"); // Debug
            navigate('/profile-setup');
            return;
        }

        let profile;
        try {
            profile = JSON.parse(storedProfile);
            setUserProfile(profile);
            console.log("Profile set in state"); // Debug
        } catch (e) {
            console.error("Profile Parse Error", e);
            return;
        }

        // Fetch Irrigation Summary
        if (profile && profile.mobile) {
            fetch(`/api/irrigation/my-schedule?mobile=${profile.mobile}`)
                .then(res => res.json())
                .then(data => {
                    setIrrigationSummary(data);
                })
                .catch(err => console.error("Irrigation fetch error", err));
        }

        // Process Crops
        const locationKey = `IN-${profile.state}`;
        const baseCrops = cropDatabase[locationKey] || cropDatabase.default;

        const processedCrops = baseCrops.map(crop => ({
            ...crop,
            suitability: calculateSoilSuitability(crop, profile),
            soilMatch: getSoilMatchDetails(crop, profile)
        })).sort((a, b) => b.suitability - a.suitability);

        setAvailableCrops(processedCrops);

        // Mock Advice
        setPlantingAdvice({
            currentSeason: "Rabi",
            seasonalAdvice: t('seasonalAdvice') || "Ideal time for sowing wheat and pulses. Maintain soil moisture.",
            weatherRecommendations: [
                t('recommendation1') || "Monitor moisture levels due to expected dry spell.",
                t('recommendation2') || "Mulching recommended to conserve water."
            ],
            recommendedCrops: [
                { name: t('wheat'), priority: 'high', reason: "High yield potential", plantingWindow: "Nov-Dec" },
                { name: t('mustard'), priority: 'medium', reason: "Good market price", plantingWindow: "Oct-Nov" } // fixed
            ]
        });

        // Fetch Weather from Open-Meteo
        const fetchWeather = async () => {
            if (!profile.district) return;
            try {
                // Geo & Weather Logic (Existing)
                const preciseQuery = encodeURIComponent(`${profile.district}, ${profile.state || ''}`);
                let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${preciseQuery}&count=1&format=json`);
                let geoData = await geoRes.json();
                let broadQuery = "";

                if (!geoData.results || geoData.results.length === 0) {
                    broadQuery = encodeURIComponent(profile.district);
                    geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${broadQuery}&count=1&format=json`);
                    geoData = await geoRes.json();
                }

                if (!geoData.results || geoData.results.length === 0) {
                    setWeatherData({ error: true, locationName: "Demo Weather", temperature: 28, humidity: 65, rainfall: 12, soilMoisture: 45 });
                    return;
                }

                const { latitude, longitude, name, admin1 } = geoData.results[0];
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,soil_moisture_0_1cm&timezone=auto`;
                const weatherRes = await fetch(weatherUrl);
                const wData = await weatherRes.json();
                const current = wData.current;

                // --- NEW: Fetch Rainfall from our Python Backend (NASA POWER) ---
                let rainfallValue = 0;
                let rainfallSource = "NASA";
                try {
                    const rainRes = await fetch(`/api/weather/rainfall?lat=${latitude}&lon=${longitude}`);
                    const rainData = await rainRes.json();
                    if (rainData && rainData.rainfall !== undefined) {
                        rainfallValue = rainData.rainfall;
                        rainfallSource = rainData.date ? `NASA (${rainData.date.slice(4, 6)}/${rainData.date.slice(6, 8)})` : "NASA";
                    }
                } catch (rErr) {
                    console.error("Rainfall backend fetch failed", rErr);
                }

                setWeatherData({
                    locationName: `${name}${admin1 ? `, ${admin1}` : ''}`,
                    temperature: current.apparent_temperature,
                    realTemp: current.temperature_2m,
                    humidity: current.relative_humidity_2m,
                    rainfall: rainfallValue,
                    rainfallSource: rainfallSource, // Pass source/date for display
                    soilMoisture: current.soil_moisture_0_1cm || 45
                });

            } catch (error) {
                console.error("Error fetching weather:", error);
                setWeatherData({ error: true, locationName: "Connection Error", temperature: 28, humidity: 65, rainfall: 12, soilMoisture: 45 });
            }
        };

        fetchWeather();

    }, [navigate, speak, t]);

    if (!userProfile) {
        console.log("Dashboard Render: Loading...");
        return <div className="min-h-screen flex items-center justify-center bg-mitron-light">{t('loading')}</div>;
    }

    console.log("Dashboard Render: Content");

    const { soilProfile } = userProfile;

    // Helper to get display data for Irrigation Card
    const getIrrigationDisplay = () => {
        if (!irrigationSummary) return { title: "Loading...", time: "--:--", status: "checking" };

        if (irrigationSummary.current) {
            return {
                title: "Active Now",
                time: `${irrigationSummary.current.startTime} - ${irrigationSummary.current.endTime}`,
                status: "active",
                officer: irrigationSummary.current.officer
            };
        } else if (irrigationSummary.upcoming && irrigationSummary.upcoming.length > 0) {
            const next = irrigationSummary.upcoming[0];
            return {
                title: `Next: ${next.date}`,
                time: `${next.startTime}`,
                status: "upcoming",
                officer: next.officer
            };
        } else {
            return { title: t('noUpcomingTurns'), time: "--", status: "idle" };
        }
    };

    const irrDisplay = getIrrigationDisplay();

    return (
        <div className="min-h-screen bg-mitron-light dark:bg-gray-900 pb-4 font-sans transition-colors duration-300 relative">
            {/* Top Bar */}
            <div className="bg-mitron-green text-white p-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
                <span className="text-xl md:text-2xl font-bold truncate">MITRON</span>
                <div className="flex space-x-2 md:space-x-4 items-center">
                    <button onClick={() => {
                        if (activeCrop) {
                            navigate('/crop-calendar');
                        } else {
                            navigate('/recommended-crops');
                        }
                    }} className="text-sm font-bold bg-white text-mitron-green px-2 md:px-3 py-1 rounded-full flex items-center gap-1">
                        <Calendar size={14} /> <span className="hidden sm:inline">{t('calendar')}</span>
                    </button>
                    <button onClick={() => navigate('/schemes')} className="text-sm font-bold bg-white text-mitron-green px-2 md:px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="hidden sm:inline">{t('schemes')}</span>
                        <span className="sm:hidden font-bold">₹</span>
                    </button>
                    <ThemeToggle />
                    <button onClick={() => navigate('/settings')} className="text-xl p-1 bg-white/20 rounded-full hover:bg-white/30 transition">⚙️</button>
                </div>
            </div>

            <div className="p-3 space-y-3">

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* PRIMARY LEFT COLUMN: Irrigation Turn Over */}
                    <div className="md:col-span-2">
                        {/* Irrigation Turn Over Card */}
                        <div
                            onClick={() => navigate('/irrigation-schedule')}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-900 rounded-2xl p-5 text-white shadow-lg cursor-pointer transform transition-all hover:scale-[1.01] hover:shadow-xl relative overflow-hidden h-full flex flex-col justify-center"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Droplets size={120} />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-sm uppercase tracking-wide font-semibold text-blue-100 mb-1 flex items-center gap-2">
                                    <Droplet size={16} className="text-cyan-300" />
                                    {t('irrigationTurnOver')}
                                </h2>

                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                                    <div>
                                        <p className="text-blue-100 text-sm mb-1">{irrDisplay.title}</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-extrabold">{irrDisplay.time}</span>
                                        </div>
                                        {irrDisplay.officer && (
                                            <div className="mt-3 flex items-center gap-2 text-sm bg-black/20 w-fit px-3 py-1 rounded-full border border-white/10">
                                                <UserCheck size={14} className="text-green-300" />
                                                <span>{t('assignedBy')} {irrDisplay.officer}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 min-w-[140px]">
                                        <p className="text-xs text-blue-200 mb-1">{t('status')}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                {irrDisplay.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                                <span className={`relative inline-flex rounded-full h-3 w-3 ${irrDisplay.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            </span>
                                            <span className="font-bold text-lg capitalize">{irrDisplay.status}</span>
                                        </div>
                                        <div className="mt-2 text-xs flex items-center gap-1 text-blue-100">
                                            <span>{t('viewFullSchedule')}</span> <ChevronRight size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECONDARY RIGHT COLUMN: Farmer Profile & Status */}
                    <div className="md:col-span-1 space-y-3 flex flex-col">

                        {/* Minimal Welcome Box */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-mitron-green dark:border-green-600 flex-none">
                            <h2 className="text-base font-bold text-gray-800 dark:text-green-50">{t('welcomeUser')}, {userProfile.fullName}!</h2>
                            <p className="text-xs text-gray-500 dark:text-green-200 flex items-center gap-1 mt-1">
                                <MapPin size={12} /> {userProfile.district}, {userProfile.state}
                            </p>
                        </div>

                        {/* 2. Quick Link: Recommended Crops */}
                        <div
                            onClick={() => navigate('/recommended-crops')}
                            className="bg-mitron-green text-white p-4 rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:bg-mitron-dark transition-colors flex-1"
                        >
                            <div>
                                <h3 className="font-bold text-base">{t('recommendedCrops')}</h3>
                                <p className="text-xs text-green-100 mt-1">{availableCrops.length} {t('suitableCrops')}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-full transform rotate-12">
                                <Sprout size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weather & Advice Section (Light: Pastel, Dark: Green Theme) */}
                {weatherData && plantingAdvice && (
                    <div className="bg-gradient-to-br from-white to-green-50 dark:bg-none dark:bg-mitron-green rounded-2xl p-4 shadow-md border border-green-100 dark:border-green-600 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="text-red-500 dark:text-red-400" size={24} />
                                <div>
                                    <h3 className="text-l text-black dark:text-white font-semibold">
                                        {t('personalizedAdvice')}
                                    </h3>
                                </div>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-xs text-gray-400 dark:text-green-200 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full">
                                    {t('live')}
                                </span>
                            </div>
                        </div>

                        {/* 1. Weather Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="bg-orange-50 dark:bg-white/10 p-3 rounded-xl text-center border border-orange-100 dark:border-white/10 backdrop-blur-sm">
                                <span className="text-xs text-gray-500 dark:text-green-100 block">{t('temperature')}</span>
                                <p className="font-bold text-lg text-orange-600 dark:text-orange-300">
                                    {weatherData.temperature}°C
                                </p>
                                <span className="text-[10px] text-gray-400 dark:text-green-200 block">
                                    {t('feelsLike')}
                                </span>
                            </div>
                            <div className="bg-blue-50 dark:bg-white/10 p-3 rounded-xl text-center border border-blue-100 dark:border-white/10 backdrop-blur-sm">
                                <span className="text-xs text-gray-500 dark:text-green-100 block">{t('humidity')}</span>
                                <p className="font-bold text-lg text-blue-600 dark:text-blue-300">
                                    {liveSensorData?.HUM ? liveSensorData.HUM : weatherData.humidity}%
                                </p>
                                <span className="text-[10px] text-gray-400 dark:text-green-200 block">
                                    {liveSensorData?.HUM ? "Live Sensor" : "Forecast"}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/10 p-3 rounded-xl text-center border border-gray-200 dark:border-white/10 backdrop-blur-sm">
                                <span className="text-xs text-gray-500 dark:text-green-100 block">{t('rainfall')}</span>
                                <p className="font-bold text-lg text-gray-600 dark:text-gray-300">{weatherData.rainfall}mm</p>
                                <span className="text-[10px] text-gray-400 dark:text-green-200 block">{weatherData.rainfallSource || "NASA"}</span>
                            </div>
                            <div className="bg-green-50 dark:bg-white/10 p-3 rounded-xl text-center border border-green-100 dark:border-white/10 backdrop-blur-sm">
                                <span className="text-xs text-gray-500 dark:text-green-100 block">{t('soilMoisture')}</span>
                                <p className="font-bold text-lg text-green-600 dark:text-green-300">
                                    {liveSensorData?.SOIL ? liveSensorData.SOIL : weatherData.soilMoisture}
                                </p>
                                <span className="text-[10px] text-gray-400 dark:text-green-200 block">
                                    {liveSensorData?.SOIL ? "Live (Sensor)" : "Satellite"}
                                </span>
                            </div>
                        </div>

                        {/* 2. Soil Health & Stats */}
                        <div className="mb-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left: Key Metrics (pH, NPK) */}
                                <div className="space-y-3">
                                    {/* Water Level (New) */}
                                    <div className="flex justify-between items-center bg-white dark:bg-white/10 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Droplets size={18} className="text-blue-500" />
                                            <span className="text-sm text-gray-600 dark:text-green-100 font-medium">{t('waterLevel') || "Water Level"}</span>
                                        </div>
                                        <span className="font-bold text-blue-600 dark:text-blue-300">
                                            {liveSensorData?.WATER ? `${liveSensorData.WATER}%` : "--"}
                                        </span>
                                    </div>

                                    {/* pH Value */}
                                    <div className="flex justify-between items-center bg-white dark:bg-white/10 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                                        <span className="text-sm text-gray-600 dark:text-green-100 font-medium">{t('phLevel')}</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-300">
                                            {liveSensorData?.PH ? liveSensorData.PH : (soilProfile?.soilPH ? (
                                                { 'waterFast': 5.5, 'waterMedium': 6.5, 'waterSlow': 8.0 }[soilProfile.soilPH] || 6.5
                                            ) : 6.5)}
                                        </span>
                                    </div>

                                    {/* NPK Values (Numeric) */}
                                    <div className="bg-white dark:bg-white/10 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600 dark:text-green-100 font-medium">{t('npk')} (kg/ha)</span>
                                            <span className="text-xs text-green-700 bg-green-50 dark:bg-white dark:text-green-800 px-2 py-0.5 rounded-full font-bold">
                                                {liveSensorData ? "Live Data" : t('optimal')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-blue-50 dark:bg-white/20 rounded p-1">
                                                <span className="block text-[10px] text-gray-500 dark:text-green-100">N</span>
                                                <span className="font-bold text-blue-700 dark:text-blue-300">
                                                    {liveSensorData?.N ? liveSensorData.N : 140}
                                                </span>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-white/20 rounded p-1">
                                                <span className="block text-[10px] text-gray-500 dark:text-green-100">P</span>
                                                <span className="font-bold text-purple-700 dark:text-purple-300">
                                                    {liveSensorData?.P ? liveSensorData.P : 45}
                                                </span>
                                            </div>
                                            <div className="bg-orange-50 dark:bg-white/20 rounded p-1">
                                                <span className="block text-[10px] text-gray-500 dark:text-green-100">K</span>
                                                <span className="font-bold text-orange-700 dark:text-orange-300">
                                                    {liveSensorData?.K ? liveSensorData.K : 60}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Soil Characteristics (from Profile) */}
                                <div className="bg-gray-50 dark:bg-white/10 rounded-xl p-3 border border-gray-100 dark:border-white/10 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-green-200">{t('soilColorQuestion')}</span>
                                        <span className="font-bold text-gray-800 dark:text-white capitalize">{soilProfile?.soilType ? t(soilProfile.soilType) : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-green-200">{t('rainWaterQuestion')}</span>
                                        <span className="font-bold text-gray-800 dark:text-white capitalize">{soilProfile?.drainageCondition ? t(soilProfile.drainageCondition) : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-green-200">{t('irrigationQuestion')}</span>
                                        <span className="font-bold text-gray-800 dark:text-white capitalize">{soilProfile?.irrigationAvailable ? t(soilProfile.irrigationAvailable) : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-green-200">{t('soilDepthQuestion')}</span>
                                        <span className="font-bold text-gray-800 dark:text-white capitalize">{soilProfile?.soilDepth ? t(soilProfile.soilDepth) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <Chatbot />
            </div>
        </div>
    );
};
export default Dashboard;
