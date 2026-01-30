import requests
from bs4 import BeautifulSoup

def inspect_page(commodity_slug, state="tamil-nadu", district="madurai"):
    url = f"https://www.commodityonline.com/mandiprices/{commodity_slug}/{state}/{district}"
    print(f"\n--- Checking {commodity_slug} ---")
    print(f"URL: {url}")
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        print(f"Page Title: {soup.title.string.strip() if soup.title else 'No Title'}")
        
        tables = soup.find_all('table')
        print(f"Found {len(tables)} tables.")
        
        for i, table in enumerate(tables[:3]): # Inspect first 3 tables
            rows = table.find_all('tr')
            if rows:
                first_row_text = rows[0].get_text().strip().replace("\n", " ")[:50]
                print(f"Table {i} Header: {first_row_text}...")
                if len(rows) > 1:
                     second_row_text = rows[1].get_text().strip().replace("\n", " ")[:50]
                     print(f"Table {i} Row 1: {second_row_text}...")
            print("-" * 10)

    except Exception as e:
        print(f"Error: {e}")

inspect_page("rice")
inspect_page("wheat")
