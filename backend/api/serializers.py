from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomUser
from django.contrib.auth.hashers import make_password
import re
from rest_framework_mongoengine import serializers as mongo_serializers  # Correction ici
from .models import Comptable, CustomUser, DirecteurFinancier, Rapport
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from rest_framework_mongoengine.serializers import DocumentSerializer
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']

from rest_framework import serializers
from .models import CustomUser

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class ComptableSerializer(mongo_serializers.DocumentSerializer):  # Modifié ici
    user = CustomUserSerializer()

    class Meta:
        model = Comptable
        fields = ('user', 'nom_complet', 'telephone', 'matricule', 'departement', 'is_active')

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
        email = data.get('email').strip().lower()  # Normalisation
        role = data.get('role').strip().lower()    # Normalisation
        
        print(f"Validation attempt - Email: {email}, Role: {role}")  # Debug

        try:
            user = CustomUser.objects.get(email__iexact=email, role__iexact=role)
            print(f"User found: {user.email}, Role: {user.role}")  # Debug
            data['user'] = user
            return data
        except CustomUser.DoesNotExist:
            print("No user found with these credentials.")  # Debug
            raise serializers.ValidationError(
                {"detail": "Aucun utilisateur trouvé avec cet email et ce rôle."},
                code='invalid'
            )

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
        if len(password) < 8:
            return False
        if not re.search(r'[A-Z]', password):
            return False
        if not re.search(r'[a-z]', password):
            return False
        if not re.search(r'[0-9]', password):
            return False
        return True

class DirecteurFinancierSerializer(mongo_serializers.DocumentSerializer):  # Modifié ici
    user = CustomUserSerializer()
    comptables = ComptableSerializer(many=True)

    class Meta:
        model = DirecteurFinancier
        fields = '__all__'
        depth = 1

class RapportSerializer(mongo_serializers.DocumentSerializer):  # Modifié ici
    comptable = ComptableSerializer(read_only=True)
    comptable_id = serializers.CharField(write_only=True)
    
    directeur = DirecteurFinancierSerializer(read_only=True)
    directeur_id = serializers.CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Rapport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'validated_at']

    def validate_comptable_id(self, value):
        try:
            return Comptable.objects.get(id=value)
        except Comptable.DoesNotExist:
            raise serializers.ValidationError("Comptable non trouvé")

    def validate_directeur_id(self, value):
        if not value:
            return None
        try:
            return DirecteurFinancier.objects.get(id=value)
        except DirecteurFinancier.DoesNotExist:
            raise serializers.ValidationError("Directeur financier non trouvé")

    def create(self, validated_data):
        comptable = validated_data.pop('comptable_id')
        directeur = validated_data.pop('directeur_id', None)
        
        rapport = Rapport(
            comptable=comptable,
            directeur=directeur,
            **validated_data
        )
        rapport.save()
        return rapport

class ExportSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=['pdf', 'excel'])
    include_details = serializers.BooleanField(default=True)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from api.models import CustomUser  # adapte si le modèle est ailleurs

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token
    username_field = CustomUser.EMAIL_FIELD  # généralement 'email'

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Utilisateur avec cet email introuvable.")

        if not user.check_password(password):
            raise serializers.ValidationError("Mot de passe incorrect.")

        data = super().validate({
            "username": user.username,  # pour rester compatible avec le mécanisme simplejwt
            "password": password
        })

        data['user'] = {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }

        return data



from rest_framework import serializers
#from .models import ProfilAdmin

class ProfilAdminSerializer(serializers.Serializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    role = serializers.CharField(source='user.role')
    id = serializers.CharField(source='id')  # Ajoutez ce champ

    class Meta:
        fields = ('id', 'username', 'email', 'role')