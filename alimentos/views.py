from rest_framework import generics
from .models import Alimento
from .serializers import AlimentoSerializer

class AlimentoListCreate(generics.ListCreateAPIView):
    serializer_class = AlimentoSerializer

    def get_queryset(self):
        queryset = Alimento.objects.all()
        nome = self.request.GET.get('nome')

        if nome:
            queryset = queryset.filter(nome__icontains=nome)

        return queryset


class AlimentoUpdate(generics.RetrieveUpdateAPIView):
    queryset = Alimento.objects.all()
    serializer_class = AlimentoSerializer