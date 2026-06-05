import os
from dotenv import load_dotenv

load_dotenv()

MERCADO_PAGO_ACCESS_TOKEN = os.getenv(
    "MERCADO_PAGO_ACCESS_TOKEN"
)
print("TOKEN:", MERCADO_PAGO_ACCESS_TOKEN)