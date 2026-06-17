from rest_framework.views import APIView
from rest_framework.response import Response

from .services import (
    criar_cliente,
    criar_pagamento_pix,
    consultar_pagamento
)


class CreatePaymentView(APIView):

    def post(self, request):

        nome = request.data.get("nome")
        email = request.data.get("email")
        cpf = request.data.get("cpf")
        valor = request.data.get("valor")

        cliente = criar_cliente(
            nome,
            email,
            cpf
        )

        pagamento = criar_pagamento_pix(
            cliente["id"],
            valor,
            "2026-12-31"
        )

        return Response(pagamento)


class PaymentStatusView(APIView):

    def get(self, request, payment_id):

        pagamento = consultar_pagamento(
            payment_id
        )

        return Response(pagamento)


class AsaasWebhookView(APIView):

    def post(self, request):

        evento = request.data

        print(evento)

        return Response({
            "received": True
        })