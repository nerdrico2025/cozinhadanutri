from django.urls import path
from .views import (
    CreatePreferenceView,
    PaymentStatusView,
    MercadoPagoWebhookView
)

urlpatterns = [
    path(
        "preference/",
        CreatePreferenceView.as_view(),
        name="payment-preference"
    ),

    path(
        "status/<str:payment_id>/",
        PaymentStatusView.as_view(),
        name="payment-status"
    ),

    path(
        "webhook/",
        MercadoPagoWebhookView.as_view(),
        name="payment-webhook"
    ),
]