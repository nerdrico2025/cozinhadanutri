from django.urls import path
from .views import AlimentoListCreate, AlimentoDetail, ReceitaListCreate, ReceitaDetail

urlpatterns = [
    path('alimentos/', AlimentoListCreate.as_view()),
    path('alimentos/<int:pk>/', AlimentoDetail.as_view()),
    path('receitas/', ReceitaListCreate.as_view()),
    path('receitas/<int:pk>/', ReceitaDetail.as_view()),
]