from rest_framework.views import APIView
from rest_framework.response import Response

from .services import (
    criar_cliente,
    criar_pagamento_pix,
    consultar_pagamento,
    consultar_qr_code_pix,
    criar_pagamento_indefinido,
)


class CreatePaymentView(APIView):

    def post(self, request):

        nome = request.data.get("nome")
        email = request.data.get("email")
        cpf = request.data.get("cpf")
        valor = request.data.get("valor")
        metodo = request.data.get("metodoPagamento")

        cliente = criar_cliente(
            nome,
            email,
            cpf
        )

        if "errors" in cliente:
            return Response(cliente, status=400)

        if metodo == "pix":
            pagamento = criar_pagamento_pix(
                cliente["id"],
                valor,
                "2026-12-31"
            )
            
            if "errors" in pagamento:
                return Response(pagamento, status=400)
                
            qr_data = consultar_qr_code_pix(pagamento["id"])
            return Response({
                "paymentId": pagamento.get("id"),
                "pixQrCode": qr_data.get("encodedImage"),
                "pixCopyPaste": qr_data.get("payload")
            })
        else:
            pagamento = criar_pagamento_indefinido(
                cliente["id"],
                valor,
                "2026-12-31"
            )
            
            if "errors" in pagamento:
                return Response(pagamento, status=400)
                
            return Response({
                "paymentId": pagamento.get("id"),
                "checkoutUrl": pagamento.get("invoiceUrl")
            })


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