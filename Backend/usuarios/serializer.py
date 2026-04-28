from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import empresa, User


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = empresa
        fields = ['razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'telefone', 'plano']
        read_only_fields = ['cnpj', 'plano']


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
    empresa = EmpresaSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'empresa', 'is_superuser']
        
    def update(self, instance, validated_data):
        empresa_data = validated_data.pop('empresa', None)
        
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        
        # Trata atualização de senha se for enviada
        if 'password' in self.initial_data and self.initial_data['password']:
            instance.set_password(self.initial_data['password'])
            
        instance.save()
        
        if empresa_data and instance.empresa:
            empresa_instance = instance.empresa
            empresa_instance.razao_social = empresa_data.get('razao_social', empresa_instance.razao_social)
            empresa_instance.nome_fantasia = empresa_data.get('nome_fantasia', empresa_instance.nome_fantasia)
            empresa_instance.inscricao_estadual = empresa_data.get('inscricao_estadual', empresa_instance.inscricao_estadual)
            empresa_instance.telefone = empresa_data.get('telefone', empresa_instance.telefone)
            # Plano não deve ser atualizado pelo perfil comum, apenas por checkout/admin
            empresa_instance.save()
            
        return instance

class AdminUserSerializer(serializers.ModelSerializer):
    empresa = EmpresaSerializer()
    receitas_count = serializers.IntegerField(read_only=True)
    rotulos_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'empresa', 
            'is_active', 'date_joined', 'last_login', 
            'receitas_count', 'rotulos_count'
        ]