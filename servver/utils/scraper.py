import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from groq import Groq
import os
import json

# Setup Groq Client
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

def scrape_and_extract(url, scheme_name):
    """
    1. Scrapes the URL text.
    2. Uses LLM to extract eligibility criteria.
    """
    try:
        # A. Basic Scrape
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"Failed to fetch {url}: {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Kill script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = soup.get_text()
        
        # Break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        clean_text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Truncate if too long for LLM context (approx 6000 chars)
        content_for_llm = clean_text[:6000] 

        # B. LLM Extraction
        system_prompt = """
        You are an API that extracts Eligibility Criteria from text.
        Output MUST be a valid JSON object with these keys:
        - "farmerType": (e.g., "small", "marginal", "all")
        - "landSizeMax": (value in acres/hectares if mentioned, else null)
        - "crops": (list of crops if specific, else ["all"])
        - "state": (specific state name if mentioned, else "India")
        - "incomeLimit": (annual income limit if mentioned)
        - "caste": (e.g., "SC/ST", "General", "all")
        - "detailed_description": (A detailed paragraph (approx 50 words) explaining the scheme's benefits, uses, and why a farmer should apply. Do not use bullet points.)
        
        If information is missing, use null or "all".
        """

        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract eligibility for scheme '{scheme_name}' from this text:\n\n{content_for_llm}"}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        
        result_json = json.loads(completion.choices[0].message.content)
        return result_json

    except Exception as e:
        print(f"Scraping Error for {scheme_name}: {e}")
        return None

async def update_scheme_data(db, scheme):
    """
    Checks if scheme needs update (older than 7 days).
    If yes, scrapes and updates DB.
    Returns the scheme document (updated or cached).
    """
    now = datetime.utcnow()
    
    # 1. Check Cache Validity (7 Days)
    last_scraped = scheme.get("last_scraped")
    if last_scraped:
        # Handle if last_scraped is string (from seed) or datetime
        if isinstance(last_scraped, str):
             # Try parsing ISO format if seeded as string, else treat as expired
             try:
                 last_scraped = datetime.fromisoformat(last_scraped.replace('Z', '+00:00'))
             except:
                 last_scraped = None

    if last_scraped and (now - last_scraped) < timedelta(days=7):
        # Cache Hit
        # print(f"Cache Hit for {scheme['name']}")
        return scheme
    
    # 2. Cache Miss - Scrape
    print(f"♻️ Scraping Update for {scheme['name']}...")
    extracted_data = scrape_and_extract(scheme["url"], scheme["name"])
    
    if extracted_data:
        # Update DB
        valid_scheme = {
            "eligibility_criteria": extracted_data,
            "detailed_description": extracted_data.get("detailed_description"),
            "last_scraped": now
        }
        
        await db.schemes.update_one(
            {"_id": scheme["_id"]},
            {"$set": valid_scheme}
        )
        
        # Merge for return
        scheme.update(valid_scheme)
        return scheme
    else:
        # Scrape failed, return old data but don't crash
        return scheme
