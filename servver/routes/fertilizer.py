from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from recommender import recommend
from explanation_layer import explain_recommendation
from impact_warning import generate_warning
from calendar_logic import generate_schedule
from weather_adjustment import weather_adjustment

router = APIRouter()

class SoilInput(BaseModel):
    crop: str
    soil_type: str
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    organic_carbon: float
    # Optional fields expected by the ML model (with defaults if not provided)
    temperature: float = 25.0
    humidity: float = 50.0
    moisture: float = 40.0
    # Optional weather data for advisory
    weather: Optional[Dict[str, Any]] = None 
    # Example: {"rain": True, "temperature": 30, "humidity": 80}

@router.post("/fertilizer-recommendation")
def get_recommendation(data: SoilInput):
    try:
        # Prepare input dict for recommender
        input_data = {
            "crop": data.crop,
            "soil_type": data.soil_type,
            "ph": data.ph,
            "nitrogen": data.nitrogen,
            "phosphorus": data.phosphorus,
            "potassium": data.potassium,
            "temperature": data.temperature,
            "humidity": data.humidity,
            "moisture": data.moisture
        }

        # 1. Get ML Recommendation
        result = recommend(input_data)
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])

        # 2. Prepare Soil Status for Explanation
        # Simple logic to determine Low/Adequate based on generic thresholds
        # These thresholds should ideally be crop-specific but generic is fine for explanation MVP
        soil_status = {
            "ph": data.ph,
            "N_status": "Low" if data.nitrogen < 120 else "Adequate", # Example threshold
            "P_status": "Low" if data.phosphorus < 20 else "Adequate",
            "K_status": "Low" if data.potassium < 30 else "Adequate"
        }

        # 3. Generate Farmer-Friendly Explanation
        explanation = explain_recommendation(
            data.crop,
            soil_status,
            result.get("organic", {}),
            result.get("chemical", {})
        )

        # 4. Generate Impact Warnings
        warnings = generate_warning(data.crop, soil_status)

        # 5. Generate Application Schedule
        schedule = generate_schedule(data.crop)

        # 6. Generate Weather Advisory
        advisory = weather_adjustment(data.weather)

        return {
            "crop": data.crop,
            "confidence": result.get("confidence", 0),
            "recommendation": result,
            "farmer_explanation": explanation,
            "if_not_applied": warnings,
            "application_schedule": schedule,
            "weather_advisory": advisory
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
