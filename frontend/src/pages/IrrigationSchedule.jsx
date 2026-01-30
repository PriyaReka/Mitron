import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Droplets, AlertCircle, CheckCircle, History, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const IrrigationSchedule = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [schedule, setSchedule] = useState({ current: null, upcoming: [], history: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const userProfile = JSON.parse(sessionStorage.getItem('userProfile') || '{}');
                const mobile = userProfile.mobile;

                if (!mobile) {
                    setError("User profile not found. Please login.");
                    setLoading(false);
                    return;
                }

                const response = await fetch(`/api/irrigation/my-schedule?mobile=${mobile}`);
                if (!response.ok) throw new Error("Failed to fetch schedule");

                const data = await response.json();
                setSchedule(data);
            } catch (err) {
                console.error(err);
                setError("Could not load schedule.");
                // keeping mock fallback if needed, but let's stick to error state or empty
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center text-green-600">{t('loadingSchedule')}</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors">
            {/* Header */}
            <div className="bg-mitron-green text-white p-4 sticky top-0 z-10 shadow-md flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">{t('irrigationScheduleTitle')}</h1>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* 1. CURRENT / NEXT TURN (Highlight) */}
                {schedule.current ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Droplets size={100} className="text-blue-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs font-bold uppercase tracking-wider flex w-fit">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    {t('activeNow')}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{schedule.current.date}</span>
                            </div>

                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                                {schedule.current.startTime} - {schedule.current.endTime}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-300 mb-4">{t('activeTurnMessage')}</p>

                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                                    <User size={20} className="text-blue-600 dark:text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">{t('assignedBy')}</p>
                                    <p className="font-semibold text-gray-800 dark:text-white">{schedule.current.officer || "Official"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : schedule.upcoming.length > 0 ? (
                    // Display NEXT Upcoming if no current
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar size={100} />
                        </div>
                        <div className="relative z-10">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">{t('nextTurn')}</span>
                            <h2 className="text-3xl font-bold mb-1">
                                {schedule.upcoming[0].startTime}
                            </h2>
                            <p className="text-blue-100 text-lg mb-4">{schedule.upcoming[0].date}</p>

                            <div className="flex items-center gap-2 text-sm bg-black/20 w-fit px-3 py-2 rounded-lg">
                                <Clock size={16} />
                                <span>{t('durationUntil')} {schedule.upcoming[0].endTime}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">{t('noActiveOrUpcoming')}</p>
                    </div>
                )}


                {/* 2. UPCOMING LIST */}
                {schedule.upcoming.length > 0 && ( /* If [0] shown above, maybe filter it out? Or shown list below anyway */
                    <div className="space-y-3">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                            <Calendar size={20} className="text-blue-500" /> {t('upcomingSchedule')}
                        </h3>
                        {schedule.upcoming.map((item, idx) => (
                            /* Skip first if it was shown as featured card? Let's just show all in list for clarity */
                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 border-blue-400 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{item.date}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('assignedBy')} {item.officer}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-600 dark:text-blue-400">{item.startTime}</p>
                                    <p className="text-xs text-gray-400">{item.endTime}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. HISTORY */}
                <div className="space-y-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <History size={20} className="text-gray-500" /> {t('pastHistory')}
                    </h3>

                    {schedule.history.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">{t('noHistoryAvailable')}</p>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            {schedule.history.map((item, idx) => (
                                <div key={idx} className="p-4 border-b last:border-0 border-gray-100 dark:border-gray-700 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={18} className="text-green-500" />
                                        <div>
                                            <p className="font-medium text-gray-700 dark:text-gray-200">{item.date}</p>
                                            <p className="text-xs text-gray-500 line-through decoration-green-500/50">{item.startTime} - {item.endTime}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">{t('completed')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default IrrigationSchedule;
