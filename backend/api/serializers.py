from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=['Comptable', 'Directeur financier'])

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'confirm_password', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'password': "Les mots de passe ne correspondent pas !"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')  # On enlève 'confirm_password' avant la création
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = User.objects.filter(username=data["username"]).first()

        if user is None:
            raise serializers.ValidationError("Utilisateur non trouvé")
        
        if not user.check_password(data["password"]):  # Correction ici
            raise serializers.ValidationError("Le mot de passe est incorrect")

        tokens = RefreshToken.for_user(user)  # Correction d'indentation
        
        return {
            "username": user.username,
            "role": user.role,
            "access": str(tokens.access_token),
            "refresh": str(tokens),
        }
