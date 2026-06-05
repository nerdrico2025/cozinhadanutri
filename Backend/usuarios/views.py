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
from pagamentos.services import sdk


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
        empresa = user.empresa

        import time
        suffix = f"_deleted_{int(time.time())}"
        user.is_active = False
        user.username = f"{user.username}{suffix}"[:150]
        user.email = f"{user.email}{suffix}"[:254]
        user.save()

        if empresa:
            empresa.plano_ativo = False
            empresa.save()

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
        empresa = user.empresa

        import time
        suffix = f"_deleted_{int(time.time())}"
        user.is_active = False
        user.username = f"{user.username}{suffix}"[:150]
        user.email = f"{user.email}{suffix}"[:254]
        user.save()

        if empresa:
            empresa.plano_ativo = False
            empresa.save()

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


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'id'

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        
        is_active = request.data.get('is_active')
        if is_active is not None:
            user.is_active = is_active
            user.save()
            
        plano_str = request.data.get('plano')
        if plano_str and user.empresa:
            from .models import Plano
            plano = None
            if plano_str == 'gratis':
                plano = Plano.objects.filter(id=1).first() or Plano.objects.filter(nome__iexact='grátis').first()
            elif plano_str == 'profissional':
                plano = Plano.objects.filter(id=2).first() or Plano.objects.filter(nome__iexact='profissional').first()
            elif plano_str == 'empresarial':
                plano = Plano.objects.filter(id=3).first() or Plano.objects.filter(nome__iexact='empresarial').first()
            
            if plano:
                user.empresa.plano = plano
                user.empresa.save()

        # Log audit log
        from .models import Auditoria
        Auditoria.log(
            usuario=user,
            acao=f"Usuário atualizado pelo administrador. Ativo: {user.is_active}, Plano: {user.empresa.plano.nome if user.empresa and user.empresa.plano else 'Nenhum'}",
            tipo='plano'
        )

        return Response(AdminUserSerializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        empresa = user.empresa
        
        import time
        suffix = f"_deleted_{int(time.time())}"
        user.is_active = False
        user.username = f"{user.username}{suffix}"[:150]
        user.email = f"{user.email}{suffix}"[:254]
        user.save()

        if empresa:
            empresa.plano_ativo = False
            empresa.save()
            
        return Response(
            {"message": "Conta encerrada com sucesso (soft delete)."},
            status=status.HTTP_200_OK
        )



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
    """
    Consulta dados de um CNPJ na API ReceitaWS.
    Endpoint público (AllowAny) pois é usado na tela de cadastro,
    antes do usuário possuir um token JWT.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, cnpj):
        import re
        import requests as http_requests
        from django.conf import settings

        # Sanitiza: aceita apenas dígitos
        cnpj_digits = re.sub(r'\D', '', cnpj)
        if len(cnpj_digits) != 14:
            return Response(
                {"status": "ERROR", "message": "CNPJ deve conter 14 dígitos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = getattr(settings, 'RECEITAWS_API_TOKEN', None)

        headers = {
            "Accept": "application/json",
            "User-Agent": "CozinhaDaNutri/1.0",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"https://www.receitaws.com.br/v1/cnpj/{cnpj_digits}"

        try:
            resp = http_requests.get(url, headers=headers, timeout=10)
        except http_requests.exceptions.ConnectionError as exc:
            print(f"[ReceitaWS] ConnectionError: {exc}")
            return Response(
                {"status": "ERROR", "message": "Não foi possível conectar à ReceitaWS. Verifique sua conexão."},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except http_requests.exceptions.Timeout:
            print("[ReceitaWS] Timeout ao consultar CNPJ.")
            return Response(
                {"status": "ERROR", "message": "A consulta ao ReceitaWS expirou. Tente novamente."},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )

        print(f"[ReceitaWS] HTTP {resp.status_code} para CNPJ {cnpj_digits}")

        # Rate-limit da ReceitaWS (plano gratuito: 3 req/min)
        if resp.status_code == 429:
            return Response(
                {"status": "ERROR", "message": "Muitas consultas em pouco tempo. Aguarde alguns segundos e tente novamente."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Tenta ler o JSON independente do status HTTP.
        # A ReceitaWS retorna HTTP 4xx com corpo JSON {"status":"ERROR","message":"..."}
        # para CNPJs inválidos/não encontrados — não devemos tratar isso como 502.
        try:
            data = resp.json()
        except ValueError:
            print(f"[ReceitaWS] Resposta não-JSON: {resp.text[:200]}")
            return Response(
                {"status": "ERROR", "message": f"ReceitaWS retornou erro inesperado (HTTP {resp.status_code})."},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # ReceitaWS retorna status "ERROR" para CNPJs inexistentes/inválidos
        if data.get("status") == "ERROR":
            return Response(
                {"status": "ERROR", "message": data.get("message", "CNPJ não encontrado.")},
                status=status.HTTP_404_NOT_FOUND
            )

        # Mapeia para o formato esperado pelo frontend
        return Response({
            "status": "OK",
            "cnpj": data.get("cnpj", cnpj),
            "nome": data.get("nome", ""),
            "fantasia": data.get("fantasia", ""),
            "email": data.get("email", ""),
            "telefone": data.get("telefone", ""),
            "situacao": data.get("situacao", ""),
            "tipo": data.get("tipo", ""),
            "porte": data.get("porte", ""),
            "abertura": data.get("abertura", ""),
            "natureza_juridica": data.get("natureza_juridica", ""),
            "logradouro": data.get("logradouro", ""),
            "numero": data.get("numero", ""),
            "complemento": data.get("complemento", ""),
            "bairro": data.get("bairro", ""),
            "municipio": data.get("municipio", ""),
            "uf": data.get("uf", ""),
            "cep": data.get("cep", ""),
        })
    

class CreatePreferenceView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        plano = request.data.get("plano", "Premium")

        preference_data = {
            "items": [
                {
                    "title": f"Plano {plano}",
                    "quantity": 1,
                    "currency_id": "BRL",
                    "unit_price": 49.90
                }
            ]
        }

        result = sdk.preference().create(
            preference_data
        )

        preference = result["response"]

        return Response({
            "preference_id": preference["id"]
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
 