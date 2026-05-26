from django.db import models
from django.conf import settings

# Create your models here.

class FichaTecnica(models.Model):
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True)

    rendimento = models.FloatField(null=True, blank=True)
    modo_preparo = models.TextField(blank=True)

    custo_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = 'Ficha Técnica'
        verbose_name_plural = 'Fichas Técnicas'
    

class IngredienteFichaTecnica(models.Model):
    ficha = models.ForeignKey(FichaTecnica, on_delete=models.CASCADE)
    alimento = models.ForeignKey('alimentos.Alimento', on_delete=models.CASCADE)

    quantidade = models.DecimalField(max_digits=10, decimal_places=2)
    unidade = models.CharField(max_length=50)

    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    
    
    def __str__(self):
        return f"{self.alimento} - {self.quantidade}"
    

    class Meta:
        verbose_name = 'Ingrediente da Ficha Técnica'
        verbose_name_plural = 'Ingredientes das Fichas Técnicas'

class ConfiguracaoEtiqueta(models.Model):

    ficha = models.OneToOneField(
        FichaTecnica,
        on_delete=models.CASCADE,
        related_name='configuracao_etiqueta'
    )

    nome_personalizado = models.CharField(
        max_length=255,
        blank=True
    )

    porcao = models.CharField(
        max_length=50,
        default='100g'
    )

    informacoes_complementares = models.TextField(
        blank=True
    )

    tamanho_etiqueta = models.CharField(
        max_length=50,
        default='medio'
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Configuração - {self.ficha.nome}'
    
class Etiqueta(models.Model):
    ficha = models.OneToOneField(
        FichaTecnica,
        on_delete=models.CASCADE
    )

    nome_personalizado = models.CharField(
        max_length=255,
        blank=True
    )

    tamanho_porcao = models.CharField(
        max_length=50,
        default='100g'
    )

    informacoes_complementares = models.TextField(
        blank=True
    )

    mostrar_sodio = models.BooleanField(default=True)
    mostrar_acucar = models.BooleanField(default=True)

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Etiqueta - {self.ficha.nome}"