from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from django.http import HttpResponse
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser
from .models import User
from .serializer import AdminUserSerializer
from .models import Auditoria
from .serializer import AuditoriaSerializer

from .models import (
    User,
    Auditoria,
    Plano
)

from .serializer import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    EmpresaPlanoSerializer
)


def teste(request):
    return HttpResponse("API funcionando")


class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):

    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveAPIView):

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class DeleteUserView(generics.DestroyAPIView):

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def destroy(self, request, *args, **kwargs):

        user = self.get_object()

        user.delete()

        return Response(
            {"message": "Usuário deletado com sucesso."},
            status=status.HTTP_200_OK
        )


class DeleteUserByIdView(generics.DestroyAPIView):

    queryset = User.objects.all()

    permission_classes = [IsAuthenticated]

    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):

        user = self.get_object()

        user.delete()

        return Response(
            {"message": "Usuário deletado com sucesso."},
            status=status.HTTP_200_OK
        )


class EsqueciSenhaView(APIView):

    @extend_schema(
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "email": {"type": "string"}
                }
            }
        },
        responses={200: None}
    )
    def post(self, request):

        email = request.data.get("email")

        if not email:

            return Response(
                {"erro": "Informe um email."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "mensagem": f"Instruções de recuperação enviadas para {email}"
            },
            status=status.HTTP_200_OK
        )


# LISTAR PLANOS
class PlanoListView(generics.ListAPIView):

    queryset = Plano.objects.filter(ativo=True)
    permission_classes = [permissions.IsAuthenticated]


# ASSINATURA ATUAL
class MeuPlanoView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if not request.user.empresa:

            return Response(
                {
                    "detail": "Usuário sem empresa."
                },
                status=404
            )

        empresa_usuario = request.user.empresa

        serializer = EmpresaPlanoSerializer(
            empresa_usuario
        )

        return Response(serializer.data)


# ASSINAR PLANO
class AssinarPlanoView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        if not request.user.empresa:

            return Response(
                {
                    "detail": "Usuário sem empresa."
                },
                status=404
            )

        empresa_usuario = request.user.empresa

        plano_id = request.data.get("plano")

        if not plano_id:

            return Response(
                {
                    "detail": "Plano não enviado."
                },
                status=400
            )

        try:

            plano = Plano.objects.get(id=plano_id)

        except Plano.DoesNotExist:

            return Response(
                {
                    "detail": "Plano não encontrado."
                },
                status=404
            )

        empresa_usuario.plano = plano
        empresa_usuario.plano_ativo = True

        empresa_usuario.save()

        Auditoria.log(
            usuario=request.user,
            acao=f'Assinou o plano {plano.nome}',
            tipo='plano'
        )

        serializer = EmpresaPlanoSerializer(
            empresa_usuario
        )

        return Response(serializer.data)


# TROCAR PLANO
class TrocarPlanoView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "plano": {
                        "type": "integer"
                    }
                },
                "required": ["plano"]
            }
        }
    )
    def patch(self, request):

        if not request.user.empresa:

            return Response(
                {
                    "detail": "Usuário sem empresa."
                },
                status=404
            )

        empresa_usuario = request.user.empresa

        plano_id = request.data.get("plano")

        if not plano_id:

            return Response(
                {
                    "detail": "Plano não enviado."
                },
                status=400
            )

        from .models import Plano

        try:
            plano = Plano.objects.get(id=plano_id)

        except Plano.DoesNotExist:

            return Response(
                {
                    "detail": "Plano inválido."
                },
                status=400
            )

        empresa_usuario.plano = plano

        empresa_usuario.save()

        Auditoria.log(
            usuario=request.user,
            acao=f'Trocou plano para {plano.nome}',
            tipo='plano'
        )

        return Response(
            {
                "message": "Plano alterado.",
                "plano": plano.nome
            }
        )


class AdminUsersView(ListAPIView):

    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]



class AdminActivitiesView(ListAPIView):

    queryset = Auditoria.objects.all()
    serializer_class = AuditoriaSerializer
    permission_classes = [IsAdminUser]

class FAQView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response([
            {
                "pergunta": "Como criar uma ficha técnica?",
                "resposta": "Acesse o módulo de fichas."
            },
            {
                "pergunta": "Como gerar rótulo?",
                "resposta": "Abra uma ficha técnica."
            }
        ])
    
class SupportConfigView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        return Response({
            "email": "suporte@cozinhadanutri.com",
            "telefone": "(81) 99999-9999",
            "horario": "08:00 às 18:00"
        })
    
class ConsultaCNPJView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, cnpj):

        return Response({
            "cnpj": cnpj,
            "razao_social": "Consulta não implementada",
            "status": "pendente"
        })
    
class PaymentPreferenceView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        return Response({
            "detail": "Mercado Pago ainda não implementado"
        })


class PaymentStatusView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        return Response({
            "payment_id": id,
            "status": "pending"
        })
    
class UpdateProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request):

        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
    
class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "refresh_token": {"type": "string"}
                },
                "required": ["refresh_token"]
            }
        },
        responses={200: None}
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            
            if not refresh_token:
                return Response(
                    {"detail": "O refresh_token é obrigatório para efetuar o logout."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
           
            from rest_framework_simplejwt.tokens import RefreshToken
            
            
            token = RefreshToken(refresh_token)
            token.blacklist()

          
            Auditoria.log(
                usuario=request.user,
                acao='Logout',
                tipo='logout'
            )

            return Response(
                {"message": "Logout realizado com sucesso no servidor."},
                status=status.HTTP_200_OK
            )

        except Exception:
          
            return Response(
                {"detail": "Token inválido ou já expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )
 