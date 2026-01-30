from fastapi.testclient import TestClient
import sys
import os

# Add the backend directory to sys.path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
import json

client = TestClient(app)

def test_recommendation():
    print("Testing /api/fertilizer-recommendation...")
    payload = {
        "crop": "Rice",
        # Note: Soil Type passed as title case to match likely LabelEncoder classes (e.g. 'Loamy', 'Clayey')
        "soil_type": "Loamy", 
        "ph": 6.5,
        "nitrogen": 100,
        "phosphorus": 20,
        "potassium": 40,
        "organic_carbon": 0.5,
        "temperature": 30,
        "humidity": 60,
        "moisture": 50,
        "weather": {"rain": False, "temperature": 30}
    }
    
    try:
        response = client.post("/api/fertilizer-recommendation", json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Error Response:")
            print(response.text)
    except Exception as e:
        print(f"Test failed with exception: {e}")

if __name__ == "__main__":
    test_recommendation()
