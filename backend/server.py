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
    try: 
        url = 'https://www.ebay.com/sch/i.html?_dkr=1&iconV2Request=true&_blrs=recall_filtering&_ssn=urbud&store_name=urbud&_sop=10&_oac=1&_ipg=240'
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # ORIGINAL selector (kept)
            ebay_listings = soup.find_all('div', class_='s-item__wrapper clearfix')

            # ✅ ADD: also grab new "s-card" layout items and append
            s_card_listings = soup.find_all('li', class_=lambda c: c and c.startswith('s-card'))
            ebay_listings = ebay_listings + s_card_listings

            supabase_listings_data = supabase.table('listings').select('listing_site_reference_id').eq('listing_site','ebay').execute().data
            existing_listings = [listing['listing_site_reference_id'] for listing in supabase_listings_data]
            
            listing_upserts = []
            listing_histories_inserts = []

            for listing in ebay_listings:
                # Try ORIGINAL structure first
                item_info = listing.find('div', class_='s-item__info clearfix') if hasattr(listing, "find") else None

                # Anchor / href / id
                anchor = None
                href = None
                if item_info:
                    anchor = item_info.find('a', class_='s-item__link')
                if not anchor:
                    # ✅ ADD: fallback for s-card layout
                    anchor = listing.find('a', href=True)
                if anchor:
                    href = anchor.get('href')

                listing_id = None
                if href:
                    m = re.search(r'/(\d+)(?:\?|$)', href)
                    if m:
                        listing_id = m.group(1)
                if not listing_id:
                    # If we can't find an id, skip this card
                    continue

                if listing_id == '123456':
                    continue
                if listing_id in existing_listings:
                    continue

                # Title
                item_title_elem = item_info.find('div', class_='s-item__title') if item_info else None
                if not item_title_elem:
                    # ✅ ADD: s-card title fallback
                    item_title_elem = listing.find('div', class_='s-card__title')
                title = item_title_elem.text.strip() if item_title_elem else None
                if title and title.startswith("New Listing"):
                    title = title.replace("New Listing", "").strip()

                serial_number = parse_serial_number_from_title(title) if title else None

                # Price (new first, then old)
                listing_price_elem = None
                if item_info:
                    listing_price_elem = item_info.find('span', class_='s-card__price')
                    if not listing_price_elem:
                        listing_price_elem = item_info.find('span', class_='s-item__price')
                if not listing_price_elem:
                    # ✅ ADD: search at card level as well
                    listing_price_elem = listing.find('span', class_='s-card__price') or listing.find('span', class_='s-item__price')
                listing_price = (
                    listing_price_elem.text.strip().replace('$', '').replace(',', '')
                    if listing_price_elem else None
                )

                # Listing date (keep original, with safe fallback to card-level search)
                listing_date_elem = None
                if item_info:
                    listing_date_elem = item_info.find('span', class_='s-item__dynamic s-item__listingDate')
                if not listing_date_elem:
                    listing_date_elem = listing.find('span', class_='s-item__dynamic s-item__listingDate')
                listed_at_dt = listing_date_to_timestamp(listing_date_elem)
                listed_at = listed_at_dt.isoformat() if listed_at_dt else None

                # Thumbnail (keep original, add fallback)
                thumbnail_url = None
                image_info = listing.find('div', class_='s-item__image-section') if hasattr(listing, "find") else None
                if image_info:
                    thumbnail_wrapper_elem = image_info.find('div', class_='s-item__image-wrapper')
                    thumbnail_url_elem = thumbnail_wrapper_elem.find('img') if thumbnail_wrapper_elem else None
                    if thumbnail_url_elem and thumbnail_url_elem.get('src'):
                        thumbnail_url = thumbnail_url_elem['src']
                if not thumbnail_url:
                    # ✅ ADD: generic img fallback for s-card
                    img_elem = listing.find('img')
                    if img_elem and img_elem.get('src'):
                        thumbnail_url = img_elem['src']

                id = "ebay_" + listing_id
                listing_data = {
                    "id": id,
                    "listing_site": "ebay",
                    "listing_site_reference_id": listing_id,
                    "title": title,
                    "serial_number": serial_number,
                    "listing_date": listed_at,
                    "listing_price": listing_price,
                    "thumbnail_url": thumbnail_url,
                    "listing_url": href,
                    "status": "Active",
                    "created_at": datetime.now().isoformat()
                }
                listing_upserts.append(listing_data)

                history_data = {
                    "listing_id": id,
                    "status": "Active"
                }
                listing_histories_inserts.append(history_data)

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
