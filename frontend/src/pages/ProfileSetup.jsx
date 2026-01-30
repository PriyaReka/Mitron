import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useVoice } from '../context/VoiceContext';
import VoiceInput from '../components/VoiceInput';
import { indianLocations } from '../utils/indianLocations';
import { ArrowRight, ArrowLeft, CheckCircle, User, MapPin, Sprout, CreditCard } from 'lucide-react';

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { speak } = useVoice();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- State Data ---
    const [formData, setFormData] = useState({
        // 1. Identity
        fullName: '',
        age: '',
        gender: 'male',
        mobileNumber: '',
        aadhaarNumber: '',
        category: 'general',
        annualIncome: '',

        // 2. Location
        state: Object.keys(indianLocations)[0],
        district: indianLocations[Object.keys(indianLocations)[0]][0],
        taluk: '',
        village: '',
        pincode: '',

        // 3. Land
        landType: 'wetland',
        measurementType: 'area', // default to area for simplicity in new flow
        dimensions: { length: '', width: '' },
        totalArea: '',
        areaUnit: 'acres',
        landOwnership: 'owned', // owned, leased
        landRecordType: 'patta', // patta, chitta etc

        // 4. Farming
        irrigationType: 'rainFed',
        primaryCrop: '',
        secondaryCrops: '',
        farmingSeason: 'kharif',
        farmingSubtypes: [], // array of strings
        organicFarming: 'no',

        // 4.1. Soil Details (New/Restored)
        soilType: 'loam',
        soilDepth: 'medium',
        drainageCondition: 'wellDrained',

        // 5. Financial
        hasBankAccount: 'yes',
        bankLinkedAadhaar: 'yes',
        kccStatus: 'no',
        loanTaken: 'no',
        loanAmount: ''
    });

    // Helper to update form data
    const updateData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStateChange = (e) => {
        const newState = e.target.value;
        setFormData(prev => ({
            ...prev,
            state: newState,
            district: indianLocations[newState]?.[0] || ''
        }));
    };

    const toggleFarmingSubtype = (type) => {
        setFormData(prev => {
            const current = prev.farmingSubtypes || [];
            if (current.includes(type)) {
                return { ...prev, farmingSubtypes: current.filter(t => t !== type) };
            } else {
                return { ...prev, farmingSubtypes: [...current, type] };
            }
        });
    };

    // Speech on mount
    useEffect(() => {
        speak(t('profileSetup') + ". " + t('setupDescription'));
    }, [t, speak]);

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.fullName.trim()) return "Full Name is required";
            if (!formData.age || isNaN(formData.age)) return "Valid Age is required";
            if (!formData.mobileNumber.trim() || formData.mobileNumber.length < 10) return "Valid Mobile Number is required";
            if (!formData.gender) return "Gender is required";
            if (!formData.category) return "Category is required";
            if (!formData.annualIncome) return "Annual Income is required";
        }
        if (step === 2) {
            if (!formData.state) return "State is required";
            if (!formData.district) return "District is required";
            // Village/Pincode optional but encouraged? User said "make sure all details are stored", usually implies mandatory for wizard flow
            if (!formData.totalArea) return "Total Land Area is required";
        }
        if (step === 3) {
            if (!formData.primaryCrop) return "Primary Crop is required";
        }
        return null;
    };

    const handleNext = () => {
        const errorMsg = validateStep(currentStep);
        if (errorMsg) {
            setError(errorMsg);
            speak(errorMsg);
            return;
        }

        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            setError(''); // Clear error on success
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setError('');
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        // Construct Payload matching new Backend Schema
        const profilePayload = {
            fullName: formData.fullName,
            mobile: formData.mobileNumber, // Ensure this matches backend expectation
            mobileNumber: formData.mobileNumber, // Redundant fallback just in case
            aadhar: formData.aadhaarNumber,
            role: "farmer",
            onboardingCompleted: true,

            demographics: {
                age: formData.age,
                gender: formData.gender,
                category: formData.category,
                incomeRange: formData.annualIncome
            },

            location: {
                state: formData.state,
                district: formData.district,
                taluk: formData.taluk,
                village: formData.village,
                pincode: formData.pincode
            },

            farming: {
                farmerType: formData.totalArea < 2.5 ? "small" : "medium", // basic logic
                landArea: `${formData.totalArea} ${formData.areaUnit}`,
                landOwnership: formData.landOwnership,
                landRecordType: formData.landRecordType,
                irrigationType: formData.irrigationType,
                primaryCrop: formData.primaryCrop,
                secondaryCrops: formData.secondaryCrops,
                farmingSeason: formData.farmingSeason,
                farmingSubtypes: formData.farmingSubtypes,
                organicFarming: formData.organicFarming
            },

            financials: {
                hasBankAccount: formData.hasBankAccount,
                bankLinkedAadhaar: formData.bankLinkedAadhaar,
                kccStatus: formData.kccStatus,
                loanTaken: formData.loanTaken,
                loanAmount: formData.loanAmount
            },

            // Backward compatibility / simplified access if needed
            soilProfile: {
                soilType: formData.soilType,
                soilDepth: formData.soilDepth,
                drainageCondition: formData.drainageCondition,
                irrigationAvailable: formData.irrigationType
            }
        };

        try {
            const response = await fetch('/api/auth/profile-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profilePayload)
            });
            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('userProfile', JSON.stringify(data.user));
                speak(t('success'));
                navigate('/dashboard');
            } else {
                setError(data.detail || "Setup failed");
                speak("Setup failed. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError("Connection error");
            speak("Connection error. Please check your internet.");
        } finally {
            setLoading(false);
        }
    };

    // Updated Input Styles for better visibility
    const inputStyle = "w-full p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-mitron-green focus:ring-4 focus:ring-mitron-green/10 outline-none transition-all placeholder-gray-400 font-medium";

    // Components
    const ProgressBar = () => (
        <div className="flex items-center justify-between mb-8 px-2">
            {[1, 2, 3, 4].map(step => (
                <div key={step} className={`flex flex-col items-center z-10 ${step <= currentStep ? 'text-mitron-green' : 'text-gray-300'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step <= currentStep ? 'bg-mitron-green text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                        {step < currentStep ? <CheckCircle size={20} /> : step}
                    </div>
                </div>
            ))}
            {/* Connecting Line */}
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 -z-0 mx-6 md:mx-10">
                <div
                    className="h-full bg-mitron-green transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans pb-24 md:pb-12">
            {/* Header */}
            <div className="bg-mitron-green text-white p-6 rounded-b-3xl shadow-lg mb-6 relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <h2 className="text-2xl font-extrabold tracking-tight">{t('farmerRegistration')}</h2>
                    <p className="opacity-90 text-sm mt-1">{t('step')} {currentStep} {t('of')} 4</p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-10 -translate-y-10"></div>
            </div>

            <div className="max-w-xl mx-auto px-4 relative">
                <ProgressBar />

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 min-h-[400px]">

                    {/* STEP 1: IDENTITY */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-slide-in-right">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                                <User className="text-mitron-green" /> {t('personalDetails')}
                            </h3>

                            <div>
                                <label className="label">{t('fullName')} *</label>
                                <VoiceInput value={formData.fullName} onChange={v => updateData('fullName', v)} placeholder={t('enterFullName')} className={inputStyle} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('age')} *</label>
                                    <input type="number" className={inputStyle} value={formData.age} onChange={e => updateData('age', e.target.value)} placeholder="Years" />
                                </div>
                                <div>
                                    <label className="label">{t('gender')} *</label>
                                    <div className="relative">
                                        <select className={`${inputStyle} appearance-none`} value={formData.gender} onChange={e => updateData('gender', e.target.value)}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">{t('mobileNumber')} *</label>
                                <input
                                    type="tel"
                                    className={inputStyle}
                                    value={formData.mobileNumber}
                                    onChange={e => updateData('mobileNumber', e.target.value)}
                                    placeholder="10 digit number"
                                />
                            </div>
                            <div>
                                <label className="label">{t('aadhaarNumber')}</label>
                                <VoiceInput value={formData.aadhaarNumber} onChange={v => updateData('aadhaarNumber', v)} placeholder="XXXX XXXX XXXX" className={inputStyle} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('category')} *</label>
                                    <div className="relative">
                                        <select className={`${inputStyle} appearance-none`} value={formData.category} onChange={e => updateData('category', e.target.value)}>
                                            <option value="general">General</option>
                                            <option value="obc">OBC</option>
                                            <option value="sc">SC</option>
                                            <option value="st">ST</option>
                                            <option value="minority">Minority</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">{t('annualIncome')} *</label>
                                    <div className="relative">
                                        <select className={`${inputStyle} appearance-none`} value={formData.annualIncome} onChange={e => updateData('annualIncome', e.target.value)}>
                                            <option value="">Select Income</option>
                                            <option value="<1L">Below ₹1 Lakh</option>
                                            <option value="1L-2.5L">₹1L - ₹2.5L</option>
                                            <option value=">2.5L">Above ₹2.5L</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: LOCATION & LAND */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-slide-in-right">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                                <MapPin className="text-orange-500" /> {t('locationDetails')}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('state')} *</label>
                                    <div className="relative">
                                        <select value={formData.state} onChange={handleStateChange} className={`${inputStyle} appearance-none`}>
                                            {Object.keys(indianLocations).map(s => <option key={s} value={s}>{t(s)}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">{t('district')} *</label>
                                    <div className="relative">
                                        <select value={formData.district} onChange={e => updateData('district', e.target.value)} className={`${inputStyle} appearance-none`}>
                                            {indianLocations[formData.state]?.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('village')}</label>
                                    <input type="text" className={inputStyle} value={formData.village} onChange={e => updateData('village', e.target.value)} placeholder="Village Name" />
                                </div>
                                <div>
                                    <label className="label">{t('pincode')}</label>
                                    <input type="number" className={inputStyle} value={formData.pincode} onChange={e => updateData('pincode', e.target.value)} placeholder="6 digits" />
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-gray-700" />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('totalLandArea')}</label>
                                    <div className="flex gap-2">
                                        <input type="number" className={`${inputStyle} w-2/3`} value={formData.totalArea} onChange={e => updateData('totalArea', e.target.value)} placeholder="Area" />
                                        <select className={`${inputStyle} w-1/3 px-1`} value={formData.areaUnit} onChange={e => updateData('areaUnit', e.target.value)}>
                                            <option value="acres">{t('acres')}</option>
                                            <option value="hectares">{t('hectares')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">{t('ownership')}</label>
                                    <div className="relative">
                                        <select className={`${inputStyle} appearance-none`} value={formData.landOwnership} onChange={e => updateData('landOwnership', e.target.value)}>
                                            <option value="owned">Owned</option>
                                            <option value="leased">Leased</option>
                                            <option value="sharecropped">Sharecropped</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">Land Record Type (Optional)</label>
                                <div className="relative">
                                    <select className={`${inputStyle} appearance-none`} value={formData.landRecordType} onChange={e => updateData('landRecordType', e.target.value)}>
                                        <option value="patta">Patta / Chitta</option>
                                        <option value="7/12">7/12 Extract</option>
                                        <option value="ror">RoR (Rights of Record)</option>
                                        <option value="none">None Available</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: FARMING INFO */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-slide-in-right">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                                <Sprout className="text-green-500" /> {t('farmingDetails')}
                            </h3>

                            <div>
                                <label className="label">{t('primaryCrop')} *</label>
                                <VoiceInput value={formData.primaryCrop} onChange={v => updateData('primaryCrop', v)} placeholder="e.g. Paddy, Wheat" className={inputStyle} />
                            </div>

                            <div>
                                <label className="label">{t('irrigationSource')}</label>
                                <div className="relative">
                                    <select className={`${inputStyle} appearance-none`} value={formData.irrigationType} onChange={e => updateData('irrigationType', e.target.value)}>
                                        <option value="rainFed">{t('rainFed')}</option>
                                        <option value="borewell">{t('borewell')}</option>
                                        <option value="canal">{t('canal')}</option>
                                        <option value="drip">{t('drip')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-gray-700" />

                            <h4 className="font-bold text-gray-700 dark:text-gray-300">{t('soilInformation')}</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('soilType')}</label>
                                    <div className="relative">
                                        <select className={`${inputStyle} appearance-none`} value={formData.soilType} onChange={e => updateData('soilType', e.target.value)}>
                                            <option value="clay">{t('clay')}</option>
                                            <option value="sandy">{t('sandy')}</option>
                                            <option value="loam">{t('loam')}</option>
                                            <option value="black">{t('black')}</option>
                                            <option value="red">{t('red')}</option>
                                            <option value="alluvial">{t('alluvial')}</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">{t('soilDepth')}</label>
                                    <div className="relative">
                                        <select className={`${inputStyle} appearance-none`} value={formData.soilDepth} onChange={e => updateData('soilDepth', e.target.value)}>
                                            <option value="shallow">Shallow (&lt;50cm)</option>
                                            <option value="medium">Medium</option>
                                            <option value="deep">Deep (&gt;100cm)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">{t('drainage')}</label>
                                <div className="relative">
                                    <select className={`${inputStyle} appearance-none`} value={formData.drainageCondition} onChange={e => updateData('drainageCondition', e.target.value)}>
                                        <option value="wellDrained">{t('wellDrained')}</option>
                                        <option value="waterFast">{t('waterFast')}</option>
                                        <option value="waterSlow">{t('waterSlow')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="label">Farming Activities (Select all that apply)</label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    {['Crop Farming', 'Horticulture', 'Dairy Farming', 'Poultry', 'Fisheries', 'Organic'].map(type => (
                                        <div
                                            key={type}
                                            onClick={() => toggleFarmingSubtype(type)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.farmingSubtypes.includes(type) ? 'bg-green-50 border-mitron-green text-mitron-green font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                        >
                                            <span className="text-sm">{type}</span>
                                            {formData.farmingSubtypes.includes(type) && <CheckCircle size={16} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: FINANCIALS */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-slide-in-right">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                                <CreditCard className="text-purple-500" /> {t('bankingFinance')}
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { label: t('hasBankAccount'), field: "hasBankAccount" },
                                    { label: t('bankLinkedAadhaar'), field: "bankLinkedAadhaar" },
                                    { label: t('kccStatus'), field: "kccStatus", options: ["yes", "no", "applied"] },
                                    { label: t('loanTaken'), field: "loanTaken" },
                                ].map((item) => (
                                    <div key={item.field} className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">{item.label}</span>
                                        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-100 dark:border-gray-600">
                                            {(item.options || ['yes', 'no']).map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => updateData(item.field, opt)}
                                                    className={`px-6 py-2 rounded-md text-xs font-bold capitalize transition-all ${formData[item.field] === opt ? 'bg-mitron-green text-white shadow-md' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {formData.loanTaken === 'yes' && (
                                    <div className="animate-fade-in">
                                        <label className="label">{t('loanAmount')}</label>
                                        <input type="text" className={inputStyle} value={formData.loanAmount} onChange={e => updateData('loanAmount', e.target.value)} placeholder="₹ 50,000" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {currentStep > 1 && (
                            <button onClick={handleBack} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                <ArrowLeft size={20} /> {t('back')}
                            </button>
                        )}

                        {currentStep < 4 ? (
                            <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-mitron-green text-white font-bold hover:bg-mitron-dark transition shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                                {t('next')} <ArrowRight size={20} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl bg-mitron-green text-white font-bold hover:bg-mitron-dark transition shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                                {loading ? t('loading') : t('finishSetup')} <CheckCircle size={20} />
                            </button>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-center text-sm mt-4 bg-red-50 p-2 rounded-lg">{error}</p>}

                </div>
            </div>

            <style>{`
                .label { @apply block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5; }
                .input-field { @apply w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-mitron-green/50 outline-none transition-all; }
            `}</style>
        </div>
    );
};

export default ProfileSetup;
