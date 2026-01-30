from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict
from datetime import datetime
from main import db
from models import IrrigationEntry

router = APIRouter()

@router.get("/my-schedule")
async def get_my_irrigation_schedule(mobile: str):
    """
    Fetch irrigation schedule for a specific user (Farmer).
    Returns Current, Upcoming, and History.
    """
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number is required")

    # Fetch all entries for this mobile
    # Sort by date descending for history, ascending for upcoming? 
    # Let's fetch all and sort in Python or sort by date desc strings
    cursor = db.irrigation_entries.find({"mobile": mobile})
    entries = await cursor.to_list(length=1000)
    
    current_schedule = None
    upcoming = []
    history = []
    
    # Simple logic for categorization
    # Assumption: date is "YYYY-MM-DD", time is "HH:MM AM/PM" or "HH:MM"
    # To compare strictly, we need to parse.
    
    now = datetime.now()
    
    for entry in entries:
        # Normalize fields
        date_str = entry.get("date")
        start_str = entry.get("startTime")
        end_str = entry.get("endTime")
        
        # We need a proper datetime parsing strategy.
        # Excel typically gives YYYY-MM-DD. Time might be "06:00 AM".
        
        try:
            # 1. Parse Date
            # Try ISO first, then others
            try:
                entry_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except:
                 # Fallback/Mock if date format is weird
                 # If parsing fails, push to history if it looks old, or just generic list
                 history.append(serialize_entry(entry, "completed"))
                 continue

            entry_dt_start = None
            entry_dt_end = None
            
            # 2. Parse Time & Combine
            # Logic: Combine with date to get full datetime for comparison
            # Simplified: Just Compare Date for "Upcoming" vs "History", then check time for "Today"
            
            if entry_date < now.date():
                history.append(serialize_entry(entry, "completed"))
            elif entry_date > now.date():
                upcoming.append(serialize_entry(entry, "upcoming"))
            else:
                # IT IS TODAY
                # Check times for Current vs Upcoming Today vs History Today
                # Ideally need to parse "06:00 AM"
                # Using a generic approach for now or Assuming 24h? User request showed "6:00 AM"
                status = "upcoming"
                
                # Mock Check: if we are between start and end?
                # For complexity, let's just create a loose logic or assume active if status is manually set.
                # But requested logic said "particular mobile no... is matched... notified in irrigation turnover card"
                
                # Let's say:
                # IF today matches, check strictly if possible.
                # Else default to 'active' for today for UI demo purposes if logic is hard to perfect without strict format.
                
                # Let's try to parse time to be smart.
                try: 
                    # Try "%I:%M %p" (06:00 AM)
                    t_start = datetime.strptime(start_str, "%I:%M %p").time()
                    t_end = datetime.strptime(end_str, "%I:%M %p").time()
                    
                    dt_start = datetime.combine(entry_date, t_start)
                    dt_end = datetime.combine(entry_date, t_end)
                    
                    if dt_start <= now <= dt_end:
                        status = "active"
                        current_schedule = serialize_entry(entry, "active")
                    elif now < dt_start:
                        status = "upcoming"
                        upcoming.insert(0, serialize_entry(entry, "upcoming"))
                    else:
                        status = "completed"
                        history.insert(0, serialize_entry(entry, "completed"))
                        
                except:
                    # Time parse failed, just say "Today" implies active/upcoming
                    upcoming.append(serialize_entry(entry, "upcoming"))
                    
        except Exception as e:
            print(f"Error parsing entry {entry}: {e}")
            history.append(serialize_entry(entry, "unknown"))

    # If logic didn't find specific active one but we have upcoming today?
    # UI handles displaying 'current' slot.
    
    return {
        "current": current_schedule, # Object or None
        "upcoming": upcoming,        # List
        "history": history           # List
    }

def serialize_entry(entry, status):
    entry["id"] = str(entry["_id"])
    del entry["_id"]
    entry["status"] = status
    return entry
