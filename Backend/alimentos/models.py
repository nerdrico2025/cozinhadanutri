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
    
    umidade = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    energia_kcal = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    proteina = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    lipideos = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    carboidrato = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    acucares_totais = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    acucares_adicionados = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    fibra_alimentar = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    sodio = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    vitaminas = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    minerais = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    saturados = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

    AG18_1t = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    AG18_2t = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)

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

class Receita(models.Model):
    usuario = models.ForeignKey('usuarios.User', on_delete=models.CASCADE, related_name='receitas')
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    porcoes = models.IntegerField(default=1)
    margem_lucro = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Receita'
        ordering = ['-criado_em']

    def __str__(self):
        return self.nome

class IngredienteReceita(models.Model):
    receita = models.ForeignKey(Receita, on_delete=models.CASCADE, related_name='ingredientes')
    alimento = models.ForeignKey(Alimento, on_delete=models.CASCADE)
    quantidade = models.DecimalField(max_digits=10, decimal_places=2) # em gramas ou unidades
    preco_personalizado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # preco por 100g ou unidade

    def __str__(self):
        return f'{self.alimento.descricao} em {self.receita.nome}'