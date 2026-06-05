import mercadopago
from django.conf import settings

sdk = mercadopago.SDK(
    settings.MERCADO_PAGO_ACCESS_TOKEN
)