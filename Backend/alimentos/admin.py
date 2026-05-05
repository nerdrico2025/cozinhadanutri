from django.contrib import admin
from .models import Alimento

# Register your models here.


class AlimentoAdmin(admin.ModelAdmin):
    list_display = ('numero', 'descricao', 'energia_kcal', 'carboidratos', 'proteinas', 'gorduras_totais', 'fibra_alimentar', 'sodio')
    search_fields = ('descricao',)

admin.site.register(Alimento, AlimentoAdmin)