from rest_framework.views import APIView
import logging
from rest_framework.decorators import permission_classes
from mongoengine.errors import DoesNotExist
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from rest_framework.decorators import api_view
from datetime import datetime, timedelta
from django.core.mail import send_mail 
from django.conf import settings
import jwt
from django.db import models
from mongoengine.errors import NotUniqueError
from django.contrib.auth.hashers import check_password,make_password
import requests
import uuid
from .models import CustomUser,Comptable,DirecteurFinancier
from .serializers import RegisterSerializer, PasswordResetRequestSerializer, PasswordResetSerializer
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
#from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
# Configurer le logger
logger = logging.getLogger(__name__)

@require_GET
@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})
# Token CSRF
#@api_view(['GET'])
#def csrf_token_view(request):
    #return JsonResponse({'csrfToken': get_token(request)})

# Vue pour GoogleLogin
class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000/google/callback"  # Adapte l'URL en fonction de ton frontend
    client_class = OAuth2Client

# Vue d'inscription de l'utilisateur
import re
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_protect
logger = logging.getLogger(__name__)
# accounts/views.py
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    print("Data reçue :", data)
    
    try:
        if CustomUser.objects(email=data['email']):
            return Response({'error': 'Email déjà utilisé'}, status=400)

        if data['password'] != data['confirmPassword']:
            return Response({'error': 'Les mots de passe ne correspondent pas'}, status=400)

        if data['role'] not in ['comptable', 'directeur']:
            return Response({'error': 'Rôle invalide'}, status=400)

        user = CustomUser(
            username=data['username'],
            email=data['email'],
            password=make_password(data['password']),
            role=data['role']
        )
        user.save()
        print("Utilisateur sauvegardé :", user)
        return Response({'message': 'Utilisateur créé avec succès'}, status=201)
    
    except Exception as e:
        print("Erreur :", str(e))
        return Response({'error': str(e)}, status=500)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        role = request.data.get('role', '')

        logger.info(f"Tentative de connexion - Email: {email}, Rôle: {role}")

        if not email or not password or not role:
            return Response({
                'loginStatus': False,
                'Error': 'Tous les champs sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Récupérer l'utilisateur selon son email et rôle
            user = CustomUser.objects.get(email=email, role=role)

            # Vérification du mot de passe
            if not user.check_password(password):
                logger.warning("Mot de passe incorrect")
                return Response({
                    'loginStatus': False,
                    'Error': 'Mot de passe incorrect'
                }, status=status.HTTP_401_UNAUTHORIZED)

            logger.info("Authentification réussie")

            # Générer le token d'accès
            access_token = generate_jwt(user.id, user.role)

            # Infos spécifiques à l'utilisateur selon son rôle
            user_data = {
                'loginStatus': True,
                'access': access_token,  # Token ajouté dans la réponse
                'user_id': str(user.id),
                'role': user.role,
                'email': user.email,
                'username': user.username
            }

            # Si l'utilisateur est un comptable, ajouter ses données spécifiques
            if user.role == "comptable":
                comptable = Comptable.objects(user=user.id).first()
                if comptable:
                    user_data.update({
                        'nom_complet': comptable.nom_complet,
                        'telephone': comptable.telephone,
                        'matricule': comptable.matricule,
                        'departement': comptable.departement
                    })

            # Si l'utilisateur est un directeur, ajouter ses données spécifiques
            elif user.role == "directeur":
                directeur = DirecteurFinancier.objects(user=user.id).first()
                if directeur:
                    user_data.update({
                        'departement': directeur.departement
                    })

            return Response(user_data)

        except DoesNotExist:
            logger.warning("Utilisateur non trouvé")
            return Response({
                'loginStatus': False,
                'Error': 'Aucun compte trouvé avec ces identifiants'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Erreur technique: {str(e)}", exc_info=True)
            return Response({
                'loginStatus': False,
                'Error': 'Erreur technique',
                'Details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_jwt(user_id, role):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=2),  # token expire dans 2h
        'iat': datetime.utcnow()  # moment de création du token
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


# Vue pour la demande de réinitialisation du mot de passe
import json

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.reset_token = str(uuid.uuid4()) # Convert UUID to string
            user.reset_token_expires = datetime.now() + timedelta(hours=24)
            user.save()

            reset_link = f"{settings.FRONTEND_URL}/reset-password/{user.reset_token}/"
            send_mail(
                f'Réinitialisation de votre mot de passe ({user.get_role_display()})',
                f'Cliquez sur ce lien pour réinitialiser votre mot de passe: {reset_link}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            return Response({"message": "Un lien de réinitialisation a été envoyé à votre email."}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
     # au cas où pas encore importé
    data = json.loads(request.body)

    token = data.get('token')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not token:
        return Response({"detail": "Token manquant"}, status=400)


        # Vérification que le token est bien celui actuellement en base
        
# ...

    try:
        user = CustomUser.objects.get(reset_token=token)
    except CustomUser.DoesNotExist:
        return Response({"detail": "Lien invalide ou expiré."}, status=404)
   
   
    now = timezone.now()
    # Vérification de l'expiration du token
       # Corrige le type de datetime si nécessaire
    token_expires = user.reset_token_expires
    if is_naive(token_expires):
        token_expires = make_aware(token_expires, get_current_timezone())
    if token_expires < now:
        return Response({"detail": "Lien expiré."}, status=400)

        

    # Vérification que les mots de passe correspondent
    if new_password != confirm_password:
        return Response({"detail": "Les mots de passe ne correspondent pas."}, status=400)

    # Mise à jour du mot de passe
    user.set_password(new_password)
    
    # Réinitialisation du token et expiration dans la base
    user.reset_token = None
    user.reset_token_expires = None
    user.save()

    return Response({"detail": "Mot de passe réinitialisé avec succès."}, status=200)

# Vue de déconnexion
from django.utils.timezone import is_naive, make_aware, get_current_timezone
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import JsonResponse
from django.contrib.auth import logout
from django.http import HttpResponse
# Vue de déconnexion
def logout_view(request):
    # Supprimer le cookie
    response = JsonResponse({'Status': True})
    response.delete_cookie('token')  # Effacer le cookie 'token'
    
    # Si l'utilisateur est authentifié, déconnecter
    logout(request)
    
    return response
            
# Vue de l'accueil
@api_view(['GET'])
@permission_classes([AllowAny])  # Permet un accès sans authentification
def home(request):
    return Response({"message": "Bienvenue à l'accueil de l'API"})

# Vue pour l'authentification via Google
@api_view(['GET'])
def google_auth(request):
    return Response({'message': 'Endpoint Google Auth'})


@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def google_auth_callback(request):
    code = request.data.get('code')
    print("Code reçu:", code)

    if not code:
        return JsonResponse({"error": "Code non fourni"}, status=400)

    # 1. Obtenir les tokens depuis Google
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = "http://localhost:3000/auth/google/callback"  # à adapter selon votre redirection
    client_id = "11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com"
    client_secret = "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"

    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    token_response = requests.post(token_url, data=token_data)
    if token_response.status_code != 200:
        return JsonResponse({"error": "Erreur token Google"}, status=400)

    tokens = token_response.json()
    access_token = tokens.get("access_token")

    # 2. Récupérer les infos utilisateur
    user_info_response = requests.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        params={"access_token": access_token}
    )

    if user_info_response.status_code != 200:
        return JsonResponse({"error": "Erreur récupération infos utilisateur"}, status=400)

    user_info = user_info_response.json()
    print("Réponse Google Token:", user_info)

    email = user_info.get("email")
    username = user_info.get("name", email.split("@")[0])

    if not email:
        return JsonResponse({"error": "Email non récupéré"}, status=400)

    # 3. Vérifier ou créer l'utilisateur dans MongoEngine
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        # Ici, tu peux choisir un rôle spécifique ou utiliser une logique d'assignation de rôle
        # Exemple : un rôle par défaut 'admin' ou autre logique
        user = CustomUser.objects.create(
            email=email,
            username=username,
            role="admin",  # Vous pouvez ajouter une logique plus fine pour le rôle
            password="",  # Pas de mot de passe (auth externe)
            is_active=True
        )

    # 4. Générer le JWT manuellement
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,  # Assurer que le rôle est envoyé
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }

    jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return JsonResponse({
        "token": jwt_token,  # Le token JWT
        "role": user.role,   # Le rôle de l'utilisateur
        "user_id": str(user.id)  # L'id de l'utilisateur (utilisé dans le frontend)
    })
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken
from .serializers import ComptableSerializer

class ComptableProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Débogage : vérifier si l'utilisateur est authentifié
        print(f"Utilisateur authentifié: {request.user.is_authenticated}")
        user = request.user

        # Vérification du rôle
        if not hasattr(user, 'role') or user.role.lower() != 'comptable':
            return Response(
                {"error": "Accès réservé aux comptables"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Recherche du profil comptable avec gestion des champs alternatifs
            comptable = Comptable.objects.get(user=user.id)
            
            # Gestion du nom complet (champ potentiellement mal orthographié)
            nom_complet = getattr(comptable, 'nom_complet', None) or getattr(comptable, 'non_complet', 'Non spécifié')
            
            # Construction de la réponse
            response_data = {
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "comptable": {
                    "nom_complet": nom_complet,
                    "telephone": comptable.telephone,
                    "matricule": comptable.matricule,
                    "departement": getattr(comptable, 'departement', None) or getattr(comptable, 'department', None),
                    "id": str(comptable.id)
                }
            }
            
            return Response(response_data)

        except Comptable.DoesNotExist:
            return Response(
                {"error": "Profil comptable non trouvé"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Erreur serveur: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

    #supprimerprofil
class DeleteProfilView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
            user.delete()
            return Response({"Status": True})
        except CustomUser.DoesNotExist:
            return Response({"Status": False, "Error": "Utilisateur non trouvé"}, status=404)


#rapport 
from .models import Rapport
from .serializers import RapportSerializer
from .permissions import IsComptable
class RapportCreateView(APIView):
    permission_classes = [IsAuthenticated, IsComptable]

    def post(self, request, *args, **kwargs):
        # Création d'un rapport
        comptable = Comptable.objects.get(user=request.user)
        rapport = Rapport(
            nom=request.data.get('nom'),
            type=request.data.get('type'),
            statut='En attente',
            comptable=comptable
        )
        rapport.save()
        return Response({"message": "Rapport créé avec succès"}, status=status.HTTP_201_CREATED)

# 📄 Affichage des rapports du comptable connecté
class RapportListView(APIView):
    permission_classes = [IsAuthenticated, IsComptable]

    def get(self, request, *args, **kwargs):
        comptable = Comptable.objects.get(user=request.user)
        rapports = Rapport.objects.filter(comptable=comptable)  # 🔐 Restriction à ses propres rapports
        rapports_data = [{
            "id": str(r.id),
            "nom": r.nom,
            "type": r.type,
            "statut": r.statut,
            "date": r.date.strftime('%Y-%m-%d')
        } for r in rapports]
        return Response(rapports_data, status=status.HTTP_200_OK)

class RapportEditView(APIView):
    permission_classes = [IsAuthenticated, IsComptable]

    def put(self, request, pk, *args, **kwargs):
        try:
            rapport = Rapport.objects.get(id=pk)
        except Rapport.DoesNotExist:
            return Response({"message": "Rapport non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        # Vérifie que le rapport appartient bien au comptable connecté
        comptable = Comptable.objects.get(user=request.user)
        if rapport.comptable != comptable:
            return Response({"message": "Vous n'avez pas le droit de modifier ce rapport"}, status=status.HTTP_403_FORBIDDEN)

        # Vérifie que le rapport n'est pas validé
        if rapport.statut == "Validé":
            return Response({"message": "Impossible de modifier un rapport déjà validé"}, status=status.HTTP_403_FORBIDDEN)

        # Mise à jour des champs
        rapport.nom = request.data.get('nom', rapport.nom)
        rapport.type = request.data.get('type', rapport.type)
        rapport.save()

        return Response({"message": "Rapport modifié avec succès"}, status=status.HTTP_200_OK)

class RapportDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsComptable]

    def delete(self, request, pk, *args, **kwargs):
        try:
            rapport = Rapport.objects.get(id=pk)
        except Rapport.DoesNotExist:
            return Response({"message": "Rapport non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        if rapport.statut == "Validé":
            return Response({"message": "Impossible de supprimer un rapport validé"}, status=status.HTTP_403_FORBIDDEN)

        rapport.delete()
        return Response({"message": "Rapport supprimé avec succès"}, status=status.HTTP_204_NO_CONTENT)



from .permissions import IsComptable
    #exporter
from bson import ObjectId
from .models import Rapport  # MongoEngine model
import io
from reportlab.pdfgen import canvas
from openpyxl import Workbook

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Rapport
from .permissions import IsComptable
from bson import ObjectId
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from openpyxl import Workbook
from django.http import HttpResponse
import io
import os

@api_view(['GET'])
@permission_classes([IsComptable])
def exporter_rapport(request, id):
    format_export = request.GET.get('format', '').lower()
    if format_export not in ['pdf', 'excel']:
        return Response({'error': 'Format invalide'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rapport = Rapport.objects.get(id=ObjectId(id))
    except Rapport.DoesNotExist:
        return Response({'error': 'Rapport introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if format_export == 'pdf':
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # 📌 Ajout d'un logo (remplace le chemin par le tien)
        logo_path = os.path.join('static', 'images', 'logo.png')  # chemin relatif
        if os.path.exists(logo_path):
            logo = ImageReader(logo_path)
            p.drawImage(logo, 40, height - 100, width=100, height=50)

        # 📄 Détails du rapport
        p.setFont("Helvetica-Bold", 14)
        p.drawString(100, height - 150, f"Rapport: {rapport.nom}")
        p.drawString(100, height - 180, f"Type: {rapport.type}")
        p.drawString(100, height - 210, f"Date: {rapport.date.strftime('%Y-%m-%d')}")
        p.drawString(100, height - 240, f"Statut: {rapport.statut}")
        p.showPage()
        p.save()

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{rapport.nom}.pdf"'
        return response

    elif format_export == 'excel':
        wb = Workbook()
        ws = wb.active
        ws.title = "Rapport"

        # 🧾 En-tête
        ws.append(["Nom", "Type", "Date", "Statut"])
        ws.append([rapport.nom, rapport.type, rapport.date.strftime('%Y-%m-%d'), rapport.statut])

        # ➕ Lignes de transactions simulées
        ws.append([])  # ligne vide
        ws.append(["Transactions"])
        ws.append(["Date", "Description", "Montant"])

        # Exemple de données simulées (à remplacer avec des vraies données si disponibles)
        transactions = [
            ("2025-04-01", "Achat matériel", 1200.00),
            ("2025-04-02", "Vente service", 2500.00),
            ("2025-04-03", "Frais déplacement", 300.00),
        ]

        for t in transactions:
            ws.append(t)

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{rapport.nom}.xlsx"'
        return response
