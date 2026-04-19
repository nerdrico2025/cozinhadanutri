from django.db import models

class Alimento(models.Model):
    nome = models.CharField(max_length=150)
    unidade = models.CharField(max_length=20)
    preco = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.nome