import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCrop } from '../context/CropContext'; // Added
import {
    Sprout, Calendar as CalendarIcon, Leaf, Bug, ArrowLeft, Clock,
    CloudRain, Thermometer, Droplets, AlertTriangle, X
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import {
    cropPhases, activities, enhancedFertilizers, cropDiseases
} from '../utils/cropCalendarData';

const CropCalendar = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { activeCrop, isLoading, harvestCrop } = useCrop();

    // State
    const [calendar, setCalendar] = useState([]);
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
    const [realTimeData, setRealTimeData] = useState(null);
    const [isLoadingRealTime, setIsLoadingRealTime] = useState(false);

    // Modals
    const [showFertilizerModal, setShowFertilizerModal] = useState(false);
    const [showDiseaseModal, setShowDiseaseModal] = useState(false);

    // Derived State
    const selectedCrop = activeCrop ? {
        id: activeCrop.cropId,
        name: activeCrop.cropName,
        startDate: activeCrop.startDate, // Pass start date
        variety: {
            name: activeCrop.varietyName || 'Unknown',
            duration: 120, // Default or fetch
            yield: 'N/A',
            suitability: 90
        },
        image: activeCrop.image || "https://images.unsplash.com/photo-1536617621572-1d5fce36262a?q=80&w=2070&auto=format&fit=crop"
    } : null;

    // Initial Load
    useEffect(() => {
        if (selectedCrop) {
            generateCalendar(selectedCrop);
            fetchRealTimeData();
        }

        // Polling effect
        const interval = setInterval(fetchRealTimeData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [selectedCrop]);

    const fetchRealTimeData = async () => {
        setIsLoadingRealTime(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock Data
        setRealTimeData({
            plowingConditions: {
                temperature: 28,
                humidity: 65,
                soilMoisture: "Optimal",
                weatherCondition: "Clear",
                recommendation: "Excellent conditions for plowing. Soil moisture is optimal.",
                optimalTime: "6:00 AM - 10:00 AM",
                lastUpdated: new Date().toLocaleTimeString(),
            },
            marketPrices: {
                tractorRental: 800,
                fuelPrice: 95,
                laborCost: 300,
            },
            dailyRecommendations: {
                water: {
                    currentLevel: 75,
                    optimalRange: { min: 70, max: 85 },
                    recommendation: "Water level is optimal.",
                    nextWatering: "2 days",
                },
                lastUpdated: new Date().toLocaleTimeString(),
            }
        });
        setIsLoadingRealTime(false);
    };

    const generateCalendar = (cropData) => {
        const cropId = cropData.id || 'rice';
        const duration = cropData.variety?.duration || 120;

        const phases = cropPhases[cropId] || cropPhases.default;
        const cropActivities = activities[cropId] || [];

        // Use the actual start date if available, otherwise default to today
        const startDate = cropData.startDate ? new Date(cropData.startDate) : new Date();
        const generatedCalendar = [];

        for (let day = 1; day <= duration + 5; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day - 1);

            const currentPhase = phases.find(p => day >= p.startDay && day <= p.endDay);
            const dayActivities = [];

            // Simple logic to map activities to phases/days
            if (currentPhase) {
                if (currentPhase.name.includes("Preparation") && day <= 5) {
                    const act = cropActivities.find(a => a.type === 'plowing');
                    if (act) dayActivities.push(act);
                }
                if (currentPhase.name.includes("Sowing") && day === 16) {
                    const act = cropActivities.find(a => a.type === 'sowing');
                    if (act) dayActivities.push(act);
                }
                if (currentPhase.name.includes("Growth") && day % 10 === 0) {
                    const act = cropActivities.find(a => a.type === 'watering');
                    if (act) dayActivities.push(act);
                }
            }

            generatedCalendar.push({
                date: currentDate,
                dayNum: day,
                phase: currentPhase || { name: 'End', color: 'bg-gray-300' },
                activities: dayActivities
            });
        }
        setCalendar(generatedCalendar);
    };

    if (isLoading) return <div className="p-10 text-center">{t('loading')}</div>;

    if (!selectedCrop) {
        return (
            <div className="min-h-screen bg-mitron-light dark:bg-gray-900 p-6 flex flex-col items-center justify-center text-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md">
                    <Sprout size={64} className="text-mitron-green mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">{t('noActiveCrop')}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t('startCropCycleMessage')}</p>
                    <button
                        onClick={() => navigate('/recommended-crops')}
                        className="bg-mitron-green text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition"
                    >
                        {t('viewRecommendedCrops')}
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="block mt-4 text-gray-500 hover:underline">
                        {t('backToDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    // Group Calendar by Month
    const monthlyCalendar = calendar.reduce((acc, day) => {
        // Fix: getMonth is 0-indexed, so we need +1 for string format YYYY-MM
        const monthKey = `${day.date.getFullYear()}-${day.date.getMonth() + 1}`;
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(day);
        return acc;
    }, {});

    const monthKeys = Object.keys(monthlyCalendar);
    const currentMonthKey = monthKeys[currentMonthIndex] || monthKeys[0];
    const currentMonthDays = monthlyCalendar[currentMonthKey] || [];

    const monthLabel = currentMonthDays.length > 0
        ? currentMonthDays[0].date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 p-4 font-sans transition-colors">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Sprout className="h-8 w-8 text-mitron-green" />
                    <h1 className="text-2xl font-bold text-mitron-dark dark:text-white">{t('appName')}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={async () => {
                            if (window.confirm(t('harvestConfirm'))) {
                                await harvestCrop();
                                navigate('/recommended-crops');
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-600 transition shadow-sm"
                    >
                        {t('harvest')}
                    </button>
                    <ThemeToggle />
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center px-4 py-2 border rounded-full bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back')}
                    </button>
                </div>
            </div>

            {/* Main Crop Card */}
            <div className="bg-gradient-to-br from-white to-green-50 dark:from-green-950 dark:to-green-900 rounded-2xl shadow-md p-4 md:p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6 border border-green-100 dark:border-green-900 transition-colors">
                <img
                    src={selectedCrop.image}
                    alt={selectedCrop.name}
                    className="w-full md:w-24 h-48 md:h-24 rounded-xl object-cover shadow-sm"
                />
                <div className="flex-1 w-full text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-green-50 mb-1">
                        {t(selectedCrop.id) || selectedCrop.name} - {t(selectedCrop.variety?.name) || selectedCrop.variety?.name}
                    </h2>
                    <p className="text-gray-500 mb-3 text-sm md:text-base">
                        {t('completeGuide').replace('{duration}', selectedCrop.variety?.duration)}
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs md:text-sm font-medium">
                            <Clock size={14} className="mr-1" /> {selectedCrop.variety?.duration} {t('days')}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm font-medium">
                            <Leaf size={14} className="mr-1" /> {t('yield')}: {selectedCrop.variety?.yield}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs md:text-sm font-medium">
                            {t('suitability')}: {selectedCrop.variety?.suitability}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Real-time Conditions Card */}
            <div className="bg-gradient-to-br from-white to-green-50 dark:from-green-950 dark:to-green-900 rounded-2xl shadow-md p-4 md:p-6 mb-6 border border-green-100 dark:border-green-900 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CloudRain className="text-blue-500" /> {t('realTimeConditions')}
                    </h3>
                    <button onClick={fetchRealTimeData} className="text-sm text-blue-600 font-bold hover:underline" disabled={isLoadingRealTime}>
                        {isLoadingRealTime ? t('updating') : t('refresh')}
                    </button>
                </div>

                {realTimeData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                            <Thermometer className="text-blue-600 h-6 w-6 md:h-8 md:w-8" />
                            <div>
                                <p className="font-bold text-lg">{realTimeData.plowingConditions.temperature}°C</p>
                                <p className="text-xs text-gray-500">{t('temperature')}</p>
                            </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-xl flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                            <Droplets className="text-green-600 h-6 w-6 md:h-8 md:w-8" />
                            <div>
                                <p className="font-bold text-lg">{realTimeData.plowingConditions.humidity}%</p>
                                <p className="text-xs text-gray-500">{t('humidity')}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-xl flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                            <Leaf className="text-amber-600 h-6 w-6 md:h-8 md:w-8" />
                            <div>
                                <p className="font-bold text-lg">{t(realTimeData.plowingConditions.soilMoisture) || realTimeData.plowingConditions.soilMoisture}</p>
                                <p className="text-xs text-gray-500">{t('moisture')}</p>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                            <Clock className="text-purple-600 h-6 w-6 md:h-8 md:w-8" />
                            <div>
                                <p className="font-bold text-sm">{realTimeData.plowingConditions.optimalTime}</p>
                                <p className="text-xs text-gray-500">{t('bestTime')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {realTimeData && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-3">
                        <AlertTriangle className="text-green-600 mt-1 shrink-0" size={20} />
                        <div>
                            <p className="font-bold text-green-800">{t('recommendation')}</p>
                            <p className="text-sm text-green-700">{realTimeData.plowingConditions.recommendation}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-left hover:shadow-md transition flex items-center gap-3"
                    onClick={() => setShowFertilizerModal(true)}
                >
                    <Leaf className="h-10 w-10 text-green-600 bg-green-50 p-2 rounded-full" />
                    <div>
                        <h4 className="font-bold text-gray-800">{t('fertilizersGuide')}</h4>
                        <p className="text-xs text-gray-500">{t('fertilizersDesc')}</p>
                    </div>
                </button>
                <button
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm text-left hover:shadow-md transition flex items-center gap-3"
                    onClick={() => setShowDiseaseModal(true)}
                >
                    <Bug className="h-10 w-10 text-red-600 bg-red-50 p-2 rounded-full" />
                    <div>
                        <h4 className="font-bold text-gray-800">{t('diseaseManagement')}</h4>
                        <p className="text-xs text-gray-500">{t('diseaseDesc')}</p>
                    </div>
                </button>
            </div>

            {/* Calendar Section */}
            <div className="bg-gradient-to-br from-white to-green-50 dark:from-green-950 dark:to-green-900 rounded-2xl shadow-md p-4 md:p-6 border border-green-100 dark:border-green-900 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <CalendarIcon /> {t('cropCalendar')}
                        </h3>
                        <p className="text-sm text-gray-500">{t('plannedActivities')}</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {monthKeys.map((key, idx) => {
                            const date = new Date(key + '-01'); // approx
                            const label = date.toLocaleDateString('en-US', { month: 'short' });
                            return (
                                <button
                                    key={key}
                                    onClick={() => setCurrentMonthIndex(idx)}
                                    className={`px-3 py-1 text-sm rounded-lg border flex-shrink-0 ${currentMonthIndex === idx ? 'bg-mitron-green text-white border-mitron-green' : 'bg-white text-gray-600'}`}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Calendar Grid Container - Scrollable on mobile */}
                <div className="overflow-x-auto">
                    <div className="min-w-[600px] md:min-w-0">
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{t(d)}</div>)}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {currentMonthDays.map((dayObj) => (
                                <div
                                    key={dayObj.dayNum}
                                    className={`min-h-20 p-2 rounded-lg border border-opacity-40 text-left relative ${dayObj.phase.color} bg-opacity-10 border-gray-200 hover:shadow-sm transition`}
                                >
                                    <span className="text-xs font-bold text-gray-700">{dayObj.date.getDate()}</span>
                                    {dayObj.phase && (
                                        <div className="text-[10px] opacity-70 truncate" title={t(dayObj.phase.name)}>{t(dayObj.phase.name)}</div>
                                    )}
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {dayObj.activities.map((act, i) => (
                                            <span key={i} title={t(act.description)} className="text-xs">{act.icon}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showFertilizerModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
                        <button onClick={() => setShowFertilizerModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{t('fertilizersGuide')} - {t(selectedCrop.id) || selectedCrop.name}</h2>

                        <div className="space-y-4">
                            {(enhancedFertilizers[selectedCrop.id] || enhancedFertilizers['rice']).map((fert, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">{t(fert.name) || fert.name}</h3>
                                        <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded">₹{fert.cost}/ha</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                                        <p><span className="font-bold">{t('type')}:</span> {t(fert.type) || fert.type}</p>
                                        <p><span className="font-bold">{t('npk')}:</span> {fert.npk}</p>
                                        <p><span className="font-bold">{t('amount')}:</span> {t(fert.amount) || fert.amount}</p>
                                        <p><span className="font-bold">{t('timing')}:</span> {t(fert.timing) || fert.timing}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500 italic">{t(fert.application) || fert.application}</p>
                                    {fert.method && <p className="text-xs text-gray-400 mt-1">{t(fert.method) || fert.method}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showDiseaseModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
                        <button onClick={() => setShowDiseaseModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{t('diseaseManagement')}</h2>
                        <div className="space-y-4">
                            {(cropDiseases[selectedCrop.id] || cropDiseases['rice']).map((d, idx) => (
                                <div key={idx} className="border border-red-100 bg-red-50/30 rounded-xl p-4">
                                    <h3 className="font-bold text-lg text-red-800 mb-1">{t(d.name) || d.name}</h3>
                                    <p className="text-sm text-red-600 mb-3">{t(d.symptoms) || d.symptoms}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">{t('chemical')}</p>
                                            <p className="text-sm">{t(d.chemical) || d.chemical}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs font-bold text-green-600 uppercase mb-1">{t('organic')}</p>
                                            <p className="text-sm">{t(d.organic) || d.organic}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CropCalendar;
