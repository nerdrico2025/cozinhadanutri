from django.contrib import admin
from .models import Alimento

# Register your models here.


class AlimentoAdmin(admin.ModelAdmin):
    list_display = ('numero', 'descricao', 'energia_kcal', 'carboidratos', 'acucares_totais', 'acucares_adicionados', 'proteinas', 'gorduras_totais', 'gorduras_saturadas', 'gorduras_trans', 'fibra_alimentar', 'sodio')
    search_fields = ('descricao',)

admin.site.register(Alimento, AlimentoAdmin)