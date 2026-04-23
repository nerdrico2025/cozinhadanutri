from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import empresa, User


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = empresa
        fields = ['razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'telefone']


class RegisterSerializer(serializers.ModelSerializer):
    razao_social = serializers.CharField(write_only=True)
    nome_fantasia = serializers.CharField(write_only=True)
    cnpj = serializers.CharField(write_only=True)
    inscricao_estadual = serializers.CharField(write_only=True, required=False, allow_blank=True)
    telefone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'telefone']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value

    def validate_cnpj(self, value):
        if empresa.objects.filter(cnpj=value).exists():
            raise serializers.ValidationError("Este CNPJ já está cadastrado.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nome de usuário já está cadastrado.")
        return value

    def create(self, validated_data):
        razao_social = validated_data.pop('razao_social')
        nome_fantasia = validated_data.pop('nome_fantasia')
        cnpj = validated_data.pop('cnpj')
        inscricao_estadual = validated_data.pop('inscricao_estadual', '')
        telefone = validated_data.pop('telefone', '')
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')

        empresa_instance = empresa.objects.create(
            razao_social=razao_social,
            nome_fantasia=nome_fantasia,
            cnpj=cnpj,
            inscricao_estadual=inscricao_estadual,
            telefone=telefone
        )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            empresa=empresa_instance
        )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("E-mail ou senha inválidos.")

        if not user.check_password(password):
            raise serializers.ValidationError("E-mail ou senha inválidos.")

        token = super().get_token(user)

        return {
            'refresh': str(token),
            'access': str(token.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'empresa_id': user.empresa.id if user.empresa else None,
            }
        }


class UserProfileSerializer(serializers.ModelSerializer):
    empresa = EmpresaSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'empresa']