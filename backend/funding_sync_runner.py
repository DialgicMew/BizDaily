# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from funding_service import bulk_save_funding_data

bulk_save_funding_data()