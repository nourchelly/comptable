from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated


@api_view(['GET'])
def home(request):
    return Response({"message": "Bienvenue à l'accueil de l'API"})

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
class LoginView(APIView):
    def post(self, request):
        # Récupérer les données de la requête
        username_or_email = request.data.get("username")
        password = request.data.get("password")
        role = request.data.get("role")

        # Vérification si l'utilisateur est identifié par email ou nom d'utilisateur
        user = None
        if '@' in username_or_email:
            # Recherche par email
            try:
                user = CustomUser.objects.get(email=username_or_email)
            except CustomUser.DoesNotExist:
                return Response({"error": "Utilisateur non trouvé"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Recherche par nom d'utilisateur
            user = authenticate(username=username_or_email, password=password)

        # Si l'utilisateur est trouvé et l'authentification réussie
        if user:
            # Vérification du rôle
            if user.role != role:
                return Response({"error": "Rôle incorrect"}, status=status.HTTP_401_UNAUTHORIZED)

            # Générer les tokens JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                "loginStatus": True,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "role": user.role,
                "username": user.username
            })

        # Si l'utilisateur n'est pas trouvé ou les identifiants sont invalides
        return Response({"error": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)


# Ajouter des vues pour `forgot_password` et `logout` si nécessaire, sinon laissez-les comme placeholder
@api_view(['POST'])
def forgot_password(request):
    # Implémenter la logique de réinitialisation de mot de passe
    return Response({"message": "Réinitialisation de mot de passe"})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]  # Permet seulement aux utilisateurs authentifiés de se déconnecter

    def post(self, request):
        try:
            # Récupère le refresh token du client (en général il est envoyé dans le cookie ou dans le body)
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                # Invalider le refresh token en le blacklistant
                token = RefreshToken(refresh_token)
                token.blacklist()
                
                # Optionnellement, supprimer le refresh token du cookie (si tu l'utilises)
                response = JsonResponse({'Status': 'Déconnexion réussie'})
                response.delete_cookie('refresh_token')  # Supprimer le cookie contenant le refresh token
                return response
            else:
                return Response({'detail': 'Aucun token fourni'}, status=400)
        except Exception as e:
            return Response({'detail': 'Erreur lors de la déconnexion'}, status=500)