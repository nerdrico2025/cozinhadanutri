from rest_framework import generics, permissions
from .models import Alimento, Receita
from .serializers import AlimentoSerializer, ReceitaSerializer
from usuarios.models import Auditoria


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

    def perform_create(self, serializer):
        alimento = serializer.save()
        if alimento.numero >= 10000:
             Auditoria.log(self.request.user, f"Cadastrou novo ingrediente: {alimento.descricao}", "ingrediente")


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

    def create(self, request, *args, **kwargs):
        empresa = getattr(request.user, 'empresa', None)
        limite = 5  # Default limit for free/no-plan users
        
        if empresa and getattr(empresa, 'plano', None):
            if empresa.plano.limite_receitas is not None:
                limite = empresa.plano.limite_receitas
            else:
                limite = float('inf') # If limite is truly None, it might mean unlimited
                
        if limite != float('inf'):
            total_receitas = Receita.objects.filter(usuario=request.user).count()
            if total_receitas >= limite:
                from rest_framework.response import Response
                from rest_framework import status
                return Response(
                    {"erro": "LIMIT_REACHED", "message": "Limite de receitas atingido. Por favor, atualize seu plano para criar mais receitas."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        receita = serializer.save(usuario=self.request.user)
        Auditoria.log(self.request.user, f"Criou a receita: {receita.nome}", "receita")


class ReceitaDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReceitaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Receita.objects.filter(usuario=self.request.user)