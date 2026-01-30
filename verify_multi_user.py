
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import aiohttp
import os
import certifi

# Configuration
MONGO_URI = "mongodb+srv://priyarekasact2023_db_user:WoVZVM3w7IjnseZM@cluster0.sacehr1.mongodb.net/?appName=Cluster0"
DB_NAME = "mitron_db"
API_URL = "http://localhost:5000"

async def verify_multi_user():
    print("--- Starting Multi-User Verification ---")
    
    # 1. Setup DB Connection
    client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    
    # 2. Create Dummy Users
    users = [
        {"mobile": "9998887771", "fullName": "Test Farmer A", "aadhar": "111122223331"},
        {"mobile": "9998887772", "fullName": "Test Farmer B", "aadhar": "111122223332"}
    ]
    
    print("Creating/Updating Dummy Users...")
    for user in users:
        await db.users.update_one(
            {"mobile": user["mobile"]},
            {"$set": user},
            upsert=True
        )
    print("Users Created.")

    # 3. Create Excel File
    data = [
        {
            "sno": 1, 
            "mobile no": "9998887771", 
            "aadhaar": "111122223331", 
            "user name": "Test Farmer A", 
            "irrigation date": datetime.now().strftime("%d-%m-%Y"), 
            "start time": "10:00 AM", 
            "end time": "11:00 AM"
        },
        {
            "sno": 2, 
            "mobile no": "9998887772", 
            "aadhaar": "111122223332", 
            "user name": "Test Farmer B", 
            "irrigation date": datetime.now().strftime("%d-%m-%Y"), 
            "start time": "11:00 AM", 
            "end time": "12:00 PM"
        }
    ]
    
    df = pd.DataFrame(data)
    filename = "test_schedule.xlsx"
    df.to_excel(filename, index=False)
    print(f"Created {filename}")

    # 4. Upload File via API
    print("Uploading File...")
    async with aiohttp.ClientSession() as session:
        data = aiohttp.FormData()
        data.add_field('file', open(filename, 'rb'), filename=filename, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        
        async with session.post(f"{API_URL}/api/admin/upload-irrigation", data=data) as resp:
            print(f"Upload Status: {resp.status}")
            print(f"Upload Response: {await resp.text()}")

        # 5. Verify Individual Schedules
        print("\nVerifying Schedules... (Assuming server is running and connected to same cloud DB)")
        
        # Check User A
        async with session.get(f"{API_URL}/api/irrigation/my-schedule?mobile=9998887771") as resp:
            schedule_a = await resp.json()
            # Expecting upcoming/current for today
            has_entry = schedule_a.get('upcoming') or schedule_a.get('current')
            print(f"User A Schedule Found: {bool(has_entry)}")
            if has_entry:
                 print(f"User A Entry: {has_entry}")

        # Check User B
        async with session.get(f"{API_URL}/api/irrigation/my-schedule?mobile=9998887772") as resp:
            schedule_b = await resp.json()
            has_entry = schedule_b.get('upcoming') or schedule_b.get('current')
            print(f"User B Schedule Found: {bool(has_entry)}")
            if has_entry:
                 print(f"User B Entry: {has_entry}")
                 
    # Cleanup
    if os.path.exists(filename):
        os.remove(filename)

    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(verify_multi_user())
