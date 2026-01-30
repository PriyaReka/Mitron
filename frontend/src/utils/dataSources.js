
export const DATA_SOURCES = {
    government: {
        agristack: {
            name: "AgriStack Farmer Registry",
            url: "https://agristack.org.in/",
            description: "Government-led digital platform for farmer data and agricultural activities",
            eligibility: "All Farmers"
        },
        agmarknet: {
            name: "AGMARKNET Portal - DMI, Ministry of Agriculture",
            url: "https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi",
            description: "Daily market information and commodity prices from various markets",
            eligibility: "Traders & Farmers"
        },
        dataGovIn: {
            name: "Data.gov.in - Government of India",
            url: "https://www.data.gov.in/",
            description: "Open Government Data Platform",
            eligibility: "Public Access"
        },
    },
    weather: {
        agrivista: {
            name: "Agrivista Weather Updates",
            url: "https://www.agrivista.in/",
            description: "Daily weather updates including temperature, humidity, rainfall, and AQI",
            eligibility: "All Regions"
        },
    },
    market: {
        cedaAgri: {
            name: "CEDA Agri Market Data",
            url: "https://agmarknet.ceda.ashoka.edu.in/",
            description: "Agricultural market data with modal, min, and max prices",
            eligibility: "Researchers & Farmers"
        },
        agrivistaMarket: {
            name: "Agrivista Market Prices",
            url: "https://www.agrivista.in/",
            description: "Real-time prices across 900 mandis in India",
            eligibility: "Market Participants"
        },
    },
    schemes: {
        farmonaut: {
            name: "Farmonaut Agriculture Current Affairs",
            url: "https://farmonaut.com/news/agriculture-current-affairs-india-2025-key-changes",
            description: "Latest agricultural schemes and policy updates",
            eligibility: "General Info"
        },
        pmkisan: {
            name: "PM-KISAN Official Portal",
            url: "https://pmkisan.gov.in/",
            description: "Pradhan Mantri Kisan Samman Nidhi Scheme",
            eligibility: "Small/Marginal Farmers"
        },
        pmfby: {
            name: "PMFBY Official Portal",
            url: "https://pmfby.gov.in/",
            description: "Pradhan Mantri Fasal Bima Yojana",
            eligibility: "Insured Farmers"
        },
    },
};

export const getLastUpdated = () => {
    return new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
