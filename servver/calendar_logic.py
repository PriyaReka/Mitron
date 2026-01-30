from datetime import datetime, timedelta

def generate_schedule(crop):
    """
    Generates a simple calendar schedule for application.
    """
    today = datetime.today()

    return [
        {
            "activity": "Basal fertilizer application",
            "date": today.strftime("%Y-%m-%d")
        },
        {
            "activity": "Top dressing",
            "date": (today + timedelta(days=25)).strftime("%Y-%m-%d")
        },
        {
            "activity": "Pest monitoring",
            "date": (today + timedelta(days=40)).strftime("%Y-%m-%d")
        }
    ]
