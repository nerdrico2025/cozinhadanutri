from django.urls import path
from .views import AlimentoListCreate, AlimentoUpdate

urlpatterns = [
    path('alimentos/', AlimentoListCreate.as_view()),
    path('alimentos/<int:pk>/', AlimentoUpdate.as_view()),
]