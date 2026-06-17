from django.urls import path

from .views import (
    CreatePaymentView,
    PaymentStatusView,
    AsaasWebhookView
)

urlpatterns = [

    path(
        "payment/",
        CreatePaymentView.as_view(),
        name="payment"
    ),

    path(
        "status/<str:payment_id>/",
        PaymentStatusView.as_view(),
        name="payment-status"
    ),

    path(
        "webhook/",
        AsaasWebhookView.as_view(),
        name="asaas-webhook"
    ),
]