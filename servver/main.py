import os
import certifi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.mitron_db

from sensor_manager import sensor_manager

@app.on_event("startup")
async def startup_db_client():
    try:
        await client.admin.command('ping')
        print("Combined to MongoDB Atlas - Connection Verified")
    except Exception as e:
        print(f"MongoDB Connection Failed: {e}")
    
    # Start Sensor Manager
    sensor_manager.start()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    sensor_manager.stop()

@app.get("/")
async def root():
    return {"message": "MITRON API is Running (Python/FastAPI)"}

from routes import auth, api, market, admin, irrigation
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(api.router, prefix="/api", tags=["api"])
app.include_router(market.router, prefix="/api/market", tags=["market"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(irrigation.router, prefix="/api/irrigation", tags=["irrigation"])
from routes import schemes
app.include_router(schemes.router, prefix="/api/schemes", tags=["schemes"])
from routes import fertilizer
app.include_router(fertilizer.router, prefix="/api", tags=["fertilizer"])
