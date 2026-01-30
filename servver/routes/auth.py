from fastapi import APIRouter, HTTPException, Request, Depends
from models import UserCreate, UserDB, Land, Location, Dimensions, Area, SoilProfile
from main import db
from bson import ObjectId
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "secret")
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/check-mobile")
async def check_mobile(payload: dict):
    mobile = payload.get("mobile")
    user = await db.users.find_one({"mobile": mobile})
    if user:
        return {"exists": True, "user": UserDB(**user)}
    return {"exists": False}

@router.post("/register")
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"mobile": user.mobile})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")
    
    user_dict = user.dict(exclude_unset=True)
    new_user = await db.users.insert_one(user_dict)
    created_user = await db.users.find_one({"_id": new_user.inserted_id})
    return {"success": True, "user": UserDB(**created_user)}

@router.post("/profile-setup")
async def profile_setup(payload: dict):
    # Payload matches the frontend `profileData` structure
    mobile = payload.get("mobile") # Frontend now sends 'mobile' in main payload too, or 'mobileNumber'
    if not mobile:
        mobile = payload.get("mobileNumber") # Fallback
    
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number required for profile update")

    # 1. Check for Duplicate Aadhaar (if provided)
    aadhar = payload.get("aadhar")
    if aadhar:
        duplicate_user = await db.users.find_one({
            "aadhar": aadhar,
            "mobile": {"$ne": mobile} # Exclude current user (different mobile)
        })
        if duplicate_user:
             raise HTTPException(status_code=400, detail="Aadhaar number already registered with another account")

    # 2. Update User Profile with new Schema
    user_update = {
        "fullName": payload.get("fullName"),
        "aadhar": aadhar,
        "role": "farmer",
        "onboardingCompleted": True,
        
        # New Nested Object Structures
        "demographics": payload.get("demographics"),
        "location": payload.get("location"), 
        "farming": payload.get("farming"),
        "financials": payload.get("financials"),
        
        # Keep soilProfile for backward compatibility
        "soilProfile": payload.get("soilProfile") 
    }
    
    # Prune None values
    user_update = {k: v for k, v in user_update.items() if v is not None}
    
    user = await db.users.find_one_and_update(
        {"mobile": mobile},
        {"$set": user_update},
        upsert=True,
        return_document=True
    )
    
    if not user:
        raise HTTPException(status_code=500, detail="Failed to save profile")
    
    # Return full UserDB model
    # Note: simplify return to avoid separate Land lookup since we store everything in User now
    return {"success": True, "user": UserDB(**user)}

async def get_full_user_profile(mobile: str):
    user = await db.users.find_one({"mobile": mobile})
    if not user:
        return None
    
    user_obj = UserDB(**user)
    
    # Fetch latest land
    land = await db.lands.find_one({"userId": str(user["_id"])}, sort=[("_id", -1)])
    
    profile = user_obj.dict(by_alias=True)
    
    # Flatten/Adapt for Frontend
    # Frontend expects: mobileNumber, state, district (top level), soilProfile, etc.
    profile["mobileNumber"] = profile["mobile"]
    if profile.get("location"):
        profile["state"] = profile["location"].get("state")
        profile["district"] = profile["location"].get("district")
    
    if land:
        land_obj = Land(**land)
        profile["landId"] = str(land["_id"])
        profile["soilProfile"] = land_obj.soilProfile.dict() if land_obj.soilProfile else None
        
        # Area logic
        if land_obj.area and land_obj.area.totalArea:
             profile["landArea"] = land_obj.area.totalArea
             profile["landUnit"] = land_obj.area.areaUnit
        elif land_obj.dimensions:
             # approximations if needed, or just send dimensions
             profile["dimensions"] = land_obj.dimensions.dict()

    return profile

@router.post("/login")
async def login(payload: dict):
    mobile = payload.get("mobile")
    user = await db.users.find_one({"mobile": mobile})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    token = create_access_token({"sub": mobile, "id": str(user["_id"])})
    
    # Return enriched profile
    full_profile = await get_full_user_profile(mobile)
    
    return {"success": True, "user": full_profile, "token": token}
