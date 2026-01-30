import numpy as np
from model_loader import model, encoders, scaler
from confidence import calculate_confidence
from regulatory_filter import filter_indian_regulations

# Mapping for organic alternatives based on chemical prediction
# This bridges the gap between the model's single-label output and the requirement for organic options.
ORGANIC_MAPPING = {
    "Urea": [
        {"name": "Vermicompost", "quantity": "2 tons/acre", "stage": "Basal"},
        {"name": "Cow Manure", "quantity": "5 tons/acre", "stage": "Pre-sowing"}
    ],
    "DAP": [
        {"name": "Bone Meal", "quantity": "50 kg/acre", "stage": "Basal"},
        {"name": "Rock Phosphate", "quantity": "100 kg/acre", "stage": "Basal"}
    ],
    "14-35-14": [
        {"name": "Vermicompost", "quantity": "1.5 tons/acre", "stage": "Basal"},
        {"name": "Poultry Manure", "quantity": "2 tons/acre", "stage": "Pre-sowing"}
    ],
    "28-28": [
        {"name": "Mixed Compost", "quantity": "3 tons/acre", "stage": "Basal"}
    ],
    "17-17-17": [
        {"name": "Panchagavya", "quantity": "3 Liters/acre", "stage": "Foliar Spray"}
    ],
    "20-20": [
        {"name": "Fish Amino Acid", "quantity": "5 Liters/acre", "stage": "Foliar Spray"}
    ],
    "10-26-26": [
        {"name": "Mustard Cake", "quantity": "200 kg/acre", "stage": "Basal"}
    ]
}

DEFAULT_ORGANIC = [
    {"name": "Vermicompost", "quantity": "2 tons/acre", "stage": "Basal"}
]

# Standard Pesticides (Rule-based as model does not predict pesticides)
PESTICIDE_RULES = {
    "Rice": {
        "organic": [{"name": "Neem Oil", "dosage": "3 ml/L", "target": "Stem Borer"}],
        "chemical": [{"name": "Chlorantraniliprole", "dosage": "0.4 ml/L", "target": "Stem Borer"}]
    },
    "Wheat": {
        "organic": [{"name": "Neem Oil", "dosage": "3 ml/L", "target": "Aphids"}],
        "chemical": [{"name": "Imidacloprid", "dosage": "0.5 ml/L", "target": "Aphids"}]
    },
    # Default fallback
    "default": {
        "organic": [{"name": "Neem Oil", "dosage": "3 ml/L", "target": "General Pests"}],
        "chemical": [{"name": "Emamectin Benzoate", "dosage": "0.5 g/L", "target": "Caterpillars"}]
    }
}

def get_pesticide_recommendation(crop):
    rules = PESTICIDE_RULES.get(crop, PESTICIDE_RULES["default"])
    return rules["organic"], rules["chemical"]

def recommend(input_data):
    """
    input_data expected keys:
    - temperature
    - humidity
    - moisture
    - soil_type
    - crop
    - nitrogen
    - potassium
    - phosphorus
    """
    try:
        # Encode inputs
        try:
            encoded_soil = encoders['Soil Type'].transform([input_data['soil_type']])[0]
            encoded_crop = encoders['Crop Type'].transform([input_data['crop']])[0]
        except ValueError as e:
            print(f"Encoding error: {e}. Using defaults/0.")
            # Fallback for unseen values
            encoded_soil = 0
            encoded_crop = 0
        except KeyError as e:
            print(f"Encoder key error: {e}")
            return {"error": "Model encoders not loaded correctly."}

        # Prepare feature vector
        # Order: Temparature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous
        features = [
            input_data.get('temperature', 25), # Default 25C
            input_data.get('humidity', 50),    # Default 50%
            input_data.get('moisture', 40),    # Default 40%
            encoded_soil,
            encoded_crop,
            input_data.get('nitrogen', 0),
            input_data.get('potassium', 0),
            input_data.get('phosphorus', 0)
        ]
        
        # Scale if scaler exists (it doesn't in this specific trained model, but good practice to check)
        if scaler:
            input_vector = scaler.transform([features])
        else:
            input_vector = [features]

        # Predict
        if model:
            pred_idx = model.predict(input_vector)[0]
            pred_name = encoders['Fertilizer Name'].inverse_transform([pred_idx])[0]
            confidence = calculate_confidence(model, input_vector[0])
        else:
            # Fallback if model is not loaded
            pred_name = "Urea"
            confidence = 0.0

        # Generate Recommendations
        
        # 1. Chemical Fertilizer (The Prediction)
        chemical_fertilizers = [{
            "name": pred_name,
            "quantity": "As per soil test (approx 50-100 kg/acre)", # Can be refined based on NPK gap
            "split": "Split into 2-3 doses"
        }]

        # 2. Organic Fertilizer (Mapped from Prediction)
        organic_fertilizers = ORGANIC_MAPPING.get(pred_name, DEFAULT_ORGANIC)

        # 3. Pesticides (Rule based on Crop)
        organic_pesticides, chemical_pesticides = get_pesticide_recommendation(input_data.get('crop'))

        # 4. Filter Regulations
        chemical_pesticides = filter_indian_regulations(chemical_pesticides)

        return {
            "confidence": confidence,
            "organic": {
                "fertilizers": organic_fertilizers,
                "pesticides": organic_pesticides
            },
            "chemical": {
                "fertilizers": chemical_fertilizers,
                "pesticides": chemical_pesticides
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
