from django.urls import path
from .views import AlimentoListCreate, AlimentoDetail

urlpatterns = [
    path('alimentos/', AlimentoListCreate.as_view()),
    path('alimentos/<int:pk>/', AlimentoDetail.as_view()),
]