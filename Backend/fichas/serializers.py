from rest_framework import serializers
from .models import ConfiguracaoEtiqueta
from .models import Etiqueta
from .models import FichaTecnica


class LupasSerializer(serializers.Serializer):
    alto_acucar = serializers.BooleanField()
    alto_gordura_saturada = serializers.BooleanField()
    alto_sodio = serializers.BooleanField()


class TabelaNutricionalSerializer(serializers.Serializer):
    gorduras_totais = serializers.FloatField()
    energia_kcal = serializers.FloatField()
    proteinas = serializers.FloatField()
    gorduras_saturadas = serializers.FloatField()
    carboidratos = serializers.FloatField()
    acucares_totais = serializers.FloatField()
    acucares_adicionados = serializers.FloatField()
    fibra_alimentar = serializers.FloatField()
    sodio = serializers.FloatField()


class RotuloSerializer(serializers.Serializer):
    nome_produto = serializers.CharField()
    porcao = serializers.CharField()
    ingredientes = serializers.ListField(
        child=serializers.CharField()
    )
    tabela_nutricional = TabelaNutricionalSerializer()
    lupas = LupasSerializer()


class ConfiguracaoEtiquetaSerializer(serializers.ModelSerializer):

    class Meta:
        model = ConfiguracaoEtiqueta
        fields = [
            'id',
            'nome_personalizado',
            'porcao',
            'informacoes_complementares',
            'tamanho_etiqueta'
        ]


class EtiquetaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Etiqueta
        fields = '__all__'