from decimal import Decimal

from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Etiqueta
from .serializers import EtiquetaSerializer

from .models import (
    FichaTecnica,
    IngredienteFichaTecnica,
    ConfiguracaoEtiqueta,
)

from .serializers import (
    TabelaNutricionalSerializer,
    RotuloSerializer,
    ConfiguracaoEtiquetaSerializer
)


class TabelaNutricionalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        ficha = get_object_or_404(FichaTecnica, id=id)

        # validar dono da ficha
        if ficha.usuario != request.user:
            return Response(
                {"erro": "Acesso negado"},
                status=403
            )

        ingredientes = IngredienteFichaTecnica.objects.filter(
            ficha=ficha
        )

        dados = {
            "gorduras_totais": Decimal('0'),
            "energia_kcal": Decimal('0'),
            "proteinas": Decimal('0'),
            "gorduras_saturadas": Decimal('0'),
            "carboidratos": Decimal('0'),
            "acucares_totais": Decimal('0'),
            "acucares_adicionados": Decimal('0'),
            "fibra_alimentar": Decimal('0'),
            "sodio": Decimal('0'),
        }

        for ingrediente in ingredientes:

            alimento = ingrediente.alimento
            quantidade = ingrediente.quantidade

            fator = quantidade / Decimal('100')

            dados["gorduras_totais"] += (
                alimento.gorduras_totais or 0
            ) * fator

            dados["energia_kcal"] += (
                alimento.energia_kcal or 0
            ) * fator

            dados["proteinas"] += (
                alimento.proteinas or 0
            ) * fator

            dados["gorduras_saturadas"] += (
                alimento.gorduras_saturadas or 0
            ) * fator

            dados["carboidratos"] += (
                alimento.carboidratos or 0
            ) * fator

            dados["acucares_totais"] += (
                alimento.acucares_totais or 0
            ) * fator

            dados["acucares_adicionados"] += (
                alimento.acucares_adicionados or 0
            ) * fator

            dados["fibra_alimentar"] += (
                alimento.fibra_alimentar or 0
            ) * fator

            dados["sodio"] += (
                alimento.sodio or 0
            ) * fator

        serializer = TabelaNutricionalSerializer(dados)

        return Response(serializer.data)


class RotuloView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        ficha = get_object_or_404(FichaTecnica, id=id)

        # validar dono da ficha
        if ficha.usuario != request.user:
            return Response(
                {"erro": "Acesso negado"},
                status=403
            )

        ingredientes = IngredienteFichaTecnica.objects.filter(
            ficha=ficha
        )

        tabela = {
            "gorduras_totais": Decimal('0'),
            "energia_kcal": Decimal('0'),
            "proteinas": Decimal('0'),
            "gorduras_saturadas": Decimal('0'),
            "carboidratos": Decimal('0'),
            "acucares_totais": Decimal('0'),
            "acucares_adicionados": Decimal('0'),
            "fibra_alimentar": Decimal('0'),
            "sodio": Decimal('0'),
        }

        lista_ingredientes = []

        for ingrediente in ingredientes:

            alimento = ingrediente.alimento
            quantidade = ingrediente.quantidade

            lista_ingredientes.append(
                alimento.descricao
            )

            fator = quantidade / Decimal('100')

            tabela["gorduras_totais"] += (
                alimento.gorduras_totais or 0
            ) * fator

            tabela["energia_kcal"] += (
                alimento.energia_kcal or 0
            ) * fator

            tabela["proteinas"] += (
                alimento.proteinas or 0
            ) * fator

            tabela["gorduras_saturadas"] += (
                alimento.gorduras_saturadas or 0
            ) * fator

            tabela["carboidratos"] += (
                alimento.carboidratos or 0
            ) * fator

            tabela["acucares_totais"] += (
                alimento.acucares_totais or 0
            ) * fator

            tabela["acucares_adicionados"] += (
                alimento.acucares_adicionados or 0
            ) * fator

            tabela["fibra_alimentar"] += (
                alimento.fibra_alimentar or 0
            ) * fator

            tabela["sodio"] += (
                alimento.sodio or 0
            ) * fator

        dados = {
            "nome_produto": ficha.nome,
            "porcao": "100g",
            "ingredientes": lista_ingredientes,
            "tabela_nutricional": tabela
        }

        serializer = RotuloSerializer(dados)

        return Response(serializer.data)
    
class ConfiguracaoEtiquetaView(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request, id):

        ficha = get_object_or_404(
            FichaTecnica,
            id=id
        )

        if ficha.usuario != request.user:
            return Response(
                {"erro": "Acesso negado"},
                status=403
            )

        configuracao, created = (
            ConfiguracaoEtiqueta.objects.get_or_create(
                ficha=ficha
            )
        )

        serializer = ConfiguracaoEtiquetaSerializer(
            configuracao,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)
    
class EtiquetaView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, id):

        etiqueta = get_object_or_404(Etiqueta, id=id)

        if etiqueta.ficha.usuario != request.user:
            return Response(
                {"erro": "Acesso negado"},
                status=403
            )

        serializer = EtiquetaSerializer(
            etiqueta,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=400
        )