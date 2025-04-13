from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomUser
from django.contrib.auth.hashers import make_password
import re
from rest_framework_mongoengine.serializers import DocumentSerializer
from .models import Comptable, CustomUser
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from django.utils import timezone
User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']

class CustomUserSerializer(DocumentSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role')

class ComptableSerializer(DocumentSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = Comptable
        fields = ('user', 'nom_complet', 'telephone', 'matricule', 'departement', 'is_active')
import mongoengine.errors

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('comptable', 'Comptable'), ('directeur_financier', 'Directeur financier')])

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'confirm_password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    def validate_email(self, value):
        try:
            if CustomUser.objects(email=value.lower()).first():
                raise serializers.ValidationError("Cet email est déjà utilisé.")
        except mongoengine.errors.ValidationError as e:
            raise serializers.ValidationError(f"Erreur de validation de l'email : {e}")
        return value.lower()

    def validate_username(self, value):
        try:
            if CustomUser.objects(username=value).first():
                raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")

            if not re.match(r'^[\w.@+-]+$', value):
                raise serializers.ValidationError(
                    "Caractères spéciaux non autorisés dans le nom d'utilisateur"
                )
        except mongoengine.errors.ValidationError as e:
            raise serializers.ValidationError(f"Erreur de validation du nom d'utilisateur : {e}")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Minimum 8 caractères")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Au moins un chiffre")
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Au moins une majuscule")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Les mots de passe ne correspondent pas"
            })
        return data

    def create(self, validated_data):
        user = CustomUser(
            email=validated_data['email'],
            username=validated_data['username'],
            role=validated_data.get('role', 'comptable')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            return attrs
        raise serializers.ValidationError("Email et mot de passe requis")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)

    def validate(self, data):
        email = data['email']
        role = data['role']

        try:
            user = CustomUser.objects.get(email=email, role=role)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Aucun utilisateur avec cet email et ce rôle.")

        data['user'] = user
        return data

class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_token(self, value):
        try:
            user = CustomUser.objects.get(reset_token=value)
            if user.reset_token_expires < datetime.now(timezone.utc):
                raise serializers.ValidationError("Le lien a expiré.")
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Token invalide.")
        return value
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data
    def is_valid_password(self, password):
        # Minimum 8 caractères, une majuscule, une minuscule, un chiffre
        if len(password) < 8:
            return False
        if not re.search(r'[A-Z]', password):  # Vérifier s'il y a une majuscule
            return False
        if not re.search(r'[a-z]', password):  # Vérifier s'il y a une minuscule
            return False
        if not re.search(r'[0-9]', password):  # Vérifier s'il y a un chiffre
            return False
        return True
    #
    from api.models import Rapport

class RapportSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    nom = serializers.CharField()
    type = serializers.CharField()
    statut = serializers.ChoiceField(choices=["Validé", "En attente", "Rejeté"])
    date = serializers.DateTimeField(read_only=True)
    comptable = serializers.PrimaryKeyRelatedField(queryset=Comptable.objects.all())
    #directeur_financier = serializers.PrimaryKeyRelatedField(queryset=DirecteurFinancier.objects.all(), required=False, allow_null=True)
    #date_validation = serializers.DateTimeField(read_only=True, required=False)
    #date_modification = serializers.DateTimeField(read_only=True, required=False)

    def create(self, validated_data):
        return Rapport(**validated_data).save()

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance