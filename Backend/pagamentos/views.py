from rest_framework.views import APIView
from rest_framework.response import Response


class CreatePreferenceView(APIView):
    def post(self, request):
        return Response({"message": "ok"})


class PaymentStatusView(APIView):
    def get(self, request, payment_id):
        return Response({"status": "ok"})


class MercadoPagoWebhookView(APIView):
    def post(self, request):
        return Response({"received": True})