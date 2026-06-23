import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cozinhadanutri.settings')
django.setup()

from usuarios.models import Plano

planos = Plano.objects.all()
for p in planos:
    print(f"ID: {p.id}, Nome: {p.nome}, Limite: {p.limite_receitas}, Limite Rotulo: {p.limite_rotulo}")
