import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, User, MapPin, Ruler, LogOut, ChevronLeft, Edit2, Check, X, Save } from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    const [userProfile, setUserProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const storedProfile = sessionStorage.getItem('userProfile');
        if (storedProfile) {
            const parsed = JSON.parse(storedProfile);
            setUserProfile(parsed);

            // Flatten generic 'farming' object or top-level fields for editing
            setEditData({
                ...parsed.farming, // Spread farming details
                // Also pull other editable fields if needed
                soilType: parsed.soilProfile?.soilType || parsed.farming?.soilType || '',
                soilDepth: parsed.soilProfile?.soilDepth || parsed.farming?.soilDepth || '',
                drainageCondition: parsed.soilProfile?.drainageCondition || parsed.farming?.drainageCondition || ''
            });
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('userProfile');
        navigate('/login');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Reconstruct full payload based on existing profile + edits
            // We use the same /profile-setup endpoint which performs specific updates
            const payload = {
                // Identity (Read-only, preserve original)
                mobile: userProfile.mobile || userProfile.mobileNumber,
                mobileNumber: userProfile.mobile || userProfile.mobileNumber,
                fullName: userProfile.fullName,
                aadhar: userProfile.aadhar,

                // Location (Read-only, preserve)
                location: userProfile.location || {
                    state: userProfile.state,
                    district: userProfile.district,
                    village: userProfile.village,
                    pincode: userProfile.pincode
                },

                // Farming (The Editable Part)
                farming: {
                    ...userProfile.farming, // Keep existing keys
                    ...editData, // Overwrite with edits
                    primaryCrop: editData.primaryCrop,
                    secondaryCrops: editData.secondaryCrops,
                    landArea: editData.landArea // Ensure this propagates
                },

                // Soil (Editable via mapping)
                soilProfile: {
                    soilType: editData.soilType,
                    soilDepth: editData.soilDepth,
                    drainageCondition: editData.drainageCondition,
                    irrigationAvailable: editData.irrigationType || userProfile.farming?.irrigationType
                },

                // Financials (Preserve)
                financials: userProfile.financials
            };

            const response = await fetch('/api/auth/profile-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                sessionStorage.setItem('userProfile', JSON.stringify(data.user));
                setUserProfile(data.user);
                setIsEditing(false);
                // Optional: speak("Profile updated successfully");
            } else {
                alert("Update failed: " + (data.detail || "Unknown error"));
            }
        } catch (error) {
            console.error("Save error", error);
            alert("Connection error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (!userProfile) return <div className="p-10 text-center">{t('loading')}</div>;

    const inputClass = "w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-green-500 outline-none";

    return (
        <div className={`h-screen flex flex-col font-sans transition-colors duration-300 overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>

            {/* Header */}
            <div className="bg-mitron-green text-white p-4 shrink-0 shadow-md flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
                    <h1 className="text-xl font-bold">{t('profileSettings')}</h1>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                    <LogOut size={14} /> <span>{t('logout')}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* 1. Identity & Location (View Only) */}
                <div className={`p-4 rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-mitron-green dark:text-green-300">
                            <User size={30} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{userProfile.fullName}</h2>
                            <p className="text-sm opacity-70">+91 {userProfile.mobile || userProfile.mobileNumber}</p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {userProfile.role || 'Farmer'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                            <label className="text-xs text-gray-400 block mb-1">District</label>
                            <span className="font-semibold flex items-center gap-1"><MapPin size={12} /> {userProfile.district}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                            <label className="text-xs text-gray-400 block mb-1">State</label>
                            <span className="font-semibold">{userProfile.state}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Farming Details (Editable) */}
                <div className={`p-4 rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <SproutIcon /> {t('farmingDetails')}
                        </h3>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="text-mitron-green flex items-center gap-1 text-sm font-bold bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg">
                                <Edit2 size={14} /> {t('edit')}
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold">{t('cancel')}</button>
                                <button onClick={handleSave} disabled={saving} className="bg-mitron-green text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                                    {saving ? '...' : <><Save size={14} /> {t('save')}</>}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Primary Crop */}
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('primaryCrop')}</label>
                            {isEditing ? (
                                <input
                                    className={inputClass}
                                    value={editData.primaryCrop || ''}
                                    onChange={e => setEditData({ ...editData, primaryCrop: e.target.value })}
                                />
                            ) : (
                                <p className="font-bold">{userProfile.farming?.primaryCrop || t('notSet')}</p>
                            )}
                        </div>

                        {/* Secondary Crops */}
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('secondaryCrops')}</label>
                            {isEditing ? (
                                <input
                                    className={inputClass}
                                    value={editData.secondaryCrops || ''}
                                    placeholder={t('secondaryCrops')}
                                    onChange={e => setEditData({ ...editData, secondaryCrops: e.target.value })}
                                />
                            ) : (
                                <p className="font-bold">{userProfile.farming?.secondaryCrops || t('none')}</p>
                            )}
                        </div>

                        {/* Land Area (Display Only really, usually static, but making editable as requested) */}
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('totalLandArea')}</label>
                            <div className="flex items-center gap-2">
                                <Ruler size={16} className="text-gray-400" />
                                {isEditing ? (
                                    <input
                                        className={inputClass}
                                        value={editData.landArea || ''}
                                        onChange={e => setEditData({ ...editData, landArea: e.target.value })}
                                    />
                                ) : (
                                    <p className="font-bold">{userProfile.farming?.landArea || userProfile.totalArea || '--'}</p>
                                )}
                            </div>
                        </div>

                        {/* Irrigation */}
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('irrigationType')}</label>
                            {isEditing ? (
                                <select
                                    className={inputClass}
                                    value={editData.irrigationType || ''}
                                    onChange={e => setEditData({ ...editData, irrigationType: e.target.value })}
                                >
                                    <option value="rainFed">{t('rainFed')}</option>
                                    <option value="borewell">{t('borewell')}</option>
                                    <option value="canal">{t('canal')}</option>
                                    <option value="drip">{t('drip')}</option>
                                </select>
                            ) : (
                                <p className="font-bold capitalize">{t(userProfile.farming?.irrigationType) || userProfile.farming?.irrigationType || '--'}</p>
                            )}
                        </div>

                        {/* Soil Type */}
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('soilType')}</label>
                            {isEditing ? (
                                <select
                                    className={inputClass}
                                    value={editData.soilType || ''}
                                    onChange={e => setEditData({ ...editData, soilType: e.target.value })}
                                >
                                    <option value="clay">{t('clay')}</option>
                                    <option value="sandy">{t('sandy')}</option>
                                    <option value="loam">{t('loam')}</option>
                                    <option value="black">{t('black')}</option>
                                    <option value="red">{t('red')}</option>
                                </select>
                            ) : (
                                <p className="font-bold capitalize">{t(userProfile.soilProfile?.soilType) || '--'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. App Settings */}
                <div className={`p-4 rounded-2xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <h3 className="font-bold uppercase text-xs tracking-wider opacity-50 mb-3">{t('appSettings')}</h3>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium">
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            Dark Mode
                        </span>
                        <div
                            onClick={toggleTheme}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${theme === 'dark' ? 'bg-mitron-green' : 'bg-gray-300'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

const SproutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mitron-green">
        <path d="M7 20h10" />
        <path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.4-1.6-.8-2.7-3.3-1-5.6.8-1 2.3-1.6 4.3-.8 .8-.3 1.8-.2 2.8.5 .9 1.4 1 3.3.6 5.3" />
    </svg>
);

export default Settings;
