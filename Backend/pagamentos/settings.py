import os
from dotenv import load_dotenv

load_dotenv()

ASAAS_API_KEY = os.getenv("ASAAS_API_KEY")

ASAAS_URL = "https://api.asaas.com/v3"
