from bs4 import BeautifulSoup
import requests

url = "https://www.commodityonline.com/mandiprices/onion/maharashtra/lasalgaon"
try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    table = soup.find('table')
    if table:
        headers = [th.get_text().strip() for th in table.find_all('th')]
        print("Headers found:", headers)
        
        # Print first row of data
        rows = table.find_all('tr')
        if len(rows) > 1:
            first_data = [td.get_text().strip() for td in rows[1].find_all('td')]
            print("First Row Data:", first_data)
    else:
        print("No table found")

except Exception as e:
    print(e)
