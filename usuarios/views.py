from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema 

from .models import User
from .serializer import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer
)


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
            {"mensagem": f"Instruções de recuperação enviadas para {email}"},
            status=status.HTTP_200_OK
        )