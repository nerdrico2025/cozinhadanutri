from django.contrib import admin

from .models import (
    empresa,
    User,
    Auditoria,
    Plano,
)

admin.site.register(empresa)
admin.site.register(User)
admin.site.register(Auditoria)
admin.site.register(Plano)