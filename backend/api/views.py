from rest_framework.views import APIView
import logging
from bson.errors import InvalidId
from decimal import Decimal,InvalidOperation
from datetime import datetime as dt
from django.http import Http404, HttpResponse, JsonResponse,FileResponse
from mongoengine.errors import NotUniqueError, ValidationError
from django.utils.timezone import now as timezone_now
from rest_framework.decorators import permission_classes
from mongoengine.errors import DoesNotExist
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from rest_framework.decorators import api_view
from datetime import datetime, timedelta
from django.core.mail import send_mail 
from django.conf import settings
import jwt
    #exporter
from bson import ObjectId
from .models import Rapport ,ActionLog,Facture,Banque,Notification # MongoEngine model
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
from django.contrib.auth.hashers import check_password,make_password
import requests
import uuid
from api.models import CustomUser,AuditFinancier,Admin
 

from .models import CustomUser,Comptable,DirecteurFinancier
from .serializers import PasswordResetRequestSerializer
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
#from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie


# Vue de l'accueil
@api_view(['GET'])
@permission_classes([AllowAny])  # Permet un accès sans authentification
def home(request):
    return Response({"message": "Bienvenue à l'accueil de l'API"})
# Configurer le logger
logger = logging.getLogger(__name__)

@require_GET
@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})

from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
# Vue pour GoogleLogin
class GoogleLogin(SocialLoginView):
    authentication_classes = []  # Désactive l'authentification par défaut
    permission_classes = [AllowAny] 
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000/google/callback"  # Adapte l'URL en fonction de ton frontend
    client_class = OAuth2Client

class FacebookLogin(SocialLoginView):
    adapter_class = FacebookOAuth2Adapter
    callback_url = "http://localhost:3000/auth/facebook/callback"
    client_class = OAuth2Client

def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs['context'] = self.get_serializer_context()
        return serializer_class(*args, **kwargs)
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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import CustomUser
from django.db import transaction
from django.contrib.auth.hashers import make_password
import jwt
from datetime import datetime, timedelta,timezone
from django.core.exceptions import ValidationError
from django.core.validators import validate_email

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    
    # Validation de base
    if CustomUser.objects.filter(email=data['email']).first():
        return Response({'error': 'Email déjà utilisé'}, status=400)
    
    if data['password'] != data.get('confirmPassword', ''):
        return Response({'error': 'Les mots de passe ne correspondent pas'}, status=400)
    
    # Validation des emails secondaires
    secondary_emails = data.get('secondary_emails', [])
    valid_secondary_emails = []
    
    for email in secondary_emails:
        try:
            validate_email(email)
            if email != data['email']:  # Ne pas ajouter l'email principal
                valid_secondary_emails.append(email)
        except ValidationError:
            continue
    
    # Création de l'utilisateur
    try:
        with transaction.atomic():
            # 1. Création de l'utilisateur
            user = CustomUser(
                username=data['username'],
                email=data['email'],
                role=data.get('role', 'comptable'),
                secondary_emails=valid_secondary_emails,
                is_active=False
            )
            user.set_password(data['password'])
            user.save()  # Sauvegarde initiale pour avoir un ID
            
            # 2. Création du compte associé
            compte = Compte(
                user=user,
                statut='En cours'  # Statut par défaut à l'inscription
            )
            
            # Si c'est un comptable ou directeur, on lie les références
            if user.role == 'comptable':
                try:
                    comptable = Comptable.objects.get(user=user)
                    compte.comptable = comptable
                except Comptable.DoesNotExist:
                    pass
            elif user.role == 'directeur':
                try:
                    directeur = DirecteurFinancier.objects.get(user=user)
                    compte.directeur = directeur
                except DirecteurFinancier.DoesNotExist:
                    pass
            
            compte.save()
            
            # 3. Génération du token d'activation
            activation_token = user.generate_activation_token()
            
            # Liste de tous les emails à notifier
            all_emails = [user.email] + valid_secondary_emails
            
            # Envoi des emails
            activation_link = f"{settings.FRONTEND_URL}/activate/{activation_token}"
            send_mail(
                'Activation de compte',
                f'''Bonjour,
                
                Un compte a été créé avec votre adresse email.
                
                Veuillez cliquer sur le lien suivant pour activer le compte :
                {activation_link}
                
                Ce lien expirera dans 24 heures.
                
                Cordialement,
                L'équipe de votre application''',
                settings.DEFAULT_FROM_EMAIL,
                all_emails,
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': f'Inscription réussie. Email(s) envoyé(s) à {len(all_emails)} adresse(s).',
                'emails_sent_to': all_emails,
                'compte_id': str(compte.id)  # Retourne l'ID du compte créé
            }, status=201)
    
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print(f"Erreur d'inscription : {str(e)}\n{error_traceback}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def activate_account(request, token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        user = CustomUser.objects.get(id=payload['user_id'])
        
        if user.is_active:
            return Response({'success': False, 'error': 'Ce compte est déjà activé'}, status=400)
            
        user.is_active = True
        user.activation_token = None
        user.save()
        
        return Response({
            'success': True,
            'message': 'Compte activé avec succès !'
        })
        
    except jwt.ExpiredSignatureError:
        return Response({
            'success': False,
            'error': 'Le lien d\'activation a expiré. Veuillez demander un nouveau lien.'
        }, status=400)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=400)

from .models import CustomUser

from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mongoengine import DoesNotExist
import json

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            role = data.get('role')
            
            try:
                user = CustomUser.objects.get(email=email)
                if not user.check_password(password):
                    return JsonResponse({'status': 'error', 'message': 'Mot de passe incorrect'}, status=401)
                
                if user.role != role:
                    return JsonResponse({'status': 'error', 'message': 'Rôle incorrect'}, status=403)
                
                # Ici vous devriez implémenter votre propre système de session
                return JsonResponse({
                    'status': 'success',
                    'user': {
                        'id': str(user.id),
                        'email': user.email,
                        'username': user.username,
                        'role': user.role
                    }
                })
                
            except DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Utilisateur non trouvé'}, status=404)
                
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Données JSON invalides'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)
from django.views.decorators.csrf import csrf_exempt
import json
from .models import CustomUser,Compte  # Importez directement CustomUser
from django.http import JsonResponse
from django.db import IntegrityError
@csrf_exempt
def ProfilAdminApi(request, id=None):
    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(id=id)
            try:
                admin = Admin.objects.get(user=user)
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'nom_complet': admin.nom_complet,
                    'telephone': admin.telephone,
                    'last_login': admin.last_login,
                    'date_creation': admin.date_creation,
                }
                return JsonResponse(user_data)
            except Admin.DoesNotExist:
                return JsonResponse({
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'error': "Profil admin non trouvé"
                })
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

    elif request.method == 'POST':
        try:
            # 1. Vérification des données JSON
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse(
                    {"error": "Données JSON invalides"}, 
                    status=400
                )
            
            # 2. Validation des champs obligatoires
            required_fields = ['user_id', 'nom_complet', 'telephone']
            missing_fields = [
                field for field in required_fields 
                if field not in data
            ]
            
            if missing_fields:
                return JsonResponse({
                    "error": "Champs requis manquants",
                    "champs_manquants": missing_fields
                }, status=400)
            
            # 3. Vérification de l'existence de l'utilisateur
            try:
                user = CustomUser.objects.get(id=data['user_id'])
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"error": "Utilisateur non trouvé"}, 
                    status=404
                )
            except ValueError:
                return JsonResponse(
                    {"error": "user_id doit être un nombre valide"}, 
                    status=400
                )
            
            # 4. Vérification de l'existence du profil admin
            if Admin.objects(user=user).first():
                return JsonResponse({
                    "error": "Profil admin existe déjà pour cet utilisateur"
                }, status=400)
            
            # 5. Création du profil admin
            try:
                admin = Admin(
                    user=user,
                    nom_complet=data['nom_complet'],
                    telephone=data['telephone'],
                    last_login=data.get('last_login'),
                    date_creation=data.get('date_creation', timezone.now())
                )
                admin.save()
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil admin créé avec succès",
                    "admin_id": str(admin.id),
                    "user_id": str(user.id)
                }, status=201)
            
            except NotUniqueError as e:
                return JsonResponse({
                    "error": "Ce numéro de téléphone est déjà utilisé"
                }, status=400)
            except ValidationError as e:
                return JsonResponse({
                    "error": f"Erreur de validation: {str(e.to_dict())}"
                }, status=400)
            
        except Exception as e:
            return JsonResponse(
                {"error": f"Erreur serveur: {str(e)}"}, 
                status=500
            )

    elif request.method == 'PUT':
        try:
            user = CustomUser.objects.get(id=id)
            try:
                admin = Admin.objects.get(user=user)
                try:
                    data = json.loads(request.body)
                    
                    user_data = {}
                    admin_data = {}
                    
                    for key, value in data.items():
                        if key in ['username', 'email', 'password']:
                            user_data[key] = value
                        elif key in ['nom_complet', 'telephone', 'last_login', 'date_creation']:
                            admin_data[key] = value
                    
                    if user_data:
                        for key, value in user_data.items():
                            if key == 'password':
                                user.set_password(value)
                            else:
                                setattr(user, key, value)
                        user.save()
                    
                    if admin_data:
                        for key, value in admin_data.items():
                            setattr(admin, key, value)
                        admin.save()
                    
                    return JsonResponse({"status": "success", "message": "Profil mis à jour avec succès"})
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Données JSON invalides"}, status=400)
            except Admin.DoesNotExist:
                return JsonResponse({"error": "Profil admin non trouvé"}, status=404)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

    elif request.method == 'DELETE':
        try:
            user = CustomUser.objects.get(id=id)
            user.delete()
            return JsonResponse({"status": "success", "message": "Compte supprimé avec succès"})
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)  
@csrf_exempt
def ProfilComptableApi(request, id=None):
    # Vérifier si l'id est fourni et non vide
    if request.method != 'POST' and (not id or id == 'undefined'):
        return JsonResponse({"error": "ID utilisateur requis"}, status=400)
        
    if request.method == 'GET':
        try:
            # Récupérer d'abord l'utilisateur CustomUser
            user = CustomUser.objects.get(id=id)
            
            # Puis récupérer le comptable associé à cet utilisateur
            try:
                comptable = Comptable.objects.get(user=user)
                
                # Combiner les données des deux collections
                user_data = {
                    'id': str(user.id),  # ID de l'utilisateur pour les opérations d'authentification
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'nom_complet': comptable.nom_complet,
                    'telephone': comptable.telephone,
                    'matricule': comptable.matricule,
                    'departement': comptable.departement,
                }
                return JsonResponse(user_data)
                
            except DoesNotExist:
                # L'utilisateur existe mais n'a pas de profil comptable associé
                return JsonResponse({
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'error': "Profil comptable non trouvé"
                })
                
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
    elif request.method == 'POST':
        try:
            # 1. Vérification des données JSON
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse(
                    {"error": "Données JSON invalides"}, 
                    status=400
                )
            
            # 2. Validation des champs obligatoires
            required_fields = ['user_id', 'nom_complet', 'telephone','matricule','departement']
            missing_fields = [
                field for field in required_fields 
                if field not in data
            ]
            
            if missing_fields:
                return JsonResponse({
                    "error": "Champs requis manquants",
                    "champs_manquants": missing_fields
                }, status=400)
            
            # 3. Vérification de l'existence de l'utilisateur
            try:
                user = CustomUser.objects.get(id=data['user_id'])
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"error": "Utilisateur non trouvé"}, 
                    status=404
                )
            except ValueError:
                return JsonResponse(
                    {"error": "user_id doit être un nombre valide"}, 
                    status=400
                )
            
            # 4. Vérification de l'existence du profil admin
            if Comptable.objects(user=user).first():
                return JsonResponse({
                    "error": "Profil comptable existe déjà pour cet utilisateur"
                }, status=400)
            
            # 5. Création du profil admin
            try:
                comptable = Comptable(
                    user=user,
                    nom_complet=data['nom_complet'],
                    telephone=data['telephone'],
                    matricule=data['matricule'],
                    departement=data['departement']
                )
                comptable.save()
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil comptable créé avec succès",
                    "comptable_id": str(comptable.id),
                    "user_id": str(user.id)
                }, status=201)
            
            except NotUniqueError as e:
                return JsonResponse({
                    "error": "Ce numéro de téléphone est déjà utilisé"
                }, status=400)
            except ValidationError as e:
                return JsonResponse({
                    "error": f"Erreur de validation: {str(e.to_dict())}"
                }, status=400)
            
        except Exception as e:
            return JsonResponse(
                {"error": f"Erreur serveur: {str(e)}"}, 
                status=500
            )
        
    elif request.method == 'PUT':
        try:
            # Récupérer d'abord l'utilisateur
            user = CustomUser.objects.get(id=id)
            
            # Puis récupérer le comptable associé
            try:
                comptable = Comptable.objects.get(user=user)
                
                # Analyser les données de la requête
                try:
                    data = json.loads(request.body)
                    
                    # Séparer les données pour CustomUser et Comptable
                    user_data = {}
                    comptable_data = {}
                    
                    # Assigner les champs aux objets appropriés
                    for key, value in data.items():
                        if key in ['username', 'email', 'password']:
                            user_data[key] = value
                        elif key in ['nom_complet', 'telephone', 'matricule', 'departement']:
                            comptable_data[key] = value
                    
                    # Mettre à jour CustomUser
                    if user_data:
                        for key, value in user_data.items():
                            if key == 'password':
                                user.set_password(value)
                            else:
                                setattr(user, key, value)
                        user.save()
                    
                    # Mettre à jour Comptable
                    if comptable_data:
                        for key, value in comptable_data.items():
                            setattr(comptable, key, value)
                        comptable.save()
                    
                    return JsonResponse({"status": "success", "message": "Profil mis à jour avec succès"})
                    
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Données JSON invalides"}, status=400)
                    
            except DoesNotExist:
                # L'utilisateur existe mais pas le profil comptable
                return JsonResponse({"error": "Profil comptable non trouvé"}, status=404)
                
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    elif request.method == 'DELETE':
        try:
            # Récupérer l'utilisateur
            user = CustomUser.objects.get(id=id)
            
            # Le document Comptable sera supprimé automatiquement grâce à CASCADE
            user.delete()
            return JsonResponse({"status": "success", "message": "Compte supprimé avec succès"})
            
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)
    #Directeur profil
@csrf_exempt
def ProfilDirecteurApi(request, id=None):
    # Vérifier si l'id est fourni et non vide
    if request.method != 'POST' and (not id or id == 'undefined'):
        return JsonResponse({"error": "ID utilisateur requis"}, status=400)
        
    if request.method == 'GET':
        try:
            # Récupérer d'abord l'utilisateur CustomUser
            user = CustomUser.objects.get(id=id)
            
            # Puis récupérer le comptable associé à cet utilisateur
            try:
                directeur = DirecteurFinancier.objects.get(user=user)
                
                # Combiner les données des deux collections
                user_data = {
                    'id': str(user.id),  # ID de l'utilisateur pour les opérations d'authentification
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'telephone': directeur.telephone,
                    'departement': directeur.departement,
                    'specialite': directeur.specialite,
                }
                return JsonResponse(user_data)
                
            except DoesNotExist:
                # L'utilisateur existe mais n'a pas de profil comptable associé
                return JsonResponse({
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'error': "Profil directeur non trouvé"
                })
                
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
    elif request.method == 'POST':
        try:
            # 1. Vérification des données JSON
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse(
                    {"error": "Données JSON invalides"}, 
                    status=400
                )
            
            # 2. Validation des champs obligatoires
            required_fields = ['user_id', 'telephone','departement','specialite']
            missing_fields = [
                field for field in required_fields 
                if field not in data
            ]
            
            if missing_fields:
                return JsonResponse({
                    "error": "Champs requis manquants",
                    "champs_manquants": missing_fields
                }, status=400)
            
            # 3. Vérification de l'existence de l'utilisateur
            try:
                user = CustomUser.objects.get(id=data['user_id'])
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"error": "Utilisateur non trouvé"}, 
                    status=404
                )
            except ValueError:
                return JsonResponse(
                    {"error": "user_id doit être un nombre valide"}, 
                    status=400
                )
            
            # 4. Vérification de l'existence du profil admin
            if DirecteurFinancier.objects(user=user).first():
                return JsonResponse({
                    "error": "Profil directeur existe déjà pour cet utilisateur"
                }, status=400)
            
            # 5. Création du profil directeur
            try:
                directeur = DirecteurFinancier(
                    user=user,
                    telephone=data['telephone'],
                    departement=data['departement'],
                    specialite=data['specialite']
                )
                directeur.save()
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil directeur créé avec succès",
                    "directeur_id": str(directeur.id),
                    "user_id": str(user.id)
                }, status=201)
            
            except NotUniqueError as e:
                return JsonResponse({
                    "error": "Ce numéro de téléphone est déjà utilisé"
                }, status=400)
            except ValidationError as e:
                return JsonResponse({
                    "error": f"Erreur de validation: {str(e.to_dict())}"
                }, status=400)
            
        except Exception as e:
            return JsonResponse(
                {"error": f"Erreur serveur: {str(e)}"}, 
                status=500
            )
                
    elif request.method == 'PUT':
        try:
            # Récupérer d'abord l'utilisateur
            user = CustomUser.objects.get(id=id)
            
            # Puis récupérer le comptable associé
            try:
                directeur = DirecteurFinancier.objects.get(user=user)
                
                # Analyser les données de la requête
                try:
                    data = json.loads(request.body)
                    
                    # Séparer les données pour CustomUser et Comptable
                    user_data = {}
                    directeur_data = {}
                    
                    # Assigner les champs aux objets appropriés
                    for key, value in data.items():
                        if key in ['username', 'email', 'password']:
                            user_data[key] = value
                        elif key in [ 'telephone', 'departement', 'specialite',]:
                            directeur_data[key] = value
                    
                    # Mettre à jour CustomUser
                    if user_data:
                        for key, value in user_data.items():
                            if key == 'password':
                                user.set_password(value)
                            else:
                                setattr(user, key, value)
                        user.save()
                    
                    # Mettre à jour directeur
                    if directeur_data:
                        for key, value in directeur_data.items():
                            setattr(directeur, key, value)
                        directeur.save()
                    
                    return JsonResponse({"status": "success", "message": "Profil mis à jour avec succès"})
                    
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Données JSON invalides"}, status=400)
                    
            except DoesNotExist:
                # L'utilisateur existe mais pas le profil comptable
                return JsonResponse({"error": "Profil comptable non trouvé"}, status=404)
                
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    elif request.method == 'DELETE':
        try:
            # Récupérer l'utilisateur
            user = CustomUser.objects.get(id=id)
            
            # Le document Comptable sera supprimé automatiquement grâce à CASCADE
            user.delete()
            return JsonResponse({"status": "success", "message": "Compte supprimé avec succès"})
            
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)
from datetime import datetime, timedelta
# Vue pour la demande de réinitialisation du mot de passe
import json

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.reset_token = str(uuid.uuid4()) # Convert UUID to string
            user.reset_token_expires = datetime.datetime.now() + timedelta(hours=24)
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
from django.utils.timezone import now  # Import correct pour le timezone aware datetime
from django.utils.timezone import make_aware, get_current_timezone
from django.utils.timezone import is_naive

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    try:
        data = json.loads(request.body)
        token = data.get('token')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if not token:
            return Response({"detail": "Token manquant"}, status=400)

        if not new_password or not confirm_password:
            return Response({"detail": "Nouveau mot de passe manquant"}, status=400)

        if new_password != confirm_password:
            return Response({"detail": "Les mots de passe ne correspondent pas."}, status=400)

        try:
            user = CustomUser.objects.get(reset_token=token)
        except CustomUser.DoesNotExist:
            return Response({"detail": "Lien invalide ou expiré."}, status=404)

        # Vérification de l'expiration du token
        current_time = now()  # Utilisez now() de django.utils.timezone
        token_expires = user.reset_token_expires

        if token_expires is None:
            return Response({"detail": "Token invalide (pas de date d'expiration)."}, status=400)

        if is_naive(token_expires):
            token_expires = make_aware(token_expires, get_current_timezone())

        if token_expires < current_time:
            return Response({"detail": "Lien expiré."}, status=400)

        # Mise à jour du mot de passe
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        user.save()

        return Response({"detail": "Mot de passe réinitialisé avec succès."}, status=200)

    except json.JSONDecodeError:
        return Response({"detail": "Données JSON invalides"}, status=400)
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

# Vue de déconnexion
from django.utils.timezone import is_naive, make_aware, get_current_timezone
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import JsonResponse
from django.contrib.auth import logout
from django.http import HttpResponse
# Vue de déconnexion
from django.views.decorators.csrf import csrf_exempt
# LogoutView pour gérer la déconnexion (blacklist du token)
#@csrf_exempt
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
    redirect_uri = "http://localhost:3000/auth/google/callback"
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
        user = CustomUser.objects.create(
            email=email,
            username=username,
            role="admin",  # Vous pourriez vouloir changer ce rôle par défaut
            password="",  # Auth externe
            is_active=True
        )

    # 4. Générer le JWT (version corrigée)
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow()
    }

    jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return JsonResponse({
        "token": jwt_token,
        "role": user.role,
        "user_id": str(user.id),
        "email": user.email
    })

#from rest_framework_simplejwt.tokens import UntypedToken
#from rest_framework_simplejwt.exceptions import InvalidToken
#from .serializers import ComptableSerializer

class ComptableProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]  # Force JWT

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
from rest_framework_simplejwt.authentication import JWTAuthentication
@csrf_exempt
def api_rapports(request, id=None):
    try:
        if request.method == 'GET':
            if id and id != 'undefined':
                try:
                    rapport = Rapport.objects.get(id=id)
                    rapport_data = {
                        'id': str(rapport.id),
                        'nom': rapport.nom,
                        'type': rapport.type,
                        'statut': rapport.statut,
                        'date': rapport.date.isoformat(),
                        'contenu': rapport.contenu,
                        'facture_id': rapport.facture_id,
                        'created_at': rapport.created_at.isoformat(),
                        'updated_at': rapport.updated_at.isoformat() if rapport.updated_at else None,
                        'validated_at': rapport.validated_at.isoformat() if rapport.validated_at else None
                    }
                    return JsonResponse(rapport_data)
                except DoesNotExist:
                    return JsonResponse({"error": "Rapport non trouvé"}, status=404)
                except ValidationError:
                    return JsonResponse({"error": "ID de rapport invalide"}, status=400)
            else:
                # Ensure we're only selecting fields that exist in the model
                rapports = Rapport.objects.only(
                    'id', 'nom', 'type', 'statut', 'date', 'facture_id'
                )
                rapports_list = [{
                    'id': str(rapport.id),
                    'nom': rapport.nom,
                    'type': rapport.type,
                    'statut': rapport.statut,
                    'date': rapport.date.isoformat(),
                    'facture_id': rapport.facture_id
                } for rapport in rapports]
                return JsonResponse({'rapports': rapports_list}, safe=False)

        elif request.method == 'POST':
            try:
                data = json.loads(request.body)
                
                rapport = Rapport(
                    nom=data.get('nom', 'Nouveau Rapport'),
                    type=data.get('type', 'Financier'),
                    statut=data.get('statut', 'Brouillon'),
                    contenu=data.get('contenu', ''),
                    facture_id=data.get('facture_id')
                )
                
                if 'date' in data:
                    try:
                        rapport.date = dt.fromisoformat(data['date'])
                    except ValueError:
                        return JsonResponse({"error": "Format de date invalide"}, status=400)
                
                rapport.save()
                
                return JsonResponse({
                    "status": "success", 
                    "message": "Rapport créé avec succès",
                    "id": str(rapport.id)
                }, status=201)
                
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)
            except ValidationError as e:
                return JsonResponse({"error": str(e)}, status=400)

        elif request.method == 'PUT':
            if not id or id == 'undefined':
                return JsonResponse({"error": "ID de rapport requis"}, status=400)
            
            try:
                # Parse les données JSON
                try:
                    data = json.loads(request.body)
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Données JSON invalides"}, status=400)

                # Récupère le rapport existant
                try:
                    rapport = Rapport.objects.get(id=id)
                except (DoesNotExist, ValidationError):
                    return JsonResponse({"error": "Rapport non trouvé"}, status=404)

                # Liste des champs autorisés à être mis à jour
                fields_to_update = ['nom', 'type', 'statut', 'contenu', 'facture_id']
                for field in fields_to_update:
                    if field in data:
                        setattr(rapport, field, data[field] if data[field] is not None else "")

                # Gestion spéciale pour la date
                if 'date' in data:
                    if data['date']:
                        try:
                            rapport.date = dt.fromisoformat(data['date'])
                        except ValueError:
                            return JsonResponse({"error": "Format de date invalide"}, status=400)
                    else:
                        rapport.date = None

                # Mise à jour du statut
                if data.get('statut') == 'Validé':
                    rapport.validated_at = dt.now()

                # Sauvegarde
                rapport.save()

                # Construction de la réponse
                response_data = {
                    "status": "success", 
                    "message": "Rapport mis à jour avec succès",
                    "data": {
                        "id": str(rapport.id),
                        "nom": rapport.nom,
                        "type": rapport.type,
                        "statut": rapport.statut,
                        "date": rapport.date.isoformat() if rapport.date else None,
                        "contenu": rapport.contenu,
                        "facture_id": rapport.facture_id
                    }
                }
                return JsonResponse(response_data)

            except Exception as e:
                # Log l'erreur complète pour le débogage
                import traceback
                traceback.print_exc()
                return JsonResponse({
                    "error": "Erreur lors de la mise à jour du rapport",
                    "details": str(e)
                }, status=500)

        elif request.method == 'DELETE':
            if not id or id == 'undefined':
                return JsonResponse({"error": "ID de rapport requis"}, status=400)
            
            try:
                rapport = Rapport.objects.get(id=id)
                rapport.delete()
                return JsonResponse({
                    "status": "success", 
                    "message": "Rapport supprimé avec succès"
                })
            except DoesNotExist:
                return JsonResponse({"error": "Rapport non trouvé"}, status=404)
        
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    except Exception as e:
        return JsonResponse({"error": f"Erreur serveur: {str(e)}"}, status=500)

 
    
    

#tokenview
# api/views.py


from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer




#haja jdyde 

class ProtectedExampleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response({"error": "Token invalide"}, status=401)

        token = auth_header.split(" ")[1]

        try:
            # Remplace 'middleware.decode' par 'jwt.decode'
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            
            # Assure-toi que le modèle CustomUser est bien importé
            user = CustomUser.objects.get(id=payload.get("user_id"))

            if user.last_token != token:
                return Response({"error": "Ce token n’est plus valide"}, status=401)

            return Response({"message": "Accès autorisé", "email": user.email})
        
        except jwt.ExpiredSignatureError:
            return Response({"error": "Token expiré"}, status=401)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


#Auditttttttttttttttttttttttttttttt
def log_action(user, audit, type_action, description, details):
    print(f"Tentative de log pour {user}, action: {type_action}")
    
    # Temporairement, ne pas vérifier l'authentification
    try:
        action = ActionLog.objects.create(
            user=user,
            audit=audit,
            type_action=type_action,
            description=description,
            details=details
        )
        print(f"Log enregistré avec succès, ID: {action.id}")
        return True
    except Exception as e:
        print(f"ERREUR DE LOG: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
@csrf_exempt
def AuditApi(request, id=None):
    print(f"Utilisateur connecté: {request.user}, authentifié: {request.user.is_authenticated if hasattr(request.user, 'is_authenticated') else 'N/A'}")
    if request.method == 'GET':
        if id and id != 'undefined':
            try:
                audit = AuditFinancier.objects.get(id=id)
                audit_data = {
                    'id': str(audit.id),
                    'nom': audit.nom,
                    'type': audit.type,
                    'responsable': audit.responsable,
                    'date_debut': audit.date_debut.isoformat(),
                    'date_fin': audit.date_fin.isoformat(),
                    'statut': audit.statut,
                    'priorite': audit.priorite,  # Inclure la priorité
                    'description': audit.description,
                    'observations': audit.observations
                }
                return JsonResponse(audit_data)
            except DoesNotExist:
                return JsonResponse({"error": "Audit non trouvé"}, status=404)
            except ValidationError:
                return JsonResponse({"error": "ID d'audit invalide"}, status=400)
        else:
            audits = AuditFinancier.objects.all()
            audits_list = [{
                'id': str(audit.id),
                'nom': audit.nom,
                'type': audit.type,
                'statut': audit.statut,
                'date_debut': audit.date_debut.isoformat(),
                'responsable': audit.responsable,
                'priorite': audit.priorite  # Ajouter la priorité ici
            } for audit in audits]
            return JsonResponse({'audits': audits_list}, safe=False)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['nom', 'type', 'responsable', 'date_debut', 'date_fin']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({"error": f"Champ requis manquant: {field}"}, status=400)

            try:
                date_debut = datetime.datetime.fromisoformat(data['date_debut'])
                date_fin = datetime.datetime.fromisoformat(data['date_fin'])
            except (ValueError, TypeError):
                return JsonResponse({"error": "Format de date invalide. Utilisez le format ISO (YYYY-MM-DDTHH:MM:SS)"}, status=400)

            if date_debut > date_fin:
                return JsonResponse({"error": "La date de début doit être antérieure à la date de fin"}, status=400)

            audit = AuditFinancier(
                nom=data['nom'],
                type=data['type'],
                responsable=data['responsable'],
                date_debut=date_debut,
                date_fin=date_fin,
                statut=data.get('statut', 'Planifié'),
                priorite=data.get('priorite', 'Moyenne'),
                description=data.get('description', ''),
                observations=data.get('observations', [])
            )
            audit.save()

            log_action(
                user=request.user,
                audit=audit,
                type_action='ajout_audit',
                description=f"Ajout de l'audit: {audit.nom}",
                details=f"Audit de type {audit.type} créé le {datetime.datetime.now().strftime('%d/%m/%Y')}"
            )

            return JsonResponse({
                "status": "success",
                "message": "Audit créé avec succès",
                "id": str(audit.id)
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

    elif request.method == 'PUT':
        if not id or id == 'undefined':
            return JsonResponse({"error": "ID d'audit requis"}, status=400)
        try:
            audit = AuditFinancier.objects.get(id=id)
            data = json.loads(request.body)

            for field in ['nom', 'type', 'responsable', 'date_debut', 'date_fin', 'statut', 'priorite', 'description', 'observations']:
                if field in data:
                    setattr(audit, field, datetime.datetime.fromisoformat(data[field]) if 'date' in field else data[field])

            audit.save()

            log_action(
                user=request.user,
                audit=audit,
                type_action='modification_audit',
                description=f"Modification de l'audit: {audit.nom}",
                details=f"Audit de type {audit.type} modifié le {datetime.datetime.now().strftime('%d/%m/%Y')}"
            )

            return JsonResponse({
                "status": "success",
                "message": "Audit mis à jour avec succès",
                "audit": {
                    "id": str(audit.id),
                    "nom": audit.nom,
                    "type": audit.type,
                    "responsable": audit.responsable,
                    "date_debut": audit.date_debut.isoformat(),  # Formater en ISO
                    "date_fin": audit.date_fin.isoformat(),      # Formater en ISO
                    "priorite": audit.priorite,
                    "statut": audit.statut,
                    "description": audit.description
                }
            })

        except DoesNotExist:
            return JsonResponse({"error": "Audit non trouvé"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except ValueError:
            return JsonResponse({"error": "Format de date invalide"}, status=400)

    elif request.method == 'DELETE':
        if not id or id == 'undefined':
            return JsonResponse({"error": "ID d'audit requis"}, status=400)
        try:
            audit = AuditFinancier.objects.get(id=id)

            log_action(
                user=request.user,
                audit=audit,
                type_action='suppression_audit',
                description=f"Suppression de l'audit: {audit.nom}",
                details=f"Audit de type {audit.type} supprimé le {datetime.datetime.now().strftime('%d/%m/%Y')}"
            )

            audit.delete()
            return JsonResponse({"status": "success", "message": "Audit supprimé avec succès"})

        except DoesNotExist:
            return JsonResponse({"error": "Audit non trouvé"}, status=404)

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)
#ai
# api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .ai_service import GeminiAI
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_ai(request):
    prompt = request.data.get('prompt')
    if not prompt:
        return Response({"error": "Prompt required"}, status=400)
    
    try:
        ai = GeminiAI()
        response = ai.generate_response(prompt)
        return Response({"response": response})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

import json
from datetime import datetime
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import CustomUser, Compte,ActionLog

logger = logging.getLogger(__name__)

@csrf_exempt
def CompteApi(request, id=None):
    if request.method != 'POST' and (not id or id == 'undefined'):
        return JsonResponse({"error": "ID utilisateur requis"}, status=400)

    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(id=id)
            try:
                compte = Compte.objects.get(user=user)
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'statut': compte.statut,
                }
                return JsonResponse(user_data)
            except Compte.DoesNotExist:
                return JsonResponse({
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'error': "Profil non trouvé"
                })
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

    elif request.method == 'DELETE':
        try:
            user = CustomUser.objects.get(id=id)
            # Journalisation
            logger.info(f"Suppression du compte utilisateur {user.username}")
            user.delete()
            return JsonResponse({"status": "success", "message": "Compte supprimé avec succès"})
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

    elif request.method == 'PATCH':
        try:
            user = CustomUser.objects.get(id=id)
            compte = Compte.objects.get(user=user)
            # Journalisation
            logger.info(f"Désactivation du compte utilisateur {user.username}")
            compte.statut = "Inactif"
            compte.save()
            return JsonResponse({"status": "success", "message": "Compte désactivé (signalement)"})
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Compte.DoesNotExist:
            return JsonResponse({"error": "Compte non trouvé pour cet utilisateur"}, status=404)

    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)
    
@csrf_exempt
def ListeComptes(request):
    if request.method == 'GET':
        try:
            # Récupération directe des utilisateurs avec rôle filtré
            users = CustomUser.objects.filter(
                role__in=['comptable', 'directeur']
            )
            
            users_data = []
            for user in users:
                try:
                    compte = Compte.objects.get(user=user)
                    users_data.append({
                        'id': str(user.id),
                        'nom': user.username,
                        'email': user.email,
                        'role': user.role,
                        'statut': compte.statut
                    })
                except Compte.DoesNotExist:
                    continue
            
            return JsonResponse({'users': users_data})
        except Exception as e:
            logger.error(f"Erreur: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)
logger = logging.getLogger(__name__)

@csrf_exempt
def SignalerCompte(request):
    if request.method == 'POST':
        try:
            # Récupération des données
            data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
            
            user_id = data.get('user_id')
            motif = data.get('motif')
            description = data.get('description')

            if not all([user_id, motif, description]):
                return JsonResponse({
                    "status": "error",
                    "message": "Tous les champs (user_id, motif, description) sont requis"
                }, status=400)

            # Récupération des objets avec MongoEngine
            user = CustomUser.objects.get(id=user_id)
            compte = Compte.objects.get(user=user)

            # Mise à jour du compte
            compte.update(
                statut="Inactif",
                motif_signalement=motif,
                description_signalement=description,
                date_signalement=datetime.datetime.now()
            )

            # Vérification et traitement de l'expéditeur
            expediteur = None
            if hasattr(request, 'user') and not request.user.is_anonymous:
                try:
                    expediteur = CustomUser.objects.get(id=request.user.id)
                except CustomUser.DoesNotExist:
                    logger.warning(f"Utilisateur expéditeur {request.user.id} non trouvé")

            # Création de la notification
            notification = Notification(
                destinataire=user,
                expediteur=expediteur,  # Soit None soit un CustomUser valide
                titre="Signalement de votre compte",
                message=f"Votre compte a été signalé. Motif: {motif}",
                type_notification='signalement'
            )
            notification.save()

            logger.info(f"Notification créée: {notification.id} pour {user.username}")

            return JsonResponse({
                "status": "success",
                "message": "Compte signalé et notification créée",
                "notification_id": str(notification.id)
            })

        except CustomUser.DoesNotExist:
            return JsonResponse({
                "status": "error",
                "message": "Utilisateur non trouvé"
            }, status=404)
        except Compte.DoesNotExist:
            return JsonResponse({
                "status": "error",
                "message": "Compte non trouvé"
            }, status=404)
        except Exception as e:
            logger.error(f"Erreur lors du signalement: {str(e)}", exc_info=True)
            return JsonResponse({
                "status": "error",
                "message": "Erreur interne du serveur"
            }, status=500)

    return JsonResponse({
        "status": "error",
        "message": "Méthode non autorisée"
    }, status=405)

from datetime import datetime




from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import ActionLog, CustomUser, DirecteurFinancier, Comptable

@csrf_exempt
def AdminActionsApi(request):
    if request.method == 'GET':
        try:
            filter_type = request.GET.get('filter_type', None)
            # Récupérer toutes les actions sans filtrer par utilisateur spécifique
            actions = ActionLog.objects.all()
             # Filtrer si demandé
            if filter_type and filter_type != 'Tous':
                # Convertir la valeur d'affichage en valeur stockée
                stored_value = next((key for key, value in ActionLog.TYPES_ACTION if value == filter_type), None)
                if stored_value:
                    actions = actions.filter(type_action=stored_value)
            
            actions = actions.order_by('-date_action')
            
            # Sérialiser les données
            actions_list = []
            for action in actions:
                print(f"Action brute: {action.type_action}, affichée: {action.get_type_action_display()}")
                actions_list.append({
                    'id': str(action.id),
                    'username': action.user.username,
                    'email': action.user.email,
                    'role': action.user.role,
                    'action_type': action.get_type_action_display(),
                    'description': action.description,
                    'audit': action.audit.nom if action.audit else 'N/A',
                    'timestamp': action.date_action.strftime('%d/%m/%Y %H:%M'),
                    'details': action.details
                })
                
            return JsonResponse({'actions': actions_list}, safe=False)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

@csrf_exempt
def MesActionsApi(request):
    if request.method == 'GET':
        try:
            # Récupérer l'utilisateur actuel
            user_id = request.GET.get('user_id')  # Vous devrez adapter cette partie selon votre système d'authentification
            user = CustomUser.objects.get(id=user_id)
            
            # Récupérer les actions de cet utilisateur
            actions = ActionLog.objects.filter(user=user).order_by('-date_action')
            
            # Sérialiser les données
            actions_list = []
            for action in actions:
                actions_list.append({
                    'id': str(action.id),
                    'username': action.user.username,
                    'email': action.user.email,
                    'role': action.user.role,
                    'action_type': action.get_type_action_display(),
                    'description': action.description,
                    'audit': action.audit.nom if action.audit else 'N/A',
                    'timestamp': action.date_action.strftime('%d/%m/%Y %H:%M'),
                    'details': action.details
                })
                
            return JsonResponse({'actions': actions_list}, safe=False)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)
#importer facture
logger = logging.getLogger(__name__)
@csrf_exempt
def facture_api(request, id=None):
    try:
        if request.method == 'GET':
            if id:
                facture = Facture.objects.get(id=ObjectId(id))
                return JsonResponse({
                    'id': str(facture.id),
                    'numero': facture.numero,
                    'fichier_url': request.build_absolute_uri(f'/api/factures/{facture.id}/download/'),
                    'filename': facture.fichier.filename if facture.fichier else None
                })
            else:
                factures = Facture.objects.all()
                return JsonResponse([{
                    'id': str(f.id),
                    'numero': f.numero,
                    'fichier_url': request.build_absolute_uri(f'/api/factures/{f.id}/download/') if f.fichier else None,
                    'filename': f.fichier.filename if f.fichier else None
                } for f in factures], safe=False)
                
        elif request.method == 'POST':
            if 'fichier' not in request.FILES:
                return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)
            
            fichier = request.FILES['fichier']
            if not fichier.name.lower().endswith('.pdf'):
                return JsonResponse({'error': 'Seuls les fichiers PDF sont acceptés'}, status=400)
            
            numero = request.POST.get('numero')
            if not numero:
                return JsonResponse({'error': 'Le numéro de facture est requis'}, status=400)
            
            if Facture.objects.filter(numero=numero).count() > 0:
                return JsonResponse({'error': 'Ce numéro de facture existe déjà'}, status=400)
            
            facture = Facture(numero=numero)
            facture.fichier.put(fichier, content_type='application/pdf', filename=fichier.name)
            facture.save()
            
            return JsonResponse({
                'id': str(facture.id),
                'numero': facture.numero,
                'fichier_url': request.build_absolute_uri(f'/api/factures/{facture.id}/download/'),
                'filename': fichier.name
            }, status=201)
            
        elif request.method == 'DELETE':
            if not id:
                return JsonResponse({'error': 'ID requis'}, status=400)
                
            facture = Facture.objects.get(id=ObjectId(id))
            facture.delete()
            return JsonResponse({'message': 'Facture supprimée'})
            
    except (DoesNotExist, InvalidId):
        return JsonResponse({'error': 'Facture non trouvée'}, status=404)
    except Exception as e:
        logger.error(f"Erreur: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

@csrf_exempt
def download_facture(request, id):
    try:
        facture = Facture.objects.get(id=ObjectId(id))
        
        if not facture.fichier:
            return JsonResponse({'error': 'Aucun fichier associé à cette facture'}, status=404)
        
        # Utilisation directe de GridFS
        data = facture.fichier.read()
        response = HttpResponse(data, content_type='application/pdf')
        
        filename = facture.fichier.filename or f'facture-{facture.numero}.pdf'
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
            
    except (DoesNotExist, InvalidId):
        return JsonResponse({'error': 'Facture non trouvée'}, status=404)
    except Exception as e:
        logger.error(f"Erreur téléchargement: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def facebook_auth_callback(request):
    code = request.data.get('code')
    print("Code Facebook reçu:", code)

    if not code:
        return JsonResponse({"error": "Code non fourni"}, status=400)

    # 1. Obtenir le token d'accès depuis Facebook
    token_url = "https://graph.facebook.com/v18.0/oauth/access_token"
    redirect_uri = "http://localhost:3000/auth/facebook/callback"
    client_id = "3737484549889496"  # Votre App ID Facebook
    client_secret = "b0bf5f776c2dbfb0dd69a91c6191b3de"  # À mettre dans les variables d'environnement

    token_params = {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code
    }

    token_response = requests.get(token_url, params=token_params)
    if token_response.status_code != 200:
        return JsonResponse({"error": "Erreur token Facebook"}, status=400)

    tokens = token_response.json()
    access_token = tokens.get("access_token")

    # 2. Récupérer les infos utilisateur
    user_info_url = "https://graph.facebook.com/me"
    user_info_params = {
        "fields": "id,name,email,picture",
        "access_token": access_token
    }

    user_info_response = requests.get(user_info_url, params=user_info_params)
    if user_info_response.status_code != 200:
        return JsonResponse({"error": "Erreur récupération infos utilisateur"}, status=400)

    user_info = user_info_response.json()
    print("Réponse Facebook:", user_info)

    email = user_info.get("email")
    if not email:
        return JsonResponse({"error": "Email non récupéré depuis Facebook"}, status=400)

    username = user_info.get("name", email.split("@")[0])
    facebook_id = user_info.get("id")

    # 3. Vérifier ou créer l'utilisateur dans MongoEngine
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        user = CustomUser.objects.create(
            email=email,
            username=username,
            facebook_id=facebook_id,  # Stocker l'ID Facebook si besoin
            role="user",  # Par défaut
            password="",  # Auth externe
            is_active=True
        )

    # 4. Générer le JWT (identique à Google)
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow()
    }

    jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return JsonResponse({
        "token": jwt_token,
        "role": user.role,
        "user_id": str(user.id),
        "username": user.username
    })



#reeeeeeeleveeeeeee bancaireeeeee
logger = logging.getLogger(__name__)
@csrf_exempt
def releve_api(request, id=None):
    try:
        if request.method == 'GET':
            if id:
                releve = Banque.objects.get(id=ObjectId(id))
                return JsonResponse({
                    'id': str(releve.id),
                    'numero': releve.numero,
                    'fichier_url': request.build_absolute_uri(f'/api/banques/{releve.id}/download/'),
                    'filename': releve.fichier.filename if releve.fichier else None
                })
            else:
                releves = Banque.objects.all()
                return JsonResponse([{
                    'id': str(f.id),
                    'numero': f.numero,
                    'fichier_url': request.build_absolute_uri(f'/api/banques/{f.id}/download/') if f.fichier else None,
                    'filename': f.fichier.filename if f.fichier else None
                } for f in releves], safe=False)
                
        elif request.method == 'POST':
            if 'fichier' not in request.FILES:
                return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)
            
            fichier = request.FILES['fichier']
            if not fichier.name.lower().endswith('.pdf'):
                return JsonResponse({'error': 'Seuls les fichiers PDF sont acceptés'}, status=400)
            
            numero = request.POST.get('numero')
            if not numero:
                return JsonResponse({'error': 'Le numéro de releve est requis'}, status=400)
            
            if Banque.objects.filter(numero=numero).count() > 0:
                return JsonResponse({'error': 'Ce numéro de releve existe déjà'}, status=400)
            
            releve = Banque(numero=numero)
            releve.fichier.put(fichier, content_type='application/pdf', filename=fichier.name)
            releve.save()
            
            return JsonResponse({
                'id': str(releve.id),
                'numero': releve.numero,
                'fichier_url': request.build_absolute_uri(f'/api/banques/{releve.id}/download/'),
                'filename': fichier.name
            }, status=201)
            
        elif request.method == 'DELETE':
            if not id:
                return JsonResponse({'error': 'ID requis'}, status=400)
                
            releve = Banque.objects.get(id=ObjectId(id))
            releve.delete()
            return JsonResponse({'message': 'Relevé supprimée'})
            
    except (DoesNotExist, InvalidId):
        return JsonResponse({'error': 'Relevé non trouvée'}, status=404)
    except Exception as e:
        logger.error(f"Erreur: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

@csrf_exempt
def download_releve(request, id):
    try:
        releve = Banque.objects.get(id=ObjectId(id))
        
        if not releve.fichier:
            return JsonResponse({'error': 'Aucun fichier associé à cette releve'}, status=404)
        
        # Utilisation directe de GridFS
        data = releve.fichier.read()
        response = HttpResponse(data, content_type='application/pdf')
        
        filename = releve.fichier.filename or f'relevé-{releve.numero}.pdf'
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
            
    except (DoesNotExist, InvalidId):
        return JsonResponse({'error': 'Relevé non trouvée'}, status=404)
    except Exception as e:
        logger.error(f"Erreur téléchargement: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
    






from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import datetime
from .models import Notification


@api_view(['GET'])
@csrf_exempt
@permission_classes([AllowAny]) 
def mes_notifications(request):
    try:
        # Si vous voulez tester sans authentification, vous pouvez utiliser 
        # cette approche temporaire (SEULEMENT POUR DÉVELOPPEMENT)
        from api.models import CustomUser, Notification
        # Remplacez par l'ID ou l'username d'un utilisateur de test
        test_user = CustomUser.objects.first()  
        
        notifications = Notification.objects(destinataire=test_user).order_by('-date_creation')
        data = []
        for n in notifications:
            data.append({
                "id": str(n.id),
                "titre": n.titre,
                "message": n.message,
                "type": n.type_notification,  # Notez que dans le React, c'est "type"
                "lue": n.lue,
                "date_creation": n.date_creation.strftime("%Y-%m-%d %H:%M:%S"),
            })
        # Format de réponse attendu par le composant React
        return JsonResponse({
            "status": "success",  # Ajout de status: "success"
            "notifications": data
        }, safe=False)
    except Exception as e:
        logger.error(f"Erreur récupération notifications: {str(e)}")
        return JsonResponse({"status": "error", "error": "Erreur serveur"}, status=500)
@csrf_exempt  
@require_http_methods(["PUT"])
def mark_notification_read(request, notification_id):
    """
    Marque une notification comme lue
    PUT: /api/notifications/{notification_id}/read/
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Non authentifié'
            }, status=401)
            
        user_id = request.user.id
        
        # Vérifier que la notification existe et appartient à l'utilisateur
        notification = Notification.objects(id=notification_id, destinataire=user_id).first()
        
        if not notification:
            return JsonResponse({
                'status': 'error',
                'message': 'Notification non trouvée ou non autorisée'
            }, status=404)
        
        # Marquer comme lue
        notification.lue = True
        notification.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification marquée comme lue'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def mark_all_notifications_read(request):
    """
    Marque toutes les notifications de l'utilisateur comme lues
    PUT: /api/notifications/read-all/
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Non authentifié'
            }, status=401)
            
        user_id = request.user.id
        
        # Mettre à jour toutes les notifications non lues de l'utilisateur
        result = Notification.objects(destinataire=user_id, lue=False).update(set__lue=True)
        
        return JsonResponse({
            'status': 'success',
            'message': f'{result} notifications marquées comme lues'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_notification(request, notification_id):
    """
    Supprime une notification
    DELETE: /api/notifications/{notification_id}/
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Non authentifié'
            }, status=401)
            
        user_id = request.user.id
        
        # Vérifier que la notification existe et appartient à l'utilisateur
        notification = Notification.objects(id=notification_id, destinataire=user_id).first()
        
        if not notification:
            return JsonResponse({
                'status': 'error',
                'message': 'Notification non trouvée ou non autorisée'
            }, status=404)
        
        # Supprimer la notification
        notification.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification supprimée'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_unread_count(request):
    """
    Récupère le nombre de notifications non lues
    GET: /api/notifications/unread-count/
    """
    try:
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'message': 'Non authentifié'
            }, status=401)
            
        user_id = request.user.id
        
        # Compter les notifications non lues
        count = Notification.objects(destinataire=user_id, lue=False).count()
        
        return JsonResponse({
            'status': 'success',
            'count': count
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)
    
@csrf_exempt
def user_stats(request):
    if request.method != 'GET':
        return JsonResponse({'status': False, 'error': 'Méthode non autorisée'}, status=405)
    
    try:
        # Comptages avec MongoEngine
        total = CustomUser.objects.count()
        admin = CustomUser.objects(role="admin").count()
        comptable = CustomUser.objects(role="comptable").count()
        directeur = CustomUser.objects(role="directeur").count()
        active = CustomUser.objects(is_active=True).count()
        inactive = total - active
        
        last_month = datetime.datetime.now() - timedelta(days=30)
        new_users = CustomUser.objects(date_joined__gte=last_month).count()
        
        return JsonResponse({
            'status': True,
            'data': {
                'stats': {
                    'total': total,
                    'admin': admin,
                    'comptable': comptable, 
                    'directeur': directeur,
                    'active': active,
                    'inactive': inactive,
                    'newUsers': new_users
                }
            }
        })
    except Exception as e:
        logger.error(f"Error in user_stats: {str(e)}")
        return JsonResponse({'status': False, 'error': str(e)}, status=500) 

@csrf_exempt
def users_stats(request):
    if request.method != 'GET':
        return JsonResponse({'status': False, 'error': 'Méthode non autorisée'}, status=405)
    
    try:
        # Total counts
        facture_count = Facture.objects.count()
        releve_count = Banque.objects.count()
        
        # New factures in last 30 days using created_at field
        last_month = datetime.datetime.now() - datetime.timedelta(days=30)
        new_factures = Facture.objects(created_at__gte=last_month).count()
        
        return JsonResponse({
            'status': True,
            'data': {
                'stats': {
                    'facture': facture_count,
                    'releve': releve_count,
                    'newFactures': new_factures
                }
            }
        })
    except Exception as e:
        logger.error(f"Error in user_stats: {str(e)}")
        return JsonResponse({'status': False, 'error': str(e)}, status=500)
    

from django.http import JsonResponse
from django.db.models import Q
from .models import CustomUser
from django.core.paginator import Paginator
from mongoengine.queryset.visitor import Q  # Le bon import pour MongoEngine

def search_users(request):
    try:
        # Récupération des paramètres avec valeurs par défaut
        query = request.GET.get('q', '').strip()
        try:
            page = int(request.GET.get('page', 1))
            limit = int(request.GET.get('limit', 10))
        except ValueError:
            return JsonResponse({
                'success': False,
                'message': 'Paramètres page/limit invalides'
            }, status=400)

        # Validation minimale
        if len(query) < 3:
            return JsonResponse({
                'success': True,
                'results': [],
                'total': 0
            })

        # Construction de la requête
        search_query = (
            Q(username__icontains=query) | 
            Q(email__icontains=query) |
            Q(role__icontains=query)
        )

        # Exécution avec gestion des erreurs
        queryset = CustomUser.objects.filter(search_query)
        paginator = Paginator(queryset, limit)
        
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)

        # Sérialisation
        results = [{
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active
        } for user in page_obj]

        return JsonResponse({
            'success': True,
            'results': results,
            'total': paginator.count,
            'page': page_obj.number,
            'total_pages': paginator.num_pages
        })

    except Exception as e:
        logger.error(f"Erreur recherche: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'message': 'Erreur serveur',
            'error_details': str(e)
        }, status=500)