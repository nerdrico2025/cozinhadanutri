from rest_framework import serializers
from .models import FichaTecnica, IngredienteFichaTecnica


class IngredienteFichaTecnicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngredienteFichaTecnica
        fields = '__all__'


class FichaTecnicaSerializer(serializers.ModelSerializer):
    ingredientes = IngredienteFichaTecnicaSerializer(
        source='ingredientefichatecnica_set',
        many=True,
        read_only=True
    )

    class Meta:
        model = FichaTecnica
        fields = '__all__'