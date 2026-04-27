from rest_framework import generics, permissions
from .models import Alimento, Receita
from .serializers import AlimentoSerializer, ReceitaSerializer


class AlimentoListCreate(generics.ListCreateAPIView):
    serializer_class = AlimentoSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        if instance.numero < 10000:
            # É um alimento da TACO, apenas removemos os dados do usuário
            instance.preco = None
            instance.unidade_medida = None
            instance.save()
        else:
            # Alimento customizado criado pelo usuário, pode deletar de verdade
            instance.delete()
            
class ReceitaListCreate(generics.ListCreateAPIView):
    serializer_class = ReceitaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Receita.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class ReceitaDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReceitaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Receita.objects.filter(usuario=self.request.user)