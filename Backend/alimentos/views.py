from rest_framework import generics
from .models import Alimento
from .serializers import AlimentoSerializer


class AlimentoListCreate(generics.ListCreateAPIView):
    serializer_class = AlimentoSerializer

    def get_queryset(self):
        queryset = Alimento.objects.all()
        descricao = self.request.GET.get('descricao')

        if descricao:
            queryset = queryset.filter(descricao__icontains=descricao)

        return queryset


class AlimentoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Alimento.objects.all()
    serializer_class = AlimentoSerializer