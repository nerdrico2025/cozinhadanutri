from django.contrib import admin

from .models import (
    empresa,
    User,
    Auditoria
)

admin.site.register(empresa)
admin.site.register(User)
admin.site.register(Auditoria)