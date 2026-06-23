from django.contrib import admin
from .models import FichaTecnica, IngredienteFichaTecnica

# Register your models here.

class FichaTecnicaAdmin(admin.ModelAdmin):
    exclude = ('usuario',)

    def save_model(self,request, obj, form, change):
        if not obj.pk:
            obj.usuario = request.user
        super().save_model(request, obj, form, change)

admin.site.register(FichaTecnica, FichaTecnicaAdmin)
admin.site.register(IngredienteFichaTecnica)