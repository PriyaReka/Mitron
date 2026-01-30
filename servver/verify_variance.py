import requests
import json

def test_model_variance():
    url = "http://localhost:5000/api/fertilizer-recommendation"
    
    # Define distinct test cases
    test_cases = [
        {
            "name": "Case 1: Rice (High N, Wet)",
            "payload": {
                "crop": "Rice",
                "soil_type": "Clayey",
                "ph": 6.5,
                "nitrogen": 120,
                "phosphorus": 40,
                "potassium": 40,
                "temperature": 26,
                "humidity": 80,
                "moisture": 60,
                "weather": {"rain": True} 
            }
        },
        {
            "name": "Case 2: Wheat (Low N, Dry)",
            "payload": {
                "crop": "Wheat",
                "soil_type": "Loamy",
                "ph": 7.0,
                "nitrogen": 40, # Deficient
                "phosphorus": 20,
                "potassium": 20,
                "temperature": 15,
                "humidity": 40,
                "moisture": 30,
                 "weather": {"rain": False}
            }
        },
        {
             "name": "Case 3: Cotton (Sandy, High K)",
             "payload": {
                 "crop": "Cotton",
                 "soil_type": "Sandy",
                 "ph": 7.5,
                 "nitrogen": 80,
                 "phosphorus": 30,
                 "potassium": 100, # High K
                 "temperature": 32,
                 "humidity": 50,
                 "moisture": 20,
                  "weather": {"rain": False}
             }
        }
    ]

    print("🔍 Testing Model Variance...\n")
    
    seen_recommendations = set()
    
    for case in test_cases:
        try:
            print(f"--- {case['name']} ---")
            resp = requests.post(url, json=case["payload"])
            if resp.status_code == 200:
                data = resp.json()
                chem_rec = data["recommendation"]["chemical"]["fertilizers"][0]["name"]
                conf = data.get("confidence", "N/A")
                print(f"✅ Prediction: {chem_rec} (Confidence: {conf})")
                seen_recommendations.add(chem_rec)
            else:
                print(f"❌ Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")
        print("")

    print("--- Summary ---")
    if len(seen_recommendations) > 1:
        print(f"✅ PASS: Model produced diverse outputs: {seen_recommendations}")
    else:
        print(f"⚠️ WARN: Model produced the SAME output for all inputs: {seen_recommendations}")
        print("Possible causes: Model not loaded (using fallback), overfitting, or identical preprocessing.")

if __name__ == "__main__":
    test_model_variance()
