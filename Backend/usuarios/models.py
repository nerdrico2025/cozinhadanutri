from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class Plano(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    preco = models.DecimalField(max_digits=10, decimal_places=2)

    limite_receitas = models.IntegerField(default=5)
    limite_rotulo = models.IntegerField(default=5)
    limite_usuarios = models.IntegerField(default=1)
    permite_exportacao = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

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

    plano = models.ForeignKey(Plano, on_delete=models.SET_NULL, null=True, blank=True, related_name='empresas')

    plano_ativo = models.BooleanField(default=True)
    
    # Endereço (Integrações NF-e / ISS)
    cep = models.CharField(max_length=9, blank=True, null=True)
    logradouro = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    complemento = models.CharField(max_length=150, blank=True, null=True)
    bairro = models.CharField(max_length=150, blank=True, null=True)
    municipio = models.CharField(max_length=150, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)

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

class Assinatura(models.Model):

    STATUS_CHOICES = [
        ("ativa", "Ativa"),
        ("cancelada", "Cancelada"),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    plano = models.ForeignKey(
        Plano,
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ativa"
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.usuario.username} - {self.plano.nome}"
