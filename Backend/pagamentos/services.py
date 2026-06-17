import requests

from django.conf import settings



from django.conf import settings

HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
    "access_token": getattr(settings, "ASAAS_API_KEY", "teste")
}



def criar_cliente(nome, email, cpf_cnpj):

    payload = {
        "name": nome,
        "email": email,
        "cpfCnpj": cpf_cnpj
    }

    response = requests.post(
        f"{settings.ASAAS_URL}/customers",
        json=payload,
        headers=HEADERS
    )

    return response.json()


def criar_pagamento_pix(
    customer_id,
    valor,
    vencimento
):

    payload = {
        "customer": customer_id,
        "billingType": "PIX",
        "value": valor,
        "dueDate": vencimento
    }

    response = requests.post(
        f"{settings.ASAAS_URL}/payments",
        json=payload,
        headers=HEADERS
    )

    return response.json()


def consultar_pagamento(payment_id):

    response = requests.get(
        f"{settings.ASAAS_URL}/payments/{payment_id}",
        headers=HEADERS
    )

    return response.json()