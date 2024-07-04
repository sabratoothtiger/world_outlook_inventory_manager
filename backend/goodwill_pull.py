import requests
import pandas
from datetime import datetime, timedelta
from io import BytesIO
from supabase import create_client
import os
""" 
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv() 
"""

# Initialize Supabase
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Goodwill
GOODWILL_TOKEN = os.environ.get('GOODWILL_TOKEN')

def fetch_goodwill_shipped_order_file():
    url = "https://buyerapi.shopgoodwill.com/api/ShippedOrders/ExportAllCSV"
    headers = {
        "method": "POST",
        "Authorization": f"Bearer {GOODWILL_TOKEN}"
    }

    response = requests.post(url, headers=headers)
    if response.status_code != 200:
        print("Unexpected Content-Type")
        return
    
    content_type = response.headers.get('Content-Type')
    if content_type != 'application/ms-excel':
        print(f"Failed to fetch data. Status code: {response.status_code}")
        return
    
    excel_file = BytesIO(response.content)
    csv_data = pandas.read_excel(excel_file)
    # Columns: Order #,Order Date,Item Id,Item,Category,Quantity,Item Price,Item End Time,Payment Date,Payment Amount,Tracking #,Tax,Additional Fee,Shipping Price,Handling Price,Donation,Shipped Date,Seller
    return csv_data
 
 
def filter_recent_orders(csv_data):
    today = datetime.today()
    thirty_days_ago = today - timedelta(days=30)
    
    csv_data['Order Date'] = pandas.to_datetime(csv_data['Order Date'], errors='coerce')
    
    # Drop rows where 'Order Date' is NaT
    csv_data = csv_data.dropna(subset=['Order Date'])
    
    recent_orders_csv = csv_data[csv_data['Order Date'] >= thirty_days_ago]
    
    return recent_orders_csv


def convert_to_float(financial_str):
    return round(sum(float(x.replace('$', '')) for x in financial_str.split('$') if x), 2)


def parse_order_data(csv_data):
    orders = {}
    current_time = datetime.now().isoformat()
    
    for _, row in csv_data.iterrows():
        order_id = str(row['Order #'])
        if order_id not in orders:
            orders[order_id] = {
                'id': 'goodwill_' + order_id,
                'created_at': current_time,
                'last_updated_at': current_time,
                'supplier': 'goodwill',
                'supplier_reference_id': order_id,
                'order_date': row['Order Date'].isoformat(),
                'tracking_number': row['Tracking #'].replace('_x0009_', ''),
                'status': 'Shipped',
                'acquisition_cost': convert_to_float(row['Item Price']) + convert_to_float(row['Tax']) + convert_to_float(row['Shipping Price']) + convert_to_float(row['Handling Price']) + convert_to_float(row['Donation']) + convert_to_float(row['Additional Fee']),
                'item_count': 0,
            }
        else:
            orders[order_id]['acquisition_cost'] += convert_to_float(row['Item Price'])
    return orders

def fetch_existing_order_ids():
    response = supabase.table("purchase_orders").select("supplier_reference_id").execute()
    existing_ids = {item['supplier_reference_id'] for item in response.data}
    return existing_ids


def insert_to_supabase(orders, existing_order_ids):    
    new_orders = []
    new_orders_histories = []
    for order_id in orders:
        if order_id in existing_order_ids:
            continue  # Skip existing orders
        new_orders.append(orders[order_id])
        history_data = {
            "purchase_order_id": orders[order_id]['id'],
            "status": orders[order_id]['status'],
            "changed_at": orders[order_id]['last_updated_at'],
        }
        new_orders_histories.append(history_data)
    supabase.table("purchase_orders").insert(new_orders).execute()
    supabase.table("purchase_order_histories").insert(new_orders_histories).execute()


def pull_new_purchase_orders_from_goodwill():
    csv_data = fetch_goodwill_shipped_order_file()
    recent_orders_csv = filter_recent_orders(csv_data)
    orders = parse_order_data(recent_orders_csv)
    existing_order_ids = fetch_existing_order_ids()
    insert_to_supabase(orders, existing_order_ids)

pull_new_purchase_orders_from_goodwill()