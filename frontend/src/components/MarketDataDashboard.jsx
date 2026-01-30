import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Minus, RefreshCw, Wheat,
    BarChart3, Globe, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const MarketDataDashboard = ({ className }) => {
    const { t } = useLanguage();
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState("");

    const fetchMarketData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Get user location from localStorage to fetch relevant data
            const storedProfile = sessionStorage.getItem('userProfile');
            let district = "Madurai";
            let state = "Tamil Nadu";

            if (storedProfile) {
                const profile = JSON.parse(storedProfile);
                district = profile.district || "Madurai";
                state = profile.state || "Tamil Nadu";
            }

            const response = await fetch(`/api/market/prices?state=${state}&district=${district}`);
            if (!response.ok) {
                throw new Error("Failed to fetch market data");
            }
            const data = await response.json();

            // Calculate change percentages (Backend returns basic list, we enhance it here)
            data.forEach((item) => {
                if (!item.changePercent) {
                    item.changePercent = (item.change / (item.price - item.change)) * 100;
                }
            });

            setMarketData(data);
            setLastUpdated(new Date().toLocaleString());
        } catch (err) {
            console.error(err);
            setError("Unable to connect to live market. Retrying...");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getTrendIcon = (change) => {
        if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-500" />;
    };

    const getTrendColor = (change) => {
        if (change > 0) return "text-green-600 dark:text-green-400";
        if (change < 0) return "text-red-600 dark:text-red-400";
        return "text-gray-600 dark:text-gray-400";
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (error) {
        return (
            <div className={`border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-xl p-6 ${className}`}>
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-4">
                    <AlertCircle className="h-5 w-5" />
                    <span>{t('errorLoadingMarket')}: {error}</span>
                </div>
                <button onClick={fetchMarketData} className="px-4 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition">
                    <RefreshCw className="h-4 w-4" />
                    {t('retry')}
                </button>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-2xl shadow-sm border border-green-100 dark:border-green-900 p-5 transition-colors duration-300 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="flex items-center space-x-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                        <Wheat className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span>{t('marketDataTitle')}</span>
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs px-2 py-0.5 rounded-full font-bold ml-2">{t('live')}</span>
                    </h2>
                    <p className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Globe className="h-3 w-3" />
                        <span>{t('marketDataSubtitle')}</span>
                    </p>
                </div>
                <button
                    onClick={fetchMarketData}
                    disabled={loading}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow transition disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 text-green-600 dark:text-green-400 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/60 dark:border-gray-700"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {marketData.map((item) => (
                        <div
                            key={item.commodity}
                            className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-white dark:border-gray-700 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="font-bold text-gray-800 dark:text-gray-100 capitalize">{t(item.commodity) || item.commodity}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{item.name}</div>
                                </div>
                                {getTrendIcon(item.change)}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('price')}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        ₹{formatPrice(item.price)}/{item.unit.split("/")[1]}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('change')}</span>
                                    <span className={`text-xs font-bold ${getTrendColor(item.change)}`}>
                                        {item.change > 0 ? "+" : ""}₹{formatPrice(Math.abs(item.change))}
                                        <span className="ml-1 opacity-80">
                                            ({item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(2)}%)
                                        </span>
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{t('market')}</span>
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{item.market}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && (
                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-4 border-t border-green-200/50 dark:border-green-900/50 pt-3">
                    <span>{t('lastUpdated')}: {lastUpdated}</span>
                    <span className="flex items-center space-x-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>{t('dataSource')}</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default MarketDataDashboard;
