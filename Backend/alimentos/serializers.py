from decimal import Decimal, InvalidOperation

from rest_framework import serializers
from .models import Alimento

class AlimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alimento
        fields = '__all__'

    def validate_numero(self, value):
        if value is None:
            raise serializers.ValidationError("O campo 'numero' é obrigatório.")

        if value <= 0:
            raise serializers.ValidationError("O campo 'numero' deve ser maior que zero.")

        queryset = Alimento.objects.filter(numero=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um alimento com este número.")

        return value

    def validate_descricao(self, value):
        if value is None:
            raise serializers.ValidationError("O campo 'descricao' é obrigatório.")

        value = value.strip()
        if not value:
            raise serializers.ValidationError("O campo 'descricao' não pode estar vazio.")


        queryset = Alimento.objects.filter(descricao__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um alimento com esta descrição.")

        return value

    def validar_campo_negativo(self, campo, valor):
        if valor is None or valor == '':
            return valor

        try:
            valor = Decimal(valor)
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError(f"O campo '{campo}' deve ser um número válido.")

        if valor < 0:
            raise serializers.ValidationError(f"O campo '{campo}' não pode ser negativo.")
        return valor

    def validate(self, data):
        campos = [
            'umidade',
            'energia_kcal',
            'proteina',
            'lipideos',
            'carboidrato',
            'acucares_totais',
            'acucares_adicionados',
            'fibra_alimentar',
            'sodio',
            'vitaminas',
            'minerais',
            'saturados',
            'AG18_1t',
            'AG18_2t',
        ]

        for campo in campos:
            if campo in data:
                data[campo] = self.validar_campo_negativo(campo, data[campo])

        energia_kcal = data.get('energia_kcal')

        if energia_kcal is None:
            raise serializers.ValidationError("O campo 'energia_kcal' não deve ser vazio.")

                        
        return data
        