import React, { createContext, useContext, useState, useEffect } from 'react';

const CropContext = createContext();

export const useCrop = () => useContext(CropContext);

export const CropProvider = ({ children }) => {
    const [activeCrop, setActiveCrop] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getUserId = () => {
        const storedProfile = sessionStorage.getItem('userProfile');
        if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            return profile.mobile;
        }
        return null;
    };

    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            fetchActiveCrop(userId);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchActiveCrop = async (userId) => {
        try {
            const res = await fetch(`/api/farming/active-crop/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveCrop(data);
            } else {
                setActiveCrop(null);
            }
        } catch (error) {
            console.error("Error fetching active crop:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const plantCrop = async (cropData) => {
        const userId = getUserId();
        if (!userId) {
            alert("UserId not found. Please log in again.");
            return false;
        }

        try {
            const payload = {
                userId,
                cropData: {
                    ...cropData,
                    startDate: new Date().toISOString()
                }
            };

            console.log("Planting Crop Payload:", payload);

            const res = await fetch(`/api/farming/active-crop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            console.log("Planting Response:", data);

            if (res.ok) {
                setActiveCrop(payload.cropData);
                return true;
            } else {
                alert(`Error planting crop: ${data.message || data.detail || "Unknown error"}`);
                return false;
            }
        } catch (error) {
            console.error("Error planting crop:", error);
            alert(`Network error: ${error.message}`);
            return false;
        }
    };

    const harvestCrop = async () => {
        const userId = getUserId();
        if (!userId) return false;

        try {
            const res = await fetch(`/api/farming/active-crop/${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setActiveCrop(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error harvesting crop:", error);
            return false;
        }
    };

    return (
        <CropContext.Provider value={{ activeCrop, isLoading, plantCrop, harvestCrop }}>
            {children}
        </CropContext.Provider>
    );
};
