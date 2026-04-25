from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.cache import cache
from django.conf import settings
import random
import urllib.request
import json

from .models import User
from .serializer import RegisterSerializer, CustomTokenObtainPairSerializer, UserProfileSerializer
from datetime import timedelta


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            response.set_cookie(
                key='access_token',
                value=access_token,
                expires=timedelta(minutes=60),
                secure=False, # Deve ser True em produção (HTTPS)
                httponly=True,
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                expires=timedelta(days=1),
                secure=False,
                httponly=True,
                samesite='Lax'
            )
            
            # Remove os tokens do payload JSON para maior segurança
            if 'access' in response.data:
                del response.data['access']
            if 'refresh' in response.data:
                del response.data['refresh']
                
        return response

class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
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

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    print(">>> RECEBIDO REQUEST PARA RESET:", repr(email), flush=True)
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        print(">>> USUARIO ENCONTRADO:", user.email, flush=True)
    except User.DoesNotExist:
        print(">>> USUARIO NAO ENCONTRADO PARA O EMAIL:", repr(email), flush=True)
        # Para evitar enumeração de usuários, retornamos 200 de qualquer forma
        return Response({'message': 'Code sent if email exists'}, status=200)
        
    code = f"{random.randint(0, 999999):06d}"
    cache.set(f"pwd_reset_{email}", code, timeout=900) # 15 min de expiração
    print(">>> GERADO CODIGO:", code, flush=True)
    
    # INTEGRAÇÃO EMAILJS VIA REST API (Mais seguro que no frontend)
    emailjs_service_id = getattr(settings, 'EMAILJS_SERVICE_ID', 'service_cozinhadanutri') # Substitua pelo seu ID
    emailjs_template_id = getattr(settings, 'EMAILJS_TEMPLATE_ID', 'template_reset_senha') # Substitua pelo seu ID
    emailjs_public_key = getattr(settings, 'EMAILJS_PUBLIC_KEY', 'sua_chave_publica') # Substitua pela sua chave publica
    emailjs_private_key = getattr(settings, 'EMAILJS_PRIVATE_KEY', 'sua_chave_privada') # Substitua pela chave privada (opcional, mas recomendado)
    
    # Se você configurou a chave pública, tentamos enviar o email
    if emailjs_public_key != 'sua_chave_publica':
        try:
            payload = {
                "service_id": emailjs_service_id,
                "template_id": emailjs_template_id,
                "user_id": emailjs_public_key,
                "accessToken": emailjs_private_key if emailjs_private_key != 'sua_chave_privada' else None,
                "template_params": {
                    "to_email": email,
                    "codigo": code
                }
            }
            req = urllib.request.Request(
                "https://api.emailjs.com/api/v1.0/email/send",
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            )
            try:
                response = urllib.request.urlopen(req)
                print("EmailJS Success:", response.read().decode('utf-8'))
            except urllib.error.HTTPError as e:
                print("EmailJS HTTP Error:", e.code, e.read().decode('utf-8'))
            except Exception as e:
                print("EmailJS General Error:", e)
        except Exception as e:
            print("Erro crítico antes do EmailJS:", e)
    else:
        # Fallback local para testes
        print("\n" + "="*50)
        print(f"CÓDIGO DE RECUPERAÇÃO PARA {email}: {code}")
        print("="*50 + "\n")
    
    return Response({'message': 'Code sent'}, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_reset_code(request):
    email = request.data.get('email')
    code = request.data.get('codigo')
    
    stored_code = cache.get(f"pwd_reset_{email}")
    if stored_code and stored_code == code:
        return Response({'message': 'Valid code'}, status=200)
        
    return Response({'error': 'Invalid code'}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    code = request.data.get('codigo')
    new_password = request.data.get('novaSenha')
    
    stored_code = cache.get(f"pwd_reset_{email}")
    if not stored_code or stored_code != code:
        return Response({'error': 'Invalid code'}, status=400)
        
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        cache.delete(f"pwd_reset_{email}")
        return Response({'message': 'Password updated'}, status=200)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=400)