import os
from datetime import datetime, timedelta

from fastapi import APIRouter
from main import db
from models import Scheme, ChatSession, ChatMessage, ActiveCrop
from typing import List, Optional
from pydantic import BaseModel
from groq import Groq
from bson import ObjectId
from sensor_manager import sensor_manager
from datetime import datetime
import aiohttp
from gtts import gTTS
import io
from fastapi.responses import StreamingResponse


from datetime import datetime
import pandas as pd
import joblib
import numpy as np

# Load ML Model (Load once at startup)
try:
    crop_model = joblib.load("models/crop_model.pkl")
    label_encoder = joblib.load("models/label_encoder.pkl")
    print("✅ Crop ML Model Loaded")
except Exception as e:
    print(f"⚠️ MLA Model Load Failed: {e}")
    crop_model = None
    label_encoder = None

    crop_model = None
    label_encoder = None

router = APIRouter()

# --- TTS Endpoint ---
@router.get("/chat/tts")
async def text_to_speech(text: str, lang: str = "en"):
    try:
        # Edge TTS requires asyncio
        import edge_tts
        
        # Map languages to Edge TTS voices
        # List: edge-tts --list-voices
        voice_map = {
            "en": "en-US-ChristopherNeural",       # English (US)
            "hi": "hi-IN-SwaraNeural",             # Hindi
            "ta": "ta-IN-PallaviNeural",           # Tamil
            "te": "te-IN-MohanNeural",             # Telugu
            "kn": "kn-IN-GaganNeural",             # Kannada
            "ml": "ml-IN-SobhanaNeural",           # Malayalam
            "bn": "bn-IN-BashkarNeural",           # Bengali
            "gu": "gu-IN-DhwaniNeural",            # Gujarati
            "mr": "mr-IN-AarohiNeural",            # Marathi
            "ur": "ur-IN-GulshanNeural"            # Urdu
        }
        
        selected_voice = voice_map.get(lang, "en-US-ChristopherNeural")
        
        communicate = edge_tts.Communicate(text, selected_voice)
        
        # Save to memory buffer
        # EdgeTTS writes async to file, but we can iterate chunks
        buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buffer.write(chunk["data"])
                
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="audio/mp3")

    except Exception as e:
        print(f"TTS Error: {e}")
        return {"error": str(e)}

# --- Sensors ---
@router.get("/sensors/live")
async def get_live_sensors():
    return sensor_manager.get_data()

# --- Schemes ---
@router.get("/schemes", response_model=List[Scheme])
async def get_schemes():
    schemes = await db.schemes.find().to_list(100)
    return schemes

# --- Chatbot Models ---
# --- Chatbot Models ---
class ChatRequest(BaseModel):
    userId: str # Required for history
    message: str
    language: Optional[str] = "en"
    image: Optional[str] = None # Base64 or URL
    sessionId: Optional[str] = None # If continuing a chat
    userContext: Optional[dict] = None # Farmer Profile & Soil Data

# --- Chatbot Routes ---

@router.get("/chat/history")
async def get_chat_history(userId: str):
    """Get list of chat sessions for a user"""
    sessions = await db.chat_sessions.find(
        {"userId": userId}
    ).sort("updatedAt", -1).to_list(50)
    
    # Return simplified list
    return [
        {
            "id": str(s["_id"]),
            "title": s.get("title", "New Chat"),
            "date": s.get("updatedAt"),
            "preview": s["messages"][-1]["content"][:50] if s.get("messages") else "Empty chat"
        }
        for s in sessions
    ]

@router.get("/chat/history/{session_id}")
async def get_chat_session(session_id: str):
    """Get full messages for a specific session"""
    try:
        session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            return {"error": "Session not found"}
        
        # Convert ObjectId to str for JSON serialization
        session["id"] = str(session.pop("_id"))
        return session
    except Exception as e:
        return {"error": str(e)}

@router.post("/chat")
async def chat(payload: ChatRequest):
    message = payload.message
    language = payload.language
    image = payload.image
    user_id = payload.userId
    session_id = payload.sessionId
    user_context = payload.userContext

    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or "YOUR_GROQ_API_KEY" in api_key:
            return {"reply": "⚠️ **Setup Required**: Please set your Groq API Key in the `server/.env` file."}

        client = Groq(api_key=api_key)

        # 1. Handle Session
        if session_id:
            try:
                session_data = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
                if session_data:
                    session = ChatSession(**session_data)
                else:
                    # Invalid ID, create new
                    session = ChatSession(userId=user_id, title=message[:30]+"...")
            except:
                session = ChatSession(userId=user_id, title=message[:30]+"...")
        else:
            session = ChatSession(userId=user_id, title=message[:30]+"...")
        
        # 2. Add User Message to History
        user_msg = ChatMessage(role="user", content=message)
        session.messages.append(user_msg)

        # 3. Construct Context for AI
        system_context = f"""You are "MITRON", a helpful and expert farming assistant. 
        Context: User language is {language}.
        Task: Answer the user's question about agriculture, crops, weather, or the provided image.
        Style: Simple, encouraging, expert advice. Respond in the user's language if specified."""

        # Inject User Profile & Soil Data if available
        if user_context:
            system_context += f"\n\n--- FARMER PROFILE ---\n"
            system_context += f"Name: {user_context.get('name', 'Farmer')}\n"
            system_context += f"Location: {user_context.get('location', 'Unknown')}\n"
            
            if 'soil' in user_context:
                s = user_context['soil']
                system_context += f"Soil Type: {s.get('type', 'N/A')}\n"
                system_context += f"Land Size: {s.get('landSize', 'N/A')}\n"
                system_context += f"Water Source: {s.get('waterSource', 'N/A')}\n"
            
            if 'sensors' in user_context:
                sn = user_context['sensors']
                system_context += f"\n--- REAL-TIME SOIL SENSORS (Live Data) ---\n"
                system_context += f"Soil pH: {sn.get('ph', 'N/A')} (Ideal: 6.5-7.5)\n"
                system_context += f"Nitrogen (N): {sn.get('n', 'N/A')} mg/kg\n"
                system_context += f"Phosphorus (P): {sn.get('p', 'N/A')} mg/kg\n"
                system_context += f"Potassium (K): {sn.get('k', 'N/A')} mg/kg\n"
                system_context += f"Soil Moisture: {sn.get('moisture', 'N/A')}%\n"
                system_context += f"Note: Use these sensor values to give specific fertilizer or irrigation advice."

        messages_for_ai = [{"role": "system", "content": system_context}]
        
        # Add recent history (last 5 messages) for context
        # (excluding the one we just added to keep logic clean, or include it)
        # OpenAI/Groq expects alternating user/assistant.
        for existing_msg in session.messages[-6:-1]: # Last 5 before current
             messages_for_ai.append({"role": existing_msg.role, "content": existing_msg.content})
        
        # Add current message
        if image:
            messages_for_ai.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": message or "What is in this image?"},
                    {"type": "image_url", "image_url": {"url": image}},
                ]
            })
        else:
            messages_for_ai.append({"role": "user", "content": message})


        # 4. Call AI
        model_names = ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768"]
        if image:
            model_names.insert(0, "llama-3.2-11b-vision-preview")

        text_reply = None
        errors = []

        for model_name in model_names:
            try:
                # Text-only fallback logic
                current_messages = list(messages_for_ai)
                if image and "vision" not in model_name:
                     # Remove image block
                     current_messages[-1] = {"role": "user", "content": f"{message} [User sent image, but model cannot see it]"}

                completion = client.chat.completions.create(
                    messages=current_messages,
                    model=model_name,
                )
                
                text_reply = completion.choices[0].message.content
                if text_reply:
                    break
            except Exception as e:
                errors.append(f"{model_name}: {e}")

        if not text_reply:
            text_reply = f"❌ **Error**: All models failed."

        # 5. Save Bot Response
        bot_msg = ChatMessage(role="assistant", content=text_reply)
        session.messages.append(bot_msg)
        session.updatedAt = datetime.utcnow()

        # 6. Write to DB
        # Convert Pydantic model to dict for Mongo
        session_dict = session.model_dump(by_alias=True, exclude={"id"})
        
        if session_id and ObjectId.is_valid(session_id):
            await db.chat_sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": session_dict}
            )
            final_id = session_id
        else:
            result = await db.chat_sessions.insert_one(session_dict)
            final_id = str(result.inserted_id)

        return {"reply": text_reply, "sessionId": final_id}

    except Exception as e:
        print(f"Groq API Error: {e}")
        return {"reply": f"❌ **Error**: {str(e)}."}

# --- Weather (NASA Power) ---
@router.get("/weather/rainfall")
async def get_rainfall(lat: float, lon: float):
    try:
        # Fetch last 14 days to ensure we get at least one valid data point
        end_date = datetime.now()
        start_date = end_date - timedelta(days=14)
        
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        
        url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude={lon}&latitude={lat}&start={start_str}&end={end_str}&format=JSON"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    return {"rainfall": 0, "source": "NASA (Error)", "date": "N/A", "error": True}
                
                data = await response.json()
                rain_data = data.get('properties', {}).get('parameter', {}).get('PRECTOTCORR', {})
                
                # Find latest valid value (not -999)
                latest_date = None
                latest_val = 0
                
                # Sort dates descending
                sorted_dates = sorted(rain_data.keys(), reverse=True)
                
                for date_str in sorted_dates:
                    val = rain_data[date_str]
                    if val != -999: # NASA uses -999 for missing
                        latest_val = val * 10 # Calibration factor as per user request
                        latest_date = date_str
                        break
                
                return {
                    "rainfall": latest_val,
                    "date": latest_date, # YYYYMMDD
                    "source": "NASA POWER"
                }

    except Exception as e:
        print(f"Rainfall Fetch Error: {e}")
        return {"rainfall": 0, "source": "Error", "date": "N/A"}


        return {"rainfall": 0, "source": "Error", "date": "N/A"}


# --- ML Crop Recommendation ---
class CropPredictionRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

@router.post("/ml/recommend")
async def recommend_crops(data: CropPredictionRequest):
    if not crop_model or not label_encoder:
        return {"error": "Model not loaded", "crops": []}

    try:
        # Prepare Input
        input_data = pd.DataFrame([{
            "N": data.N,
            "P": data.P,
            "K": data.K,
            "temperature": data.temperature,
            "humidity": data.humidity,
            "ph": data.ph,
            "rainfall": data.rainfall
        }])
        
        # Ensure column order
        # input_data = input_data[crop_model.feature_names_in_] 
        # (Assuming model was trained with these exact names, usually safe to just pass DF if names match)

        # Get Probabilities
        proba = crop_model.predict_proba(input_data)[0]
        
        # Get Top 5 Indices
        top_5_indices = np.argsort(proba)[-5:][::-1]
        
        # Get Class Names and Scores
        recommendations = []
        classes = label_encoder.classes_
        
        for idx in top_5_indices:
            crop_name = classes[idx]
            score = proba[idx] * 100 # Percentage
            if score > 0: # Only include if some probability
                recommendations.append({
                    "name": crop_name,
                    "confidence": round(score, 1)
                })
        
        return {"crops": recommendations}

    except Exception as e:
        print(f"ML Prediction Error: {e}")
        return {"error": str(e), "crops": []}

@router.post("/soil-analysis")
async def soil_analysis(payload: dict):
    # Mock Logic
    score = 85
    comments = ["Soil condition is good."]
    
    current_values = payload.get("currentValues", {})
    if current_values.get("nitrogen", 20) < 20:
        score -= 10
        comments.append("Low Nitrogen levels detected. Add Urea.")
        
    return {
        "score": score,
        "comments": comments,
        "recommendedCrops": [
            {"name": "Paddy", "yield": 80, "suitability": 90},
            {"name": "Wheat", "yield": 70, "suitability": 75}
        ]
    }

# --- Active Crop Management ---
class ActiveCropPayload(BaseModel):
    userId: str
    cropData: ActiveCrop

@router.post("/farming/active-crop")
async def plant_active_crop(payload: ActiveCropPayload):
    try:
        user_id = payload.userId
        crop_data = payload.cropData
        
        # Convert Pydantic to Dict
        crop_dict = crop_data.model_dump(by_alias=True)
        
        result = await db.users.update_one(
            {"mobile": user_id}, # Assuming mobile is userId as per auth
            {"$set": {"activeCrop": crop_dict}}
        )
        
        if result.modified_count == 0:
             # Try finding by _id if mobile fails, though auth seems to use mobile
             # But let's assume successful update if no error
             pass

        return {"status": "success", "message": "Crop cycle started"}
    except Exception as e:
        print(f"Planting Error: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/farming/active-crop/{userId}")
async def get_active_crop(userId: str):
    try:
        user = await db.users.find_one({"mobile": userId})
        if user and user.get("activeCrop"):
            return user["activeCrop"]
        return None
    except Exception as e:
        return {"error": str(e)}

@router.delete("/farming/active-crop/{userId}")
async def harvest_active_crop(userId: str):
    try:
        await db.users.update_one(
            {"mobile": userId},
            {"$unset": {"activeCrop": ""}}
        )
        return {"status": "success", "message": "Crop harvested"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
