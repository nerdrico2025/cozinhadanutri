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

    def validate_nome(self, value):
        if value is None:
            raise serializers.ValidationError("O campo 'nome' é obrigatório.")

        value = value.strip()
        if not value:
            raise serializers.ValidationError("O campo 'nome' não pode estar vazio.")

        if Alimento.objects.filter(nome=value).exists():
            raise serializers.ValidationError("Já existe um alimento com este nome.")

        queryset = Alimento.objects.filter(nome__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError("Já existe um alimento com este nome.")

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
            'energia_kj',
            'proteina',
            'lipideos',
            'colesterol',
            'carboidrato',
            'fibra_alimentar',
            'cinzas',
            'calcio',
            'magnesio',
            'manganes',
            'fosforo',
            'ferro',
            'sodio',
            'potassio',
            'cobre',
            'zinco',
            'retinol',
            're',
            'rae',
            'tiamina',
            'riboflavina',
            'piridoxina',
            'niacina',
            'vitamina_c',
            'saturados',
            'monoinsaturados',
            'poliinsaturados',
            'AG12_0',
            'AG14_0',
            'AG16_0',
            'AG18_0',
            'AG20_0',
            'AG22_0',
            'AG24_0',
            'AG14_1',
            'AG16_1',
            'AG18_1',
            'AG20_1',
            'AG18_2_n6',
            'AG18_3_n3',
            'AG20_4',
            'AG20_5',
            'AG22_5',
            'AG22_6',
            'AG18_1t',
            'AG18_2t',
            'triptofano',
            'treonina',
            'isoleucina',
            'leucina',
            'lisina',
            'metionina',
            'cistina',
            'fenilalanina',
            'tirosina',
            'valina',
            'arginina',
            'histidina',
            'alanina',
            'ac_aspartico',
            'ac_glutamico',
            'glicina',
            'prolina',
            'serina',
        ]

        for campo in campos:
            if campo in data:
                data[campo] = self.validar_campo_negativo(campo, data[campo])

        energia_kcal = data.get('energia_kcal')
        energia_kj = data.get('energia_kj')

        if energia_kcal is None:
            raise serializers.ValidationError("O campo 'energia_kcal' não deve ser vazio.")

        if energia_kj is None:
            raise serializers.ValidationError("O campo 'energia_kj' não deve ser vazio.")
                        
        return data
        