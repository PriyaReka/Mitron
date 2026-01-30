import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load Env
load_dotenv(dotenv_path="../.env") # Adjust path if running from utils/

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    # Fallback for direct execution
    MONGO_URI = "mongodb+srv://priyarekasact2023_db_user:WoVZVM3w7IjnseZM@cluster0.sacehr1.mongodb.net/?appName=Cluster0"

# Central Schemes (From DATA_SOURCES)
CENTRAL_SCHEMES = [
    {
        "name": "PM-KISAN",
        "url": "https://pmkisan.gov.in/",
        "description": "Pradhan Mantri Kisan Samman Nidhi - Financial Support",
        "type": "central"
    },
    {
        "name": "PMFBY",
        "url": "https://pmfby.gov.in/",
        "description": "Pradhan Mantri Fasal Bima Yojana - Crop Insurance",
        "type": "central"
    },
    {
        "name": "AgriStack",
        "url": "https://agristack.org.in/",
        "description": "Digital Farmer Registry",
        "type": "central"
    }
]

# Regional Schemes (Flattened from REGIONAL_SCHEMES)
REGIONAL_DATA = {
    "Andhra Pradesh": [
        {"name": "Annadatha Sukhibhava", "url": "https://apseeds.ap.gov.in/Website/Schemes.aspx", "description": "Investment support"},
        {"name": "AP Seed Subsidy", "url": "https://apseeds.ap.gov.in/Website/Schemes.aspx", "description": "Seed subsidy"}
    ],
    "Arunachal Pradesh": [
        {"name": "Arunachal Agri Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Arunachal%20Pradesh", "description": "State agri schemes"}
    ],
    "Assam": [
        {"name": "Mukhya Mantri Krishi Sa Sajuli Yojana", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Assam", "description": "Farm equipment support"}
    ],
    "Bihar": [
        {"name": "Custom Hiring Centres", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Bihar", "description": "Farm machinery access"}
    ],
     "Chhattisgarh": [
        {"name": "State Agriculture Subsidy", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Chhattisgarh", "description": "Subsidy schemes"}
    ],
    "Goa": [
        {"name": "Goa Agriculture Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Goa", "description": "State schemes"}
    ],
    "Gujarat": [
        {"name": "Jyotigram Yojana", "url": "https://en.wikipedia.org/wiki/Jyotigram_Yojana", "description": "Rural power supply"},
        {"name": "Gujarat State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Gujarat", "description": "General schemes"}
    ],
    "Haryana": [
        {"name": "Haryana Agri Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Haryana", "description": "Subsidy incentives"}
    ],
    "Himachal Pradesh": [
        {"name": "HP State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Himachal%20Pradesh", "description": "Mountain agri schemes"}
    ],
    "Jharkhand": [
        {"name": "Jharkhand Agri Schemes", "url": "https://www.manage.gov.in/fpoacademy/SGSchemes/state-schemes.asp", "description": "State specific schemes"}
    ],
    "Karnataka": [
        {"name": "Karnataka State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Karnataka", "description": "State development schemes"}
    ],
    "Kerala": [
        {"name": "State Horticulture Mission", "url": "https://en.wikipedia.org/wiki/Kerala_State_Horticulture_Mission", "description": "Horticulture support"},
        {"name": "Kerala Agri Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Kerala", "description": "General schemes"}
    ],
    "Madhya Pradesh": [
        {"name": "Bhavantar Bhugtan Yojana", "url": "https://en.wikipedia.org/wiki/Bhavantar_Bhugtan_Yojana", "description": "Price difference compensation"},
        {"name": "Solar Pump Subsidy", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Madhya%20Pradesh", "description": "Solar irrigation"}
    ],
    "Maharashtra": [
        {"name": "Krishi Samruddhi Yojana", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Maharashtra", "description": "Sustainable agriculture"}
    ],
     "Manipur": [
        {"name": "Manipur State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Manipur", "description": "Local schemes"}
    ],
    "Meghalaya": [
        {"name": "Meghalaya State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Meghalaya", "description": "Local schemes"}
    ],
    "Mizoram": [
        {"name": "Mizoram State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Mizoram", "description": "Local schemes"}
    ],
    "Nagaland": [
        {"name": "Nagaland State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Nagaland", "description": "Local schemes"}
    ],
    "Odisha": [
        {"name": "Odisha Agriculture Missions", "url": "https://agri.odisha.gov.in/sites/default/files/2022-10/SCHEMES.pdf", "description": "State missions"},
         {"name": "Odisha State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Odisha", "description": "General schemes"}
    ],
    "Punjab": [
        {"name": "Punjab State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Punjab", "description": "Farm schemes"}
    ],
    "Rajasthan": [
        {"name": "Rajasthan State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Rajasthan", "description": "State schemes"}
    ],
    "Sikkim": [
        {"name": "Sikkim State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Sikkim", "description": "State schemes"}
    ],
    "Tamil Nadu": [
        {"name": "Uzhavar Santhai", "url": "https://en.wikipedia.org/wiki/Uzhavar_Santhai", "description": "Farmer markets"},
        {"name": "TN State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Tamil%20Nadu", "description": "General schemes"}
    ],
    "Telangana": [
        {"name": "Rythu Bandhu", "url": "https://en.wikipedia.org/wiki/Rythu_Bandhu_scheme", "description": "Investment support"},
        {"name": "Indira Solar Giri Jal", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Telangana", "description": "Solar irrigation"}
    ],
    "Tripura": [
        {"name": "Tripura State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Tripura", "description": "State schemes"}
    ],
    "Uttar Pradesh": [
        {"name": "UP Cultivation Promotion", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Uttar%20Pradesh", "description": "Seed subsidies"}
    ],
    "Uttarakhand": [
        {"name": "Farm Machinery Bank", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Uttarakhand", "description": "Incentives"}
    ],
    "West Bengal": [
        {"name": "West Bengal State Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=West%20Bengal", "description": "State schemes"}
    ],
    "Andaman and Nicobar Islands": [
        {"name": "Andaman & Nicobar Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Andaman%20%26%20Nicobar%20Islands", "description": "UT schemes"}
    ],
    "Chandigarh": [
        {"name": "Chandigarh Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Chandigarh", "description": "UT schemes"}
    ],
    "Dadra and Nagar Haveli": [
        {"name": "DNH & DD Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Dadra%20%26%20Nagar%20Haveli%20%26%20Daman%20%26%20Diu", "description": "UT schemes"}
    ],
    "Daman and Diu": [
        {"name": "DNH & DD Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Dadra%20%26%20Nagar%20Haveli%20%26%20Daman%20%26%20Diu", "description": "UT schemes"}
    ],
    "Delhi": [
        {"name": "Delhi Agriculture Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Delhi", "description": "UT schemes"}
    ],
    "Jammu and Kashmir": [
        {"name": "J&K Agriculture Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Jammu%20%26%20Kashmir", "description": "UT schemes"}
    ],
    "Ladakh": [
        {"name": "Ladakh Agriculture Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Ladakh", "description": "UT schemes"}
    ],
    "Lakshadweep": [
        {"name": "Lakshadweep Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Lakshadweep", "description": "UT schemes"}
    ],
    "Puducherry": [
        {"name": "Puducherry Schemes", "url": "https://www.myscheme.gov.in/search/category/Agriculture%2CRural%20%26%20Environment?state=Puducherry", "description": "UT schemes"}
    ]
}

async def seed_schemes():
    client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.mitron_db
    collection = db.schemes

    count = 0 
    
    # 1. Seed Central
    print("Seeding Central Schemes...")
    for scheme in CENTRAL_SCHEMES:
        exists = await collection.find_one({"name": scheme["name"]})
        if not exists:
            # Init fields
            scheme["last_scraped"] = None
            scheme["eligibility_criteria"] = None
            await collection.insert_one(scheme)
            count += 1
            print(f"Inserted: {scheme['name']}")
    
    # 2. Seed State
    print("Seeding State Schemes...")
    for state, schemes in REGIONAL_DATA.items():
        for scheme in schemes:
            scheme["type"] = "state"
            scheme["state"] = state
            scheme["last_scraped"] = None
            scheme["eligibility_criteria"] = None
            
            exists = await collection.find_one({"name": scheme["name"], "state": state})
            if not exists:
                await collection.insert_one(scheme)
                count += 1
                print(f"Inserted: {scheme['name']} ({state})")

    print(f"✅ Seeding Complete. Added {count} new schemes.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_schemes())
