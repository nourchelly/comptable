from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=["comptable", "directeur"],  # Seulement ces 2 choix possibles
        default="comptable",
        required=False
    )
    def validate_role(self, value):
        if isinstance(value, list):  # Gestion du cas où role serait un tableau
            value = value[0]
        if value not in ['comptable', 'directeur']:
            raise serializers.ValidationError("Le rôle doit être 'comptable' ou 'directeur'")
        return value
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return data

    def create(self, validated_data):
        # Supprime le champ confirm_password avant création
        validated_data.pop('confirm_password', None)
        return CustomUser.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            return attrs
        raise serializers.ValidationError("Email et mot de passe requis")

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField()