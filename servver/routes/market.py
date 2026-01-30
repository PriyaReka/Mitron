import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter
from typing import List, Optional
import concurrent.futures
import re

router = APIRouter()

# Commodities to fetch
COMMODITIES = [
    {"id": "rice", "name": "Rice", "slug": "rice"},
    {"id": "wheat", "name": "Wheat", "slug": "wheat"},
    {"id": "tomato", "name": "Tomato", "slug": "tomato"},
    {"id": "onion", "name": "Onion", "slug": "onion"},
    {"id": "potato", "name": "Potato", "slug": "potato"},
    {"id": "cotton", "name": "Cotton", "slug": "cotton"},
    {"id": "maize", "name": "Maize", "slug": "maize"},
    {"id": "sugarcane", "name": "Sugarcane", "slug": "sugarcane"},
    {"id": "mustard", "name": "Mustard", "slug": "mustard-seeds"},
]

def clean_price(price_str):
    """Extracts numeric price from string."""
    try:
        # Remove currency symbols and commas
        clean = re.sub(r'[^\d.]', '', price_str)
        return float(clean)
    except:
        return 0

def fetch_commodity_price(commodity, state, district):
    """
    Fetches price for a single commodity from CommodityOnline.
    Tries District URL first, then State URL.
    """
    state_slug = state.lower().replace(" ", "-")
    district_slug = district.lower().replace(" ", "-")
    
    # Try District Level
    url = f"https://www.commodityonline.com/mandiprices/{commodity['slug']}/{state_slug}/{district_slug}"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=3)
        
        if response.status_code != 200:
            # Fallback to State Level
            url = f"https://www.commodityonline.com/mandiprices/{commodity['slug']}/{state_slug}"
            response = requests.get(url, headers=headers, timeout=3)
            
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                tables = soup.find_all('table')
                
                target_table = None
                
                # Smart Table Search: Find the table that looks like a Price Table
                for table in tables:
                    # Check headers
                    headers = [th.get_text().strip().lower() for th in table.find_all('th')]
                    header_text = " ".join(headers)
                    
                    if "market" in header_text and "price" in header_text:
                        target_table = table
                        break
                
                # Fallback: If no smart match, try the second table (often the main one) or first if only 1
                if not target_table and len(tables) > 0:
                    target_table = tables[1] if len(tables) > 1 else tables[0]

                if target_table:
                    # Assuming standard structure: Date | ... | Price | ...
                    # We usually want the first row of data
                    rows = target_table.find_all('tr')
                    if len(rows) > 1:
                        # Find the first valid data row (sometimes row 1 is empty or filter)
                         cells = rows[1].find_all('td')
                    # Heuristic: Pick the highest number in the row that looks like a price
                    # usually col 3 or 4
                    potential_prices = []
                    for cell in cells:
                        text = cell.get_text().strip()
                        # Find all numbers in the text (integer or float)
                        matches = re.findall(r'\b\d+(?:[\.,]\d+)?\b', text)
                        for match in matches:
                            try:
                                # Replace comma if present (e.g. 1,200)
                                val = float(match.replace(',', ''))
                                # Filter Sanity Check for Quintal Prices:
                                # - Must be > 100 (exclude small numbers/dates like 1, 31)
                                # - Must be < 30000 (exclude massive concatenated dates like 20241225)
                                if 100 < val < 30000:
                                    potential_prices.append(val)
                            except:
                                continue
                    
                    if potential_prices:
                        # Max price is usually a safe bet for "Model Price" or "Max Price"
                        # Max price is usually a safe bet for "Model Price" or "Max Price"
                        price_per_quintal = max(potential_prices)
                        price_per_kg = round(price_per_quintal / 100, 2)
                        
                        return {
                            "commodity": commodity['id'],
                            "name": commodity['name'],
                            "price": price_per_kg,
                            "change": 0, # Cannot calculate change easily without history
                            "unit": "₹/kg",
                            "market": f"{district} Mandi" if district_slug in url else f"{state} Avg",
                            "grade": "FAQ"
                        }
    except Exception as e:
        print(f"Error fetching {commodity['name']}: {e}")
        
    return None

@router.get("/prices")
async def get_market_prices(state: str = "Tamil Nadu", district: str = "Madurai"):
    """
    Returns real-time market prices scraped from the web.
    """
    results = []
    
    # Use ThreadPool to fetch concurrently to minimize wait time
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_commodity = {
            executor.submit(fetch_commodity_price, c, state, district): c 
            for c in COMMODITIES
        }
        
        for future in concurrent.futures.as_completed(future_to_commodity):
            data = future.result()
            if data:
                results.append(data)
                
    # If scraping failed completely, return a fallback (marked as such)
    # but try REALLY hard to return real data.
    if not results:
        return [
            {"commodity": "error", "name": "Data Unavailable", "price": 0, "market": "Offline", "unit": "-"}
        ]
        
    return results
