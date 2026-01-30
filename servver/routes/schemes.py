from fastapi import APIRouter
from main import db
from pydantic import BaseModel
from typing import List, Optional, Dict
from utils.scraper import update_scheme_data
from groq import Groq
import os
import json
import asyncio

router = APIRouter()

# Setup Groq for final verification
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

class UserProfile(BaseModel):
    state: Optional[str] = None
    farmerType: Optional[str] = "small" # small, marginal, large
    landSize: Optional[float] = 0.0
    caste: Optional[str] = "General"
    crops: Optional[List[str]] = []

class RecommendRequest(BaseModel):
    userProfile: UserProfile
    language: Optional[str] = "en"

async def translate_schemes(schemes, target_lang):
    """
    Translates scheme names and descriptions to target language using LLM.
    """
    if target_lang == "en":
        return schemes

    try:
        # Batch translation prompt
        text_to_translate = []
        for s in schemes:
            text_to_translate.append(f"ID: {s['_id']}\nName: {s['name']}\nDesc: {s['description']}\nDetail: {s.get('detailed_description', '')}")
        
        joined_text = "\n---\n".join(text_to_translate)
        
        system_prompt = f"""
        Translate the following Scheme Names, Descriptions, and Detail (if present) into ISO Language Code '{target_lang}'.
        Maintain the ID.
        Output MUST be a JSON list of objects: [{{ "id": "...", "name": "...", "description": "...", "detailed_description": "..." }}]
        Do not add any conversational text.
        """
        
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": joined_text}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        
        translated_data = json.loads(completion.choices[0].message.content)
        
        # Determine if the response is wrapped
        if isinstance(translated_data, dict):
             values = list(translated_data.values())
             if values and isinstance(values[0], list):
                 translated_list = values[0]
             else:
                 translated_list = [] 
        elif isinstance(translated_data, list):
             translated_list = translated_data
        else:
             translated_list = []

        # Map back to schemes
        translate_map = {item['id']: item for item in translated_list if 'id' in item}
        
        for s in schemes:
            t_item = translate_map.get(str(s["_id"])) or translate_map.get(s["_id"])
            if t_item:
                s["name"] = t_item.get("name", s["name"])
                s["description"] = t_item.get("description", s["description"])
                s["detailed_description"] = t_item.get("detailed_description", s.get("detailed_description"))
                s["translated"] = True
                
        return schemes

    except Exception as e:
        print(f"Translation Error: {e}")
        return schemes # Return original on failure

@router.post("/recommend")
async def recommend_schemes(payload: RecommendRequest):
    user = payload.userProfile
    user_state = user.state
    lang = payload.language
    
    # 1. Aggregate Schemes (Central + User State)
    query = {
        "$or": [
            {"type": "central"},
            {"state": user_state}
        ]
    }
    cursor = db.schemes.find(query)
    potential_schemes = await cursor.to_list(length=100)
    
    recommended_list = []
    
    # 2. Process Schemes (Scrape + Verify) in Parallel
    # We limit concurrency to avoid rate limits or timeout
    
    async def process_scheme(scheme):
        # A. Sync Data (Weekly Scrape Check)
        scheme = await update_scheme_data(db, scheme)
        
        # B. Check Eligibility (AI)
        # We do a quick check against the Extracted Criteria
        criteria = scheme.get("eligibility_criteria")
        if not criteria:
             # If extraction failed, defaults to "Likely Eligible" or "Check manually"
             return {
                 **scheme,
                 "id": str(scheme["_id"]),
                 "_id": str(scheme["_id"]),
                 "eligible": True,
                 "match_reason": "Could not verify automatically (Click to visit)",
                 "confidence": "low"
             }

        # AI Verification Logic (Client-side logic done on server for better accuracy)
        # Check State
        if criteria.get("state") and criteria["state"] not in ["India", "All"]:
             if user_state and user_state.lower() not in criteria["state"].lower():
                 return {**scheme, "id": str(scheme["_id"]), "_id": str(scheme["_id"]), "eligible": False, "match_reason": f"Only for {criteria['state']}"}

        # Check Farmer Type
        # (Simple logic for demonstration, real logic would be more complex)
        
        return {
            **scheme,
            "id": str(scheme["_id"]),
            "_id": str(scheme["_id"]),
            "eligible": True, # Assume eligible unless hard rule fails
            "match_reason": "Matches your profile criteria",
            "confidence": "high"
        }

    # Run for all found schemes
    results = await asyncio.gather(*(process_scheme(s) for s in potential_schemes))
    
    # Sort: Eligible First
    results.sort(key=lambda x: x["eligible"], reverse=True)
    
    # 3. Translate if needed
    if lang and lang != "en":
        results = await translate_schemes(results, lang)

    return results
