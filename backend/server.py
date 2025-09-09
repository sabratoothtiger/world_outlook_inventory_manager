import os
from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
from supabase import create_client
from flask_cors import CORS
from goodwill_pull import pull_new_purchase_orders_from_goodwill
""" 
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv() 
"""


app = Flask(__name__)
CORS(app, origins='*')

# Initialize Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Goodwill
GOODWILL_TOKEN = os.environ.get('GOODWILL_TOKEN')



def parse_serial_number_from_title(title):
    if '#' in title:
        serial_number = title.split('#')[-1].strip()
    else:
        serial_number = None
    return serial_number

def listing_date_to_timestamp(listing_date_elem):
    listing_date_str = listing_date_elem.text.strip() if listing_date_elem else None
    listing_date = None
    if listing_date_str:
        try:
            listing_date = datetime.strptime(listing_date_str, '%b-%d %H:%M')
        except ValueError as e:
            print("Error parsing listing date:", e)
    if listing_date:
        current_date = datetime.now()
        if listing_date.month > current_date.month:
            listing_date = listing_date.replace(year=current_date.year - 1)
        else:
            listing_date = listing_date.replace(year=current_date.year)
    return listing_date

@app.route('/api/fetch_ebay_listings', methods=['GET', 'POST'])
def fetch_ebay_listings():
    """
    Fetches eBay listings using multiple fallback selectors during parsing
    for resiliency to eBay's HTML structure changes.
    """
    url = "https://www.ebay.com/sch/i.html?_dkr=1&iconV2Request=true&_blrs=recall_filtering&_ssn=urbud&store_name=urbud&_sop=10&_oac=1&_ipg=240"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Multiple selectors for listing containers (in order of preference)
            listing_selectors = [
                'div.s-item__wrapper.clearfix',
                'li[class*="s-card"]',
                '.s-item',
                '[data-testid*="item"]',
                '.srp-results .s-item'
            ]
            
            supabase_listings_data = supabase.table('listings').select('listing_site_reference_id').eq('listing_site','ebay').execute().data
            existing_listings = [listing['listing_site_reference_id'] for listing in supabase_listings_data]
                
            listing_upserts = []
            listing_histories_inserts = []
            listing_containers = None
            
            # Find the best working selector for listing containers
            for selector in listing_selectors:
                listing_containers = soup.select(selector)
                if listing_containers and len(listing_containers) > 5:  # Ensure we have meaningful results
                    break
            
            if not listing_containers:
                return []
        
            for listing in listing_containers:
                try:
                    # Extract title with multiple fallback selectors
                    title_selectors = [
                        '.s-item__title',
                        '.s-card__title', 
                        '[data-testid="item-title"]',
                        '.it-ttl',
                        'h3'
                    ]
                    
                    title = None
                    for selector in title_selectors:
                        title_elem = listing.select_one(selector)
                        if title_elem and title_elem.get_text(strip=True):
                            title = title_elem.get_text(strip=True)
                            # Remove "New Listing" prefix if present
                            title = re.sub(r'^New Listing\s*', '', title)
                            break
                    
                    # Extract price with multiple fallback selectors
                    price_selectors = [
                        '.s-card__price',
                        '.s-item__price',
                        '[data-testid="item-price"]',
                        '.notranslate'
                    ]
                    
                    price = None
                    for selector in price_selectors:
                        price_elem = listing.select_one(selector)
                        if price_elem and price_elem.get_text(strip=True):
                            price_text = price_elem.get_text(strip=True)
                            # Extract numeric price value
                            price_match = re.search(r'[\d,]+\.?\d*', price_text.replace('$', '').replace(',', ''))
                            if price_match:
                                try:
                                    price = float(price_match.group())
                                    break
                                except ValueError:
                                    continue
                    
                    # Extract link and listing ID with multiple fallback selectors
                    link_selectors = [
                        '.s-item__link',
                        'a[href*="/itm/"]',
                        'a[href*="ebay.com"]'
                    ]
                    
                    link = None
                    listing_id = None
                    for selector in link_selectors:
                        link_elem = listing.select_one(selector)
                        if link_elem and link_elem.get('href'):
                            link = link_elem.get('href')
                            # Extract listing ID from various URL patterns
                            id_patterns = [
                                r'/(\d{12,15})(?:\?|$)',  # Standard eBay item ID
                                r'/itm/[^/]+/(\d+)',      # Alternative format
                                r'ebay\.com/.*?(\d{12,15})',  # General pattern
                            ]
                            
                            for pattern in id_patterns:
                                match = re.search(pattern, link)
                                if match:
                                    listing_id = match.group(1)
                                    if listing_id in existing_listings or listing_id == '123456':
                                        listing_id = None
                                        continue
                                    break
                            
                            if listing_id:
                                break
                    
                    # Extract thumbnail with multiple fallback selectors
                    image_selectors = [
                        '.s-item__image img',
                        '.s-card__image img',
                        '[data-testid="item-image"] img',
                        'img'
                    ]
                    
                    thumbnail_url = None
                    for selector in image_selectors:
                        img_elem = listing.select_one(selector)
                        if img_elem and img_elem.get('src'):
                            src = img_elem.get('src')
                            # Skip data URIs and placeholder images
                            if not src.startswith('data:') and 'placeholder' not in src.lower():
                                thumbnail_url = src
                                break
                    
                    # Extract listing date (try multiple approaches)
                    date_posted = None
                    try:
                        # Look for date elements
                        date_selectors = [
                            '.s-item__time',
                            '.s-item__time-left',
                            '[data-testid="item-time"]',
                            '.time-left'
                        ]
                        
                        for selector in date_selectors:
                            date_elem = listing.select_one(selector)
                            if date_elem:
                                date_text = date_elem.get_text(strip=True)
                                # Parse various date formats
                                if 'day' in date_text.lower() or 'hour' in date_text.lower():
                                    date_posted = datetime.now()  # Use current date for relative times
                                break
                        
                        if not date_posted:
                            date_posted = datetime.now()  # Fallback to current date
                            
                    except Exception as e:
                        date_posted = datetime.now()
                
                    # Only add listing if we have essential data
                    if title and listing_id and price is not None:
                        id = "ebay_" + listing_id
                        listing_data = {
                            'id': id,
                            'listing_site': 'ebay',
                            'listing_site_reference_id': listing_id,
                            'title': title,
                            'serial_number': parse_serial_number_from_title(title),
                            'listing_date': date_posted.isoformat() if date_posted else None,
                            'listing_price': price,
                            'thumbnail_url': thumbnail_url or '',
                            'listing_url': link or '',
                            'status': 'Active',
                            'created_at': datetime.now().isoformat()
                        }
                        listing_upserts.append(listing_data)

                        history_data = {
                            'listing_id': id,
                            'status': 'Active'
                        }
                        listing_histories_inserts.append(history_data)
                except Exception as e:
                    print("Error processing listing:", e)
                    continue
            if listing_upserts:
                supabase.table('listings').upsert(listing_upserts).execute()
                if listing_histories_inserts:
                    supabase.table('listing_histories').insert(listing_histories_inserts).execute()
            return jsonify({'status': 'success', 'uploaded': len(listing_upserts)})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to retrieve eBay listings'})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/fetch_goodwill_purchase_orders', methods=['GET', 'POST'])
def fetch_goodwill_purchase_orders():
    pull_new_purchase_orders_from_goodwill()
    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(debug=True, port=5001)
