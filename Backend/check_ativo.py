import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cozinhadanutri.settings')
django.setup()

from usuarios.models import User

for u in User.objects.all():
    empresa = u.empresa
    if empresa:
        print(f"User: {u.username}, Plano: {empresa.plano.nome if empresa.plano else 'None'}, Ativo: {empresa.plano_ativo}")
