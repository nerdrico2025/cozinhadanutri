from rest_framework import serializers


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