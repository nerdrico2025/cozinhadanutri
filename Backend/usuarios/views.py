from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from drf_spectacular.utils import extend_schema

from django.http import HttpResponse

from .models import (
    User,
    Auditoria
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


class TrocarPlanoView(APIView):

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

        novo_plano = request.data.get("plano")

        planos_validos = [
            "gratis",
            "profissional",
            "empresarial"
        ]

        if novo_plano not in planos_validos:

            return Response(
                {
                    "detail": "Plano inválido."
                },
                status=400
            )

        if not empresa_usuario.plano_ativo:

            return Response(
                {
                    "detail": "Plano desativado."
                },
                status=400
            )

        plano_antigo = empresa_usuario.plano

        empresa_usuario.plano = novo_plano

        empresa_usuario.save()

        Auditoria.log(
            usuario=request.user,
            acao=f'Trocou plano de {plano_antigo} para {novo_plano}',
            tipo='plano'
        )

        return Response(
            {
                "message": "Plano alterado.",
                "de": plano_antigo,
                "para": novo_plano
            }
        )