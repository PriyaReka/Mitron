def explain_recommendation(crop, soil, organic, chemical):
    """
    Generates a farmer-friendly explanation for the recommendation.
    """
    explanation = {
        "summary": f"For your {crop} crop, fertilizers are recommended based on current soil condition.",
        
        "soil_explanation": (
            f"Soil pH is {soil.get('ph', 'Normal')}, Nitrogen is {soil.get('N_status', 'Unknown')}, "
            f"Phosphorus is {soil.get('P_status', 'Unknown')} and Potassium is {soil.get('K_status', 'Unknown')}. "
            "This affects crop growth and yield."
        ),

        "organic_reason": (
            "Organic inputs are suggested first to improve soil health, "
            "increase organic matter, and reduce chemical dependency."
        ),

        "chemical_reason": (
            "Chemical inputs are suggested only to quickly correct nutrient deficiency "
            "and protect crops from severe pest attack."
        ),

        "usage_tips": [
            "Apply fertilizers during early morning or evening",
            "Do not mix organic and chemical pesticides together",
            "Follow recommended dosage only",
            "Wear safety gloves while spraying"
        ]
    }

    return explanation
