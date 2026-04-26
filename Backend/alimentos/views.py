from rest_framework import generics
from .models import Alimento
from .serializers import AlimentoSerializer


class AlimentoListCreate(generics.ListCreateAPIView):
    serializer_class = AlimentoSerializer

    def get_queryset(self):
        queryset = Alimento.objects.all()
        descricao = self.request.GET.get('descricao')
        salvos = self.request.GET.get('salvos')

        if descricao:
            queryset = queryset.filter(descricao__icontains=descricao)
            
        if salvos == 'true':
            queryset = queryset.filter(preco__isnull=False)

        return queryset


class AlimentoDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Alimento.objects.all()
    serializer_class = AlimentoSerializer

    def perform_destroy(self, instance):
        if instance.numero < 10000:
            # É um alimento da TACO, apenas removemos os dados do usuário
            instance.preco = None
            instance.unidade_medida = None
            instance.save()
        else:
            # Alimento customizado criado pelo usuário, pode deletar de verdade
            instance.delete()