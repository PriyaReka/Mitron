def weather_adjustment(weather):
    """
    Adjusts advice based on weather conditions.
    """
    advice = []
    
    # Default safe weather if None
    if not weather:
        return ["Check local weather before application."]

    if weather.get("rain") == True:
        advice.append("Avoid fertilizer application today due to rainfall.")

    if weather.get("temperature", 25) > 35:
        advice.append("Apply fertilizers during early morning or evening due to high heat.")

    if weather.get("humidity", 50) > 80:
        advice.append("Monitor fungal disease risk due to high humidity.")

    return advice
