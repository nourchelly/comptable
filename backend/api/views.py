from rest_framework.views import APIView
from rest_framework.decorators import permission_classes

from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from rest_framework.decorators import api_view
from datetime import datetime, timedelta
import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password
import bcrypt
from .models import CustomUser
from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    ForgotPasswordSerializer, 
    ResetPasswordSerializer
)
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.http import JsonResponse
from django.middleware.csrf import get_token

def csrf_token_view(request):
    return JsonResponse({'csrfToken': get_token(request)})

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000/"  # Adapte l'URL en fonction de ton frontend
    client_class = OAuth2Client

class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            user = serializer.save()
            return Response({
                "message": "Utilisateur créé avec succès",
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "role": user.role
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "error": f"Erreur lors de la création: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            role = request.data.get('role')
            
            if not all([email, password, role]):
                return Response({
                    'loginStatus': False,
                    'Error': 'Email, mot de passe et rôle sont requis'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = CustomUser.objects.filter(email=email).first()
            
            if not user:
                return Response({
                    'loginStatus': False,
                    'Error': 'Email ou mot de passe incorrect'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.check_password(password):
                return Response({
                    'loginStatus': False,
                    'Error': 'Email ou mot de passe incorrect'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if user.role != role:
                return Response({
                    'loginStatus': False,
                    'Error': f'Vous êtes un {user.role}, pas un {role}'
                }, status=status.HTTP_403_FORBIDDEN)
            
            token_payload = {
                'user_id': str(user.id),
                'email': user.email,
                'role': user.role,
                'exp': int((datetime.utcnow() + timedelta(hours=24)).timestamp())
            }
            token = jwt.encode(token_payload, settings.SECRET_KEY, algorithm='HS256')
            
            return Response({
                'loginStatus': True,
                'access': token,
                'role': user.role,
                'user_id': str(user.id)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"ERREUR SERVEUR: {str(e)}")
            return Response({
                'loginStatus': False,
                'Error': 'Erreur technique',
                'Details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.filter(email=email).first()
            if user:
                token = user.generate_reset_token()
                return Response(
                    {"detail": "Un lien de réinitialisation a été envoyé à votre email"},
                    status=status.HTTP_200_OK
                )
            return Response(
                {"detail": "Aucun utilisateur avec cet email"},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            user = CustomUser.objects.filter(reset_token=token).first()
            if not user:
                return Response({"detail": "Token invalide"}, status=status.HTTP_400_BAD_REQUEST)

            if user.reset_token_expires and user.reset_token_expires < timezone.now():
                return Response({"detail": "Le token a expiré"}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.reset_token = None
            user.reset_token_expires = None
            user.save()
            
            return Response({"detail": "Mot de passe mis à jour avec succès"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        return Response({"status": "success", "message": "Déconnexion réussie"}, status=status.HTTP_200_OK)

@api_view(['GET'])

@permission_classes([AllowAny])  # Permet un accès sans authentification
def home(request):
    return Response({"message": "Bienvenue à l'accueil de l'API"})

