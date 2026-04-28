from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class empresa(models.Model):
    PLANOS_CHOICES = [
        ('gratis', 'Grátis'),
        ('profissional', 'Profissional'),
        ('empresarial', 'Empresarial'),
    ]

    razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255)
    cnpj = models.CharField(max_length=14, unique=True)
    inscricao_estadual = models.CharField(max_length=14, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    plano = models.CharField(max_length=20, choices=PLANOS_CHOICES, default='gratis')

    def __str__(self):
        return self.razao_social

class User(AbstractUser):
    empresa = models.ForeignKey(empresa, on_delete=models.CASCADE, related_name='usuarios', null=True, blank=True)

class Auditoria(models.Model):
    TIPO_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('cadastro', 'Cadastro'),
        ('receita', 'Receita'),
        ('rotulo', 'Rótulo'),
        ('ingrediente', 'Ingrediente'),
        ('plano', 'Plano'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='atividades')
    acao = models.CharField(max_length=255)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    data_hora = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-data_hora']

    @staticmethod
    def log(usuario, acao, tipo):
        return Auditoria.objects.create(usuario=usuario, acao=acao, tipo=tipo)

    def __str__(self):
        return f'{self.usuario.username} - {self.acao}'

