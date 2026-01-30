import requests
import json
from datetime import datetime

url = "http://localhost:5000/api/farming/active-crop"

payload = {
    "userId": "1234567890",
    "cropData": {
        "cropId": "rice",
        "cropName": "Rice",
        "varietyId": "ponni",
        "varietyName": "Ponni",
        "startDate": datetime.now().isoformat(),
        "image": "/images/rice.jpg"
    }
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
