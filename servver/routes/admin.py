from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import pandas as pd
import io
from datetime import datetime
from models import IrrigationEntry
from main import db

router = APIRouter()

@router.post("/upload-irrigation")
async def upload_irrigation_schedule(file: UploadFile = File(...)):
    """
    Parses an Excel/CSV file and saves irrigation entries to the database.
    Expected Columns: sno, mobile no, aadhaar, user name, irrigation date, start time, end time
    """
    
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload CSV or Excel.")

    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Normalize headers: User provided specific names, but let's be flexible or strict
        # User said: sno, mobile no, aadhaar, user name, irrigation date, start time, end time
        # Let's clean headers: lowercase, strip
        df.columns = [str(c).strip().lower() for c in df.columns]

        # Mapping expected fields to model fields
        # expected: "mobile no", "aadhaar", "irrigation date", "start time", "end time"
        
        required_cols = {'mobile no', 'irrigation date', 'start time', 'end time'}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
             raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_cols)}. Please ensure your Excel file has headers: 'mobile no', 'irrigation date', 'start time', 'end time', 'aadhaar', 'user name'."
            )
        
        inserted_count = 0
        
        # Process rows
        for index, row in df.iterrows():
            # Basic validation
            mobile_val = row.get('mobile no', '')
            mobile = str(mobile_val).strip()
            if mobile.endswith('.0'):
                mobile = mobile[:-2] # Remove .0 from float conversion
            
            if not mobile or mobile == 'nan':
                continue # Skip invalid rows
            
            # --- USER VALIDATION START ---
            # Check if user exists in DB by Mobile or Aadhaar
            # We want to ensure the schedule is linked to a valid registered user.
            
            clean_aadhaar = str(row.get('aadhaar', '')).strip()
            if clean_aadhaar.endswith('.0'):
                clean_aadhaar = clean_aadhaar[:-2]

            # Construct query: Find by Mobile OR Aadhaar
            query_parts = []
            if mobile and len(mobile) >= 10:
                query_parts.append({"mobile": mobile})
            if clean_aadhaar and len(clean_aadhaar) >= 4: # Basic length check
                query_parts.append({"aadhar": clean_aadhaar})
            
            found_user = None
            if query_parts:
                found_user = await db.users.find_one({"$or": query_parts})
            
            if not found_user:
                print(f"Skipping row {index}: User not found for Mobile: {mobile}, Aadhaar: {clean_aadhaar}")
                continue # SKIP if user not found as per requirement
            
            # Use the REGISTERED mobile number from DB to ensure frontend fetching works
            # This handles cases where Excel has Aadhaar but wrong/old mobile, or just ensures consistency
            registered_mobile = found_user.get("mobile")
            # --- USER VALIDATION END ---

            # Date Normalization
            raw_date = row.get('irrigation date', '')
            try:
                # Convert to datetime object then formatted string
                dt = pd.to_datetime(raw_date, dayfirst=True) # Assuming Indian context (DD/MM/YYYY)
                formatted_date = dt.strftime('%Y-%m-%d')
            except:
                # Fallback to raw string if parsing fails, but basic cleanup
                formatted_date = str(raw_date).strip().split(' ')[0] # Split to remove time if present

            # Create Entry Object
            entry = IrrigationEntry(
                sno=int(row.get('sno', 0)) if pd.notna(row.get('sno')) else None,
                mobile=registered_mobile, # Use DB mobile
                aadhaar=clean_aadhaar,
                userName=str(row.get('user name', '')).strip() or found_user.get("fullName", ""),
                date=formatted_date,
                startTime=str(row.get('start time', '')).strip(),
                endTime=str(row.get('end time', '')).strip(),
                status="upcoming" 
            )
            
            # Saving to DB
            # We use exclude_none=True to avoid sending None for optional _id if handled strictly
            # Convert model to dict
            entry_dict = entry.model_dump(by_alias=True, exclude=["id"])
            
            # Upsert? Or just insert? User said "monthly upload", implies new data.
            # Let's simple Insert for now. Duplicate checks can be added if needed (e.g. mobile+date+time)
            await db.irrigation_entries.insert_one(entry_dict)
            inserted_count += 1

        return {
            "success": True, 
            "message": f"Successfully processed {inserted_count} records. (Skipped users not found in DB)",
            "filename": file.filename
        }

    except Exception as e:
        print(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
