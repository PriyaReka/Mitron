import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

async def test_connection():
    print(f"Testing connection to: {MONGO_URI.split('@')[-1]}") 
    print(f"Using certifi CA file: {certifi.where()}")
    
    print("\n--- ATTEMPT 1: Secure Connection (with certifi) ---")
    try:
        client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("SUCCESS: Connected securely!")
        return
    except Exception as e:
        print(f"FAILURE: Secure connection failed.")
        print(f"Error: {e}")
    
    print("\n--- ATTEMPT 2: Insecure Connection (tlsAllowInvalidCertificates=True) ---")
    try:
        # WARNING: This is for debugging only
        client = AsyncIOMotorClient(MONGO_URI, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("SUCCESS: Connected INSECURELY! (This means it is an SSL/Cert issue)")
    except Exception as e:
        print(f"FAILURE: Insecure connection failed.")
        print(f"Error: {e}")
        print("\nLikely Cause: IP Address not whitelisted on MongoDB Atlas or Network Firewall.")

if __name__ == "__main__":
    asyncio.run(test_connection())
