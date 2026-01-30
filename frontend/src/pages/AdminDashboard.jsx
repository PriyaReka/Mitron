import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Upload, FileText, User, LogOut, FileSpreadsheet, CheckCircle, Clock } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('adminAuth');
        if (!isAdmin) {
            navigate('/login');
        }
    }, [navigate]);

    // Mock Admin Profile
    const adminProfile = {
        name: "Official. Priya Reka S",
        designation: "District Irrigation Officer",
        id: "GOV-TN-2024-551",
        district: "Tiruchirappalli",
        lastLogin: "27 Dec 2024, 09:30 AM"
    };

    // Upload History State
    const [uploadHistory, setUploadHistory] = useState([]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Mock Upload Entry immediately for UX
        const newUpload = {
            id: Date.now(),
            fileName: file.name,
            status: "Processing",
            date: new Date().toLocaleDateString(),
            size: (file.size / 1024 / 1024).toFixed(2) + " MB"
        };
        setUploadHistory(prev => [newUpload, ...prev]);

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/admin/upload-irrigation', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (response.ok && result.success) {
                // Update Status to Processed
                setUploadHistory(prev => prev.map(item =>
                    item.id === newUpload.id ? { ...item, status: 'Processed' } : item
                ));
                alert(`Upload Successful! ${result.message}`);
            } else {
                // Update Status to Failed
                setUploadHistory(prev => prev.map(item =>
                    item.id === newUpload.id ? { ...item, status: 'Failed' } : item
                ));
                alert(`Upload Failed: ${result.detail || "Unknown error"}`);
            }

        } catch (error) {
            console.error("Upload error:", error);
            setUploadHistory(prev => prev.map(item =>
                item.id === newUpload.id ? { ...item, status: 'Failed' } : item
            ));
            alert("Connection Error during upload.");
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminAuth');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-sans pb-20 md:pb-8">
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-800 text-white p-4 sticky top-0 z-50 shadow-md safe-top">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <User size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">Admin Portal</h1>
                            <p className="text-[10px] text-blue-100 opacity-90 uppercase tracking-wider">Irrigation Dept.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 space-y-4">

                {/* Profile Section - Mobile Optimized (Compact Row) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="h-16 w-16 md:h-20 md:w-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex shrink-0 items-center justify-center text-blue-600 dark:text-blue-400">
                        <User size={28} className="md:w-10 md:h-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">{adminProfile.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-300 font-medium truncate">{adminProfile.designation}</p>
                        <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar">
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded whitespace-nowrap">
                                {adminProfile.district}
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded whitespace-nowrap">
                                ID: {adminProfile.id.split('-').pop()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Left: Upload Section */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <FileSpreadsheet className="text-green-600" size={20} />
                                Upload Data
                            </h3>

                            <label className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group active:scale-[0.99] transform duration-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                    <Upload className="w-8 h-8 mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                                    <p className="mb-1 text-sm text-gray-700 dark:text-gray-300 font-medium">Tap to Upload</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Excel / CSV</p>
                                </div>
                                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Right: History Section */}
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                <Clock className="text-orange-500" size={20} />
                                Recent Uploads
                            </h3>

                            <div className="space-y-3">
                                {uploadHistory.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-2 rounded-lg shrink-0 ${file.status === 'Processed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'}`}>
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{file.fileName}</p>
                                                <p className="text-xs text-gray-500 truncate">{file.date} • {file.size}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            {file.status === 'Processed' ? (
                                                <CheckCircle size={18} className="text-green-500" />
                                            ) : (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
