from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, List, Dict, Annotated
from bson import ObjectId
from datetime import datetime

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]

class MongoModel(BaseModel):
    # The _id field will be mapped to `id` in the model
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

# --- Shared Sub-Models ---
class Location(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    taluk: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None

class Demographics(BaseModel):
    age: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None # SC/ST/OBC/General
    incomeRange: Optional[str] = None

class FarmingProfile(BaseModel):
    farmerType: Optional[str] = None # Marginal, Small, etc.
    landArea: Optional[str] = None
    landOwnership: Optional[str] = None # Owned, Leased
    landRecordType: Optional[str] = None # Patta/Chitta
    irrigationType: Optional[str] = None
    primaryCrop: Optional[str] = None
    secondaryCrops: Optional[str] = None
    farmingSeason: Optional[str] = None
    farmingSubtypes: Optional[List[str]] = None # Dairy, Poultry etc
    organicFarming: Optional[str] = None

class FinancialProfile(BaseModel):
    hasBankAccount: Optional[str] = None
    bankLinkedAadhaar: Optional[str] = None
    kccStatus: Optional[str] = None # Yes/No/Applied
    loanTaken: Optional[str] = None
    loanAmount: Optional[str] = None

# --- Land Models ---
class Dimensions(BaseModel):
    length: Optional[float] = None
    width: Optional[float] = None

class Area(BaseModel):
    totalArea: Optional[float] = None
    areaUnit: Optional[str] = None # acres, hectares

class SoilProfile(BaseModel):
    soilType: Optional[str] = None
    soilPH: Optional[str] = None
    organicMatter: Optional[str] = None
    drainageCondition: Optional[str] = None
    irrigationAvailable: Optional[str] = None
    soilDepth: Optional[str] = None
    previousCrop: Optional[str] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    soilMoisture: Optional[float] = None
    rainfall: Optional[float] = None

class Land(MongoModel):
    userId: str # Reference to User ID as string
    landType: Optional[str] = None # wetland, dryland
    measurementType: Optional[str] = None # dimensions, area
    dimensions: Optional[Dimensions] = None
    area: Optional[Area] = None
    soilProfile: Optional[SoilProfile] = None
    location: Optional[Location] = None

class ActiveCrop(BaseModel):
    cropId: str
    cropName: str
    varietyId: str
    varietyName: str
    startDate: datetime = Field(default_factory=datetime.utcnow)
    harvestDate: Optional[datetime] = None
    image: Optional[str] = None

# --- User Models ---
class UserBase(BaseModel):
    mobile: str
    aadhar: Optional[str] = None
    fullName: Optional[str] = None
    language: Optional[str] = "en"
    role: Optional[str] = "farmer"
    onboardingCompleted: bool = False
    
    # Detailed Profile
    location: Optional[Location] = None
    demographics: Optional[Demographics] = None
    farming: Optional[FarmingProfile] = None
    financials: Optional[FinancialProfile] = None
    soilProfile: Optional[SoilProfile] = None # Keeping for backward compat / direct access
    activeCrop: Optional[ActiveCrop] = None

class UserCreate(UserBase):
    pass

class UserDB(UserBase, MongoModel):
    pass

# --- Scheme Models ---
class Scheme(MongoModel):
    name: str
    description: Optional[str] = None
    url: Optional[str] = None  # URL for scraping
    type: Optional[str] = "central" # central or state
    state: Optional[str] = None # State name if type is state
    eligibility_criteria: Optional[Dict] = None # AI Extracted rules
    detailed_description: Optional[str] = None # Detailed summary for voice
    last_scraped: Optional[datetime] = None
    active: bool = True

# --- Chat Models ---

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(MongoModel):
    userId: str
    title: Optional[str] = "New Chat"
    messages: List[ChatMessage] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class IrrigationEntry(MongoModel):
    sno: Optional[int] = None
    mobile: str
    aadhaar: Optional[str] = None
    userName: Optional[str] = None
    date: str # YYYY-MM-DD format commonly used in Excel
    startTime: str
    endTime: str
    department: str = "District Irrigation Office"
    officer: str = "Admin"
    status: str = "upcoming" # upcoming, active, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)
