from decimal import Decimal, InvalidOperation

from rest_framework import serializers
from .models import Alimento, Receita, IngredienteReceita

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

class IngredienteReceitaSerializer(serializers.ModelSerializer):
    nome = serializers.ReadOnlyField(source='alimento.descricao')
    tacoId = serializers.ReadOnlyField(source='alimento.numero')

    class Meta:
        model = IngredienteReceita
        fields = ['id', 'alimento', 'quantidade', 'preco_personalizado', 'nome', 'tacoId']

class ReceitaSerializer(serializers.ModelSerializer):
    ingredientes = IngredienteReceitaSerializer(many=True)

    class Meta:
        model = Receita
        fields = ['id', 'nome', 'descricao', 'porcoes', 'margem_lucro', 'ingredientes', 'criado_em']
        read_only_fields = ['id', 'criado_em']

    def create(self, validated_data):
        ingredientes_data = validated_data.pop('ingredientes')
        receita = Receita.objects.create(**validated_data)
        
        for ing_data in ingredientes_data:
            IngredienteReceita.objects.create(receita=receita, **ing_data)
            
        return receita

    def update(self, instance, validated_data):
        ingredientes_data = validated_data.pop('ingredientes', None)
        
        # Update Receita fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if ingredientes_data is not None:
            # Simple approach: delete old ones and create new ones
            instance.ingredientes.all().delete()
            for ing_data in ingredientes_data:
                IngredienteReceita.objects.create(receita=instance, **ing_data)
        
        return instance
        