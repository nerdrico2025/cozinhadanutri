import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cozinhadanutri.settings')
django.setup()

from usuarios.models import Plano

try:
    p_gratis = Plano.objects.get(nome__icontains='Grátis')
    p_gratis.limite_receitas = 5
    p_gratis.save()
    print("Grátis atualizado")
except Exception as e:
    print(e)

try:
    p_prof = Plano.objects.get(nome__icontains='Profissional')
    p_prof.limite_receitas = 60
    p_prof.save()
    print("Profissional atualizado")
except Exception as e:
    print(e)
