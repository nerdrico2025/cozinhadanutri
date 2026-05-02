from django.db import models

# Create your models here.

# lista do banco de dados do alimento, cada campo é um nutriente, e o valor é a quantidade do nutriente presente em 100g do alimento

UNIDADES = [('g', 'gramas'),
            ('kg', 'quilograma'),
            ('ml', 'mililitro'),
            ('l', 'litro'),
            ('un', 'unidade'),
            ]

class Alimento(models.Model):
    numero = models.IntegerField(unique=True)
    descricao = models.CharField(max_length=255)
    
    energia_kcal = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    carboidratos = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    acucares_totais = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    acucares_adicionados = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    proteinas = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    gorduras_totais = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    gorduras_saturadas = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    gorduras_trans = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    fibra_alimentar = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    sodio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    preco = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unidade_medida = models.CharField(max_length=10, choices=UNIDADES, null=True, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Alimento'
        ordering = ['numero', 'descricao']
        verbose_name = 'Alimento'
        verbose_name_plural = 'Alimentos'

    def __str__(self):
        return f'{self.numero} - {self.descricao}'