from .models import Assinatura
import mercadopago
from django.conf import settings


def trocar_plano(usuario, novo_plano):

    assinatura_atual = Assinatura.objects.filter(
        usuario=usuario,
        status="ativa"
    ).first()

    if not assinatura_atual:

        raise Exception(
            "Usuário não possui assinatura ativa."
        )

    if not novo_plano.ativo:

        raise Exception(
            "Plano inativo."
        )

    assinatura_atual.status = "cancelada"
    assinatura_atual.save()

    nova_assinatura = Assinatura.objects.create(
        usuario=usuario,
        plano=novo_plano,
        status="ativa"
    )

    return nova_assinatura


sdk = mercadopago.SDK(
    settings.MERCADO_PAGO_ACCESS_TOKEN
)