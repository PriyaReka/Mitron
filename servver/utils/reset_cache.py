import asyncio
import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

MONGO_URI = os.getenv("MONGO_URI")

async def reset_cache():
    if not MONGO_URI:
        print("❌ MONGO_URI not found")
        return

    client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.mitron_db
    
    print("🔄 Resetting Scheme Cache to force fresh scrape...")
    
    result = await db.schemes.update_many(
        {},
        {"$set": {"last_scraped": None}}
    )
    
    print(f"✅ Cache Cleared. Modified {result.modified_count} schemes.")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_cache())
