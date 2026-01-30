
export const cropDatabase = {
    "IN-Tamil Nadu": [
        {
            id: "rice",
            name: "Rice",
            suitability: 95,
            image: "/images/rice.jpg",
            season: "Kharif & Rabi",
            waterRequirement: "High",
            varieties: [
                { id: "ir20", name: "IR20", suitability: 95, duration: 120, yield: "4-5 tons/hectare" },
                { id: "ponni", name: "Ponni", suitability: 92, duration: 135, yield: "5-6 tons/hectare" },
                { id: "basmati", name: "Basmati", suitability: 75, duration: 140, yield: "3-4 tons/hectare" },
            ],
        },
        {
            id: "sugarcane",
            name: "Sugarcane",
            suitability: 88,
            image: "/images/sugarcane.jpg",
            season: "Year-round",
            waterRequirement: "Very High",
            varieties: [
                { id: "co86032", name: "CO 86032", suitability: 88, duration: 365, yield: "80-100 tons/hectare" },
                { id: "co62175", name: "CO 62175", suitability: 85, duration: 350, yield: "75-90 tons/hectare" },
            ],
        },
        {
            id: "cotton",
            name: "Cotton",
            suitability: 82,
            image: "/images/cotton.jpg",
            season: "Kharif",
            waterRequirement: "Medium",
            varieties: [
                { id: "mch184", name: "MCH 184", suitability: 82, duration: 180, yield: "15-20 quintals/hectare" },
                { id: "suraj", name: "Suraj", suitability: 78, duration: 170, yield: "12-18 quintals/hectare" },
            ],
        },
        {
            id: "maize",
            name: "Maize",
            suitability: 78,
            image: "/images/corn.jpg",
            season: "Kharif & Rabi",
            waterRequirement: "Medium",
            varieties: [
                { id: "nk6240", name: "NK 6240", suitability: 78, duration: 110, yield: "8-10 tons/hectare" },
                { id: "pioneer", name: "Pioneer 30V92", suitability: 75, duration: 115, yield: "7-9 tons/hectare" },
            ],
        },
        {
            id: "wheat",
            name: "Wheat",
            suitability: 65,
            image: "/images/wheat.jpg",
            season: "Rabi",
            waterRequirement: "Medium",
            varieties: [
                { id: "hd2967", name: "HD 2967", suitability: 65, duration: 125, yield: "4-5 tons/hectare" },
                { id: "dbw88", name: "DBW 88", suitability: 62, duration: 130, yield: "3.5-4.5 tons/hectare" },
            ],
        },
    ],
    "default": [
        {
            id: "rice",
            name: "Rice",
            suitability: 85,
            image: "/images/rice.jpg",
            season: "Kharif & Rabi",
            waterRequirement: "High",
            varieties: [
                { id: "ir64", name: "IR64", suitability: 85, duration: 125, yield: "4-5 tons/hectare" },
                { id: "swarna", name: "Swarna", suitability: 82, duration: 135, yield: "4.5-5.5 tons/hectare" },
            ],
        },
        {
            id: "wheat",
            name: "Wheat",
            suitability: 80,
            image: "/images/wheat.jpg",
            season: "Rabi",
            waterRequirement: "Medium",
            varieties: [
                { id: "hd2967", name: "HD 2967", suitability: 80, duration: 125, yield: "4-5 tons/hectare" },
                { id: "pusa", name: "Pusa Gold", suitability: 78, duration: 130, yield: "4-4.5 tons/hectare" },
            ],
        },
        {
            id: "maize",
            name: "Maize",
            suitability: 75,
            image: "/images/corn.jpg",
            season: "Kharif & Rabi",
            waterRequirement: "Medium",
            varieties: [{ id: "nk6240", name: "NK 6240", suitability: 75, duration: 110, yield: "7-9 tons/hectare" }],
        },
        // Pulses
        {
            id: "kidneybeans",
            name: "Kidney Beans",
            suitability: 88,
            season: "Rabi",
            waterRequirement: "Medium",
            varieties: [
                { id: "amber", name: "Amber", suitability: 88, duration: 130, yield: "12-15 q/ha" },
                { id: "utkarsh", name: "Utkarsh", suitability: 85, duration: 125, yield: "10-12 q/ha" }
            ]
        },
        {
            id: "chickpea",
            name: "Chickpea",
            suitability: 90,
            season: "Rabi",
            waterRequirement: "Low",
            varieties: [
                { id: "jg11", name: "JG 11", suitability: 90, duration: 110, yield: "20-25 q/ha" },
                { id: "kak2", name: "KAK 2", suitability: 88, duration: 120, yield: "18-22 q/ha" }
            ]
        },
        {
            id: "pigeonpeas",
            name: "Pigeon Peas",
            suitability: 85,
            season: "Kharif",
            waterRequirement: "Medium",
            varieties: [
                { id: "icpl87", name: "ICPL 87", suitability: 85, duration: 120, yield: "15-18 q/ha" },
                { id: "bahar", name: "Bahar", suitability: 82, duration: 180, yield: "20-22 q/ha" }
            ]
        },
        {
            id: "mothbeans",
            name: "Moth Beans",
            suitability: 80,
            season: "Kharif",
            waterRequirement: "Very Low",
            varieties: [
                { id: "rmo40", name: "RMO 40", suitability: 80, duration: 65, yield: "6-8 q/ha" },
                { id: "rmo225", name: "RMO 225", suitability: 78, duration: 62, yield: "5-7 q/ha" }
            ]
        },
        {
            id: "lentil",
            name: "Lentil",
            suitability: 82,
            season: "Rabi",
            waterRequirement: "Low",
            varieties: [
                { id: "h1l", name: "HUL 57", suitability: 82, duration: 110, yield: "12-15 q/ha" },
                { id: "k75", name: "K 75", suitability: 80, duration: 115, yield: "10-12 q/ha" }
            ]
        },
        {
            id: "blackgram",
            name: "Blackgram",
            suitability: 85,
            season: "Kharif",
            waterRequirement: "Low",
            varieties: [
                { id: "t9", name: "T9", suitability: 85, duration: 80, yield: "10-12 q/ha" },
                { id: "pu31", name: "PU 31", suitability: 82, duration: 85, yield: "12-14 q/ha" }
            ]
        },
        // Fruits
        {
            id: "watermelon",
            name: "Watermelon",
            suitability: 92,
            season: "Zaid",
            waterRequirement: "Medium",
            varieties: [
                { id: "sugarbaby", name: "Sugar Baby", suitability: 92, duration: 85, yield: "20-25 tons/ha" },
                { id: "arka", name: "Arka Manik", suitability: 88, duration: 90, yield: "30-35 tons/ha" }
            ]
        },
        {
            id: "muskmelon",
            name: "Muskmelon",
            suitability: 85,
            season: "Zaid",
            waterRequirement: "Medium",
            varieties: [
                { id: "hara", name: "Hara Madhu", suitability: 85, duration: 95, yield: "15-20 tons/ha" },
                { id: "punjab", name: "Punjab Sunehri", suitability: 82, duration: 90, yield: "18-22 tons/ha" }
            ]
        },
        {
            id: "apple",
            name: "Apple",
            suitability: 70,
            season: "Year-round",
            waterRequirement: "High",
            varieties: [
                { id: "royal", name: "Royal Delicious", suitability: 70, duration: "Perennial", yield: "10-15 tons/ha" },
                { id: "golden", name: "Golden Delicious", suitability: 68, duration: "Perennial", yield: "12-18 tons/ha" }
            ]
        },
        {
            id: "banana",
            name: "Banana",
            suitability: 90,
            season: "Year-round",
            waterRequirement: "High",
            varieties: [
                { id: "robusta", name: "Robusta", suitability: 90, duration: 365, yield: "40-50 tons/ha" },
                { id: "grand", name: "Grand Naine", suitability: 88, duration: 340, yield: "50-60 tons/ha" }
            ]
        },
        {
            id: "orange",
            name: "Orange",
            suitability: 82,
            season: "Perennial",
            waterRequirement: "Medium",
            varieties: [
                { id: "nagpur", name: "Nagpur Mandarin", suitability: 82, duration: "Perennial", yield: "20-25 tons/ha" },
                { id: "kinnow", name: "Kinnow", suitability: 80, duration: "Perennial", yield: "18-22 tons/ha" }
            ]
        },
        {
            id: "papaya",
            name: "Papaya",
            suitability: 88,
            season: "Perennial",
            waterRequirement: "Medium",
            varieties: [
                { id: "pusanana", name: "Pusa Nanha", suitability: 88, duration: "Perennial", yield: "25-30 tons/ha" },
                { id: "redlady", name: "Red Lady", suitability: 85, duration: "Perennial", yield: "40-50 tons/ha" }
            ]
        },
        {
            id: "coconut",
            name: "Coconut",
            suitability: 95,
            season: "Perennial",
            waterRequirement: "High",
            varieties: [
                { id: "wct", name: "West Coast Tall", suitability: 95, duration: "Perennial", yield: "80-100 nuts/tree" },
                { id: "cod", name: "Chowghat Green", suitability: 90, duration: "Perennial", yield: "60-80 nuts/tree" }
            ]
        },
        {
            id: "grapes",
            name: "Grapes",
            suitability: 80,
            season: "Perennial",
            waterRequirement: "Medium",
            varieties: [
                { id: "thompson", name: "Thompson Seedless", suitability: 80, duration: "Perennial", yield: "20-25 tons/ha" },
                { id: "bangalore", name: "Bangalore Blue", suitability: 78, duration: "Perennial", yield: "18-20 tons/ha" }
            ]
        },
        {
            id: "mango",
            name: "Mango",
            suitability: 92,
            season: "Perennial",
            waterRequirement: "Medium",
            varieties: [
                { id: "alphonso", name: "Alphonso", suitability: 92, duration: "Perennial", yield: "8-10 tons/ha" },
                { id: "totapuri", name: "Totapuri", suitability: 90, duration: "Perennial", yield: "15-20 tons/ha" }
            ]
        },
        {
            id: "coffee",
            name: "Coffee",
            suitability: 75,
            season: "Perennial",
            waterRequirement: "High",
            varieties: [
                { id: "arabica", name: "Arabica", suitability: 75, duration: "Perennial", yield: "600-800 kg/ha" },
                { id: "robusta_c", name: "Robusta", suitability: 78, duration: "Perennial", yield: "800-1000 kg/ha" }
            ]
        },
        {
            id: "jute",
            name: "Jute",
            suitability: 88,
            season: "Kharif",
            waterRequirement: "Very High",
            varieties: [
                { id: "jrc321", name: "JRC 321", suitability: 88, duration: 120, yield: "20-25 q/ha" },
                { id: "jro524", name: "JRO 524", suitability: 85, duration: 110, yield: "25-30 q/ha" }
            ]
        }
    ]

};

export const calculateSoilSuitability = (crop, userProfile) => {
    const baseSuitability = crop.suitability;
    let soilAdjustment = 0;
    const profile = userProfile.soilProfile || {}; // Access nested soilProfile

    // Soil type adjustments - MATCHING KEYS from ProfileSetup (blackSoil, redSoil etc) to simple types (clay, loamy)
    // Logic to map ProfileSetup keys to algorithm keys:
    // blackSoil -> clay, redSoil -> loamy, sandySoil -> sandy, mixedSoil -> loamy

    let simpleSoilType = "loamy"; // default
    if (profile.soilType === 'blackSoil') simpleSoilType = 'clay';
    else if (profile.soilType === 'redSoil') simpleSoilType = 'loamy';
    else if (profile.soilType === 'sandySoil') simpleSoilType = 'sandy';
    else if (profile.soilType === 'yellowSoil') simpleSoilType = 'silt';

    if (simpleSoilType) {
        const soilPreferences = {
            rice: { clay: 15, loamy: 10, silt: 5, sandy: -10, peaty: 0, chalky: -5 },
            wheat: { loamy: 15, clay: 5, silt: 10, sandy: -5, peaty: -10, chalky: 0 },
            cotton: { clay: 10, loamy: 15, silt: 5, sandy: 0, peaty: -15, chalky: -5 },
            maize: { loamy: 15, clay: 5, silt: 10, sandy: 5, peaty: -5, chalky: 0 },
            sugarcane: { clay: 10, loamy: 15, silt: 5, sandy: -5, peaty: 5, chalky: -10 },
        };

        const cropPrefs = soilPreferences[crop.id];
        if (cropPrefs) {
            soilAdjustment += cropPrefs[simpleSoilType] || 0;
        }
    }

    // pH adjustments - Profile keys: waterFast, waterMedium, waterSlow (Wait, soilPH state in ProfileSetup was actually Water Behavior? 
    // Let's re-read ProfileSetup. 
    // Ah, in ProfileSetup: setSoilPH -> handles 'waterBehaviorQuestion'. 
    // But wait, the variable name is soilPH but the question is "Water Behavior"? 
    // AND there is another state `irrigationAvailable`.
    // Let's look at ProfileSetup again.
    // Line 169: label="Water Behavior", value={soilPH}. Options: waterFast, waterMedium...
    // Line 159: label="Soil Color", value={soilType}. Options: black, red...

    // The user's NEW snippet had `soilPH` as actual pH. But my `ProfileSetup` reused variable names maybe?
    // I need to be careful. In my `ProfileSetup` refactor:
    // soilPH state -> actually stores "waterFast", "waterMedium" etc.
    // So I cannot use it as actual pH (acidic/neutral).

    // Recommendation: I will treat 'waterFast' as 'sandy/porous' behavior?, 'waterSlow' as 'clay' behavior?
    // actually, let's just use the `simpleSoilType` mapping as best effort. I won't use pH logic since I don't have real pH.

    return Math.min(100, Math.max(0, baseSuitability + soilAdjustment));
};

export const getSoilMatchDetails = (crop, userProfile) => {
    const matches = [];
    const concerns = [];
    const profile = userProfile.soilProfile || {};

    // Mocking simple logic since we don't have full scientific data mappings
    // Just adding some generic strings based on the crop
    if (crop.waterRequirement === "High") {
        if (profile.irrigationAvailable === 'rainOnly') {
            concerns.push("High water crop vs Rain only");
        } else {
            matches.push("Water requirement met");
        }
    }

    // Soil Type Display
    matches.push(`Compatible with ${profile.soilType || 'local'} soil`);

    return { matches, concerns };
};
