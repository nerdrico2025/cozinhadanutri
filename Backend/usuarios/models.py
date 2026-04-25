from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class empresa(models.Model):
    razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=14, unique=True)
    inscricao_estadual = models.CharField(max_length=14, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    senha = models.CharField(max_length=255)

def __str__(self):
    return self.razao_social

class User(AbstractUser):
    empresa = models.ForeignKey(empresa, on_delete=models.CASCADE, related_name='usuarios', null=True, blank=True)

