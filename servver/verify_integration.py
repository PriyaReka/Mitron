import requests
import json

def test_integration():
    url = "http://localhost:5000/api/fertilizer-recommendation"
    payload = {
        "crop": "Rice",
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
        print(f"Sending POST request to {url}...")
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success! Response:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("❌ Error! Response:")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_integration()
