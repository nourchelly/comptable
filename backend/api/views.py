from rest_framework.views import APIView
import logging
from bson.errors import InvalidId
from decimal import Decimal,InvalidOperation
from datetime import datetime as dt
from django.http import Http404, HttpResponse, JsonResponse,FileResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
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
                
                # Vérifier d'abord le mot de passe
                if not user.check_password(password):
                    if user.role in ['comptable', 'directeur']:
                        ActionLog(
                            user=user,
                            type_action='connexion',
                            description=f"Tentative de connexion échouée (mot de passe incorrect) pour {email}",
                            details=f"Rôle tenté: {role}",
                            statut="Échoué"
                        ).save()
                    return JsonResponse({'status': 'error', 'message': 'Mot de passe incorrect'}, status=401)
                
                # Vérifier ensuite le rôle
                if user.role != role:
                    if user.role in ['comptable', 'directeur']:
                        ActionLog(
                            user=user,
                            type_action='connexion',
                            description=f"Tentative de connexion échouée (rôle incorrect) pour {email}",
                            details=f"Rôle tenté: {role}, Rôle réel: {user.role}",
                            statut="Échoué"
                        ).save()
                    return JsonResponse({'status': 'error', 'message': 'Rôle incorrect'}, status=403)
                
                # Enregistrement seulement pour comptable et directeur
                if user.role in ['comptable', 'directeur']:
                    ActionLog(
                        user=user,
                        type_action='connexion',
                        description=f"Connexion réussie pour {user.email}",
                        details=f"Rôle: {user.role}",
                        statut="Terminé"
                    ).save()
                
                return JsonResponse({
                    'status': 'success',
                    'user': {
                        'id': str(user.id),
                        'email': user.email,
                        'username': user.username,
                        'role': user.role
                    }
                })
                
            except CustomUser.DoesNotExist:
                # On ne logue pas les tentatives avec email inexistant pour tous les rôles
                return JsonResponse({'status': 'error', 'message': 'Utilisateur non trouvé'}, status=404)
                
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Données JSON invalides'}, status=400)
        except Exception as e:
            # On logue les erreurs serveur seulement pour comptable/directeur
            if 'user' in locals() and user.role in ['comptable', 'directeur']:
                ActionLog(
                    type_action='connexion',
                    description="Erreur lors de la tentative de connexion",
                    details=str(e),
                    statut="Échoué"
                ).save()
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)
from django.views.decorators.csrf import csrf_exempt
import json
from .models import CustomUser,Compte  # Importez directement CustomUser
from django.http import JsonResponse
from django.utils import timezone

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
    # Fonction pour enregistrer les actions (uniquement pour les comptables)
    def log_action(user, action_type, description, details, statut):
        if user.role == 'comptable':  # Changement ici - seulement pour les comptables
            ActionLog(
                user=user,
                type_action=action_type,
                description=description,
                details=details,
                statut=statut
            ).save()

    # Vérifier si l'id est fourni et non vide
    if request.method != 'POST' and (not id or id == 'undefined'):
        return JsonResponse({"error": "ID utilisateur requis"}, status=400)
        
    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(id=id)
            
            try:
                comptable = Comptable.objects.get(user=user)
                
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'nom_complet': comptable.nom_complet,
                    'telephone': comptable.telephone,
                    'matricule': comptable.matricule,
                    'departement': comptable.departement,
                }
                
                log_action(
                    user=user,
                    action_type='consultation',
                    description=f"Consultation de son profil comptable",
                    details=f"Consultation des informations du compte {user.email}",
                    statut="Terminé"
                )
                
                return JsonResponse(user_data)
                
            except DoesNotExist:
                log_action(
                    user=user,
                    action_type='consultation',
                    description=f"Tentative de consultation profil comptable inexistant",
                    details=f"Profil comptable non trouvé pour {user.email}",
                    statut="Échoué"
                )
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
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)
            
            required_fields = ['user_id', 'nom_complet', 'telephone','matricule','departement']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return JsonResponse({
                    "error": "Champs requis manquants",
                    "champs_manquants": missing_fields
                }, status=400)
            
            try:
                user = CustomUser.objects.get(id=data['user_id'])
                
                if user.role != 'comptable':  # Vérification du rôle
                    return JsonResponse({
                        "error": "Seuls les comptables peuvent créer un profil comptable"
                    }, status=403)
                
                if Comptable.objects(user=user).first():
                    log_action(
                        user=user,
                        action_type='creation',
                        description="Tentative de création de profil existant",
                        details="Le profil comptable existe déjà",
                        statut="Échoué"
                    )
                    return JsonResponse({
                        "error": "Profil comptable existe déjà pour cet utilisateur"
                    }, status=400)
                
                comptable = Comptable(
                    user=user,
                    nom_complet=data['nom_complet'],
                    telephone=data['telephone'],
                    matricule=data['matricule'],
                    departement=data['departement']
                )
                comptable.save()
                
                log_action(
                    user=user,
                    action_type='creation',
                    description=f"Création du profil comptable",
                    details=f"Matricule: {data['matricule']} | Département: {data['departement']}",
                    statut="Terminé"
                )
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil comptable créé avec succès",
                    "comptable_id": str(comptable.id),
                    "user_id": str(user.id)
                }, status=201)
            
            except NotUniqueError as e:
                log_action(
                    user=user,
                    action_type='creation',
                    description="Erreur: téléphone déjà utilisé",
                    details=str(e),
                    statut="Échoué"
                )
                return JsonResponse({
                    "error": "Ce numéro de téléphone est déjà utilisé"
                }, status=400)
                
            except ValidationError as e:
                log_action(
                    user=user,
                    action_type='creation',
                    description="Erreur de validation des données",
                    details=str(e.to_dict()),
                    statut="Échoué"
                )
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
            
            if user.role != 'comptable':  # Vérification du rôle
                return JsonResponse({
                    "error": "Seuls les comptables peuvent modifier un profil comptable"
                }, status=403)
            
            try:
                comptable = Comptable.objects.get(user=user)
                
                try:
                    data = json.loads(request.body)
                    
                    user_data = {}
                    comptable_data = {}
                    
                    for key, value in data.items():
                        if key in ['username', 'email', 'password']:
                            user_data[key] = value
                        elif key in ['nom_complet', 'telephone', 'matricule', 'departement']:
                            comptable_data[key] = value
                    
                    if user_data:
                        for key, value in user_data.items():
                            if key == 'password':
                                user.set_password(value)
                            else:
                                setattr(user, key, value)
                        user.save()
                    
                    if comptable_data:
                        old_data = {
                            'nom_complet': comptable.nom_complet,
                            'telephone': comptable.telephone,
                            'matricule': comptable.matricule,
                            'departement': comptable.departement
                        }
                        
                        for key, value in comptable_data.items():
                            setattr(comptable, key, value)
                        comptable.save()
                        
                        changes = {
                            k: f"{old_data[k]} → {v}" 
                            for k, v in comptable_data.items() 
                            if old_data[k] != v
                        }
                        
                        log_action(
                            user=user,
                            action_type='modification',
                            description="Modification du profil comptable",
                            details=f"Changements: {changes}",
                            statut="Terminé"
                        )
                    
                    return JsonResponse({"status": "success", "message": "Profil mis à jour avec succès"})
                    
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Données JSON invalides"}, status=400)
                    
            except DoesNotExist:
                log_action(
                    user=user,
                    action_type='modification',
                    description="Tentative de modification profil inexistant",
                    details="Profil comptable non trouvé",
                    statut="Échoué"
                )
                return JsonResponse({"error": "Profil comptable non trouvé"}, status=404)
                
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    elif request.method == 'DELETE':
        try:
            user = CustomUser.objects.get(id=id)
            
            if user.role != 'comptable':  # Vérification du rôle
                return JsonResponse({
                    "error": "Seuls les comptables peuvent supprimer un profil comptable"
                }, status=403)
            
            comptable = Comptable.objects.get(user=user)
            log_action(
                user=user,
                action_type='suppression',
                description="Suppression du profil comptable",
                details=f"Matricule: {comptable.matricule}",
                statut="Terminé"
            )
            
            user.delete()
            return JsonResponse({"status": "success", "message": "Compte supprimé avec succès"})
            
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)
    #Directeur profil
@csrf_exempt
def ProfilDirecteurApi(request, id=None):
    # Fonction pour enregistrer les actions (uniquement pour les directeurs)
    def log_action(user, action_type, description, details, statut):
        if user.role == 'directeur':  # Seulement pour les directeurs
            ActionLog(
                user=user,
                type_action=action_type,
                description=description,
                details=details,
                statut=statut
            ).save()

    # Vérifier si l'id est fourni et non vide
    if request.method != 'POST' and (not id or id == 'undefined'):
        return JsonResponse({"error": "ID utilisateur requis"}, status=400)
        
    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(id=id)
            
            try:
                directeur = DirecteurFinancier.objects.get(user=user)
                
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'telephone': directeur.telephone,
                    'departement': directeur.departement,
                    'specialite': directeur.specialite,
                }
                
                log_action(
                    user=user,
                    action_type='consultation',
                    description="Consultation du profil directeur",
                    details=f"Consultation des informations du directeur {user.email}",
                    statut="Terminé"
                )
                
                return JsonResponse(user_data)
                
            except DoesNotExist:
                log_action(
                    user=user,
                    action_type='consultation',
                    description="Tentative de consultation profil directeur inexistant",
                    details=f"Profil directeur non trouvé pour {user.email}",
                    statut="Échoué"
                )
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
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)
            
            required_fields = ['user_id', 'telephone', 'departement', 'specialite']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return JsonResponse({
                    "error": "Champs requis manquants",
                    "champs_manquants": missing_fields
                }, status=400)
            
            try:
                user = CustomUser.objects.get(id=data['user_id'])
                
                if user.role != 'directeur':
                    return JsonResponse({
                        "error": "Seuls les directeurs peuvent créer un profil directeur"
                    }, status=403)
                
                if DirecteurFinancier.objects(user=user).first():
                    log_action(
                        user=user,
                        action_type='creation',
                        description="Tentative de création de profil existant",
                        details="Le profil directeur existe déjà",
                        statut="Échoué"
                    )
                    return JsonResponse({
                        "error": "Profil directeur existe déjà pour cet utilisateur"
                    }, status=400)
                
                directeur = DirecteurFinancier(
                    user=user,
                    telephone=data['telephone'],
                    departement=data['departement'],
                    specialite=data['specialite']
                )
                directeur.save()
                
                log_action(
                    user=user,
                    action_type='creation',
                    description="Création du profil directeur",
                    details=f"Département: {data['departement']} | Spécialité: {data['specialite']}",
                    statut="Terminé"
                )
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil directeur créé avec succès",
                    "directeur_id": str(directeur.id),
                    "user_id": str(user.id)
                }, status=201)
            
            except NotUniqueError as e:
                log_action(
                    user=user,
                    action_type='creation',
                    description="Erreur: téléphone déjà utilisé",
                    details=str(e),
                    statut="Échoué"
                )
                return JsonResponse({
                    "error": "Ce numéro de téléphone est déjà utilisé"
                }, status=400)
                
            except ValidationError as e:
                log_action(
                    user=user,
                    action_type='creation',
                    description="Erreur de validation des données",
                    details=str(e.to_dict()),
                    statut="Échoué"
                )
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
            
            if user.role != 'directeur':
                return JsonResponse({
                    "error": "Seuls les directeurs peuvent modifier un profil directeur"
                }, status=403)
            
            try:
                directeur = DirecteurFinancier.objects.get(user=user)
                
                try:
                    data = json.loads(request.body)
                    
                    user_data = {}
                    directeur_data = {}
                    
                    for key, value in data.items():
                        if key in ['username', 'email', 'password']:
                            user_data[key] = value
                        elif key in ['telephone', 'departement', 'specialite']:
                            directeur_data[key] = value
                    
                    if user_data:
                        for key, value in user_data.items():
                            if key == 'password':
                                user.set_password(value)
                            else:
                                setattr(user, key, value)
                        user.save()
                    
                    if directeur_data:
                        old_data = {
                            'telephone': directeur.telephone,
                            'departement': directeur.departement,
                            'specialite': directeur.specialite
                        }
                        
                        for key, value in directeur_data.items():
                            setattr(directeur, key, value)
                        directeur.save()
                        
                        changes = {
                            k: f"{old_data[k]} → {v}" 
                            for k, v in directeur_data.items() 
                            if old_data[k] != v
                        }
                        
                        log_action(
                            user=user,
                            action_type='modification',
                            description="Modification du profil directeur",
                            details=f"Changements: {changes}",
                            statut="Terminé"
                        )
                    
                    return JsonResponse({"status": "success", "message": "Profil mis à jour avec succès"})
                    
                except json.JSONDecodeError:
                    return JsonResponse({"error": "Données JSON invalides"}, status=400)
                    
            except DoesNotExist:
                log_action(
                    user=user,
                    action_type='modification',
                    description="Tentative de modification profil inexistant",
                    details="Profil directeur non trouvé",
                    statut="Échoué"
                )
                return JsonResponse({"error": "Profil directeur non trouvé"}, status=404)
                
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
    elif request.method == 'DELETE':
        try:
            user = CustomUser.objects.get(id=id)
            
            if user.role != 'directeur':
                return JsonResponse({
                    "error": "Seuls les directeurs peuvent supprimer un profil directeur"
                }, status=403)
            
            directeur = DirecteurFinancier.objects.get(user=user)
            log_action(
                user=user,
                action_type='suppression',
                description="Suppression du profil directeur",
                details=f"Département: {directeur.departement} | Spécialité: {directeur.specialite}",
                statut="Terminé"
            )
            
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
        try:
            serializer = PasswordResetRequestSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']

                if user:
                    if not user.is_active:
                        return Response(
                            {"detail": "Ce compte est désactivé."},
                            status=status.HTTP_403_FORBIDDEN
                        )

                    # Génération du token
                    user.reset_token = str(uuid.uuid4())
                    user.reset_token_expires = timezone.now() + timedelta(hours=1)  # Expiration réduite à 1 heure
                    user.save()

                    # Construction du lien
                    reset_link = f"{settings.FRONTEND_URL}/reset-password/{user.reset_token}/"

                    # Envoi d'email
                    try:
                        send_mail(
                            f'Réinitialisation de mot de passe ({user.get_role_display()})',
                            f'Cliquez sur ce lien pour réinitialiser votre mot de passe: {reset_link}',
                            settings.DEFAULT_FROM_EMAIL,
                            [user.email],
                            fail_silently=False,
                        )
                        print(f"Email de réinitialisation envoyé à {user.email}")
                        return Response(
                            {"detail": "Un lien de réinitialisation a été envoyé à votre email si un compte correspondant existe."},
                            status=status.HTTP_200_OK
                        )
                    except Exception as e:
                        print(f"Erreur d'envoi d'email: {str(e)}")
                        return Response(
                            {"detail": "Erreur lors de l'envoi de l'email."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                else:
                    return Response(
                        {"detail": "Un lien de réinitialisation a été envoyé à votre email si un compte correspondant existe."},
                        status=status.HTTP_200_OK
                    )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Erreur serveur: {str(e)}")
            return Response(
                {"detail": "Une erreur serveur est survenue."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    try:
        print(f"Reset password request received: {request.body}")
        data = json.loads(request.body)
        token = data.get('token')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        print(f"Token: {token}, New Password: {new_password}, Confirm Password: {confirm_password}")

        if not token:
            return Response({"detail": "Token manquant"}, status=400)

        if not new_password or not confirm_password:
            return Response({"detail": "Nouveau mot de passe manquant"}, status=400)

        if new_password != confirm_password:
            return Response({"detail": "Les mots de passe ne correspondent pas."}, status=400)

        try:
            # Utilisez directement CustomUser.objects.get avec les champs mongoengine
            user = CustomUser.objects.get(reset_token=token)
            print(f"User found: {user.email}, Reset Token Expires (DB): {user.reset_token_expires}")
        except CustomUser.DoesNotExist:
            return Response({"detail": "Lien invalide ou expiré."}, status=404)

        # Vérification de l'expiration du token
        current_time = now()
        token_expires = user.reset_token_expires

        print(f"Current Time (UTC): {current_time}")

        if token_expires is None:
            return Response({"detail": "Token invalide (pas de date d'expiration)."}, status=400)

        if is_naive(token_expires):
            # Interprétez l'heure naive comme étant en UTC
            token_expires = make_aware(token_expires, utc)
            print(f"Token Expires (aware, UTC): {token_expires}")
        else:
            print(f"Token Expires (already aware): {token_expires}")

        if token_expires < current_time:
            return Response({"detail": "Lien expiré."}, status=400)

        # Mise à jour du mot de passe
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        user.save()
        print(f"Password reset successful for user: {user.email}")
        return Response({"detail": "Mot de passe réinitialisé avec succès."}, status=200)

    except json.JSONDecodeError:
        return Response({"detail": "Données JSON invalides"}, status=400)
    except Exception as e:
        print(f"Error during reset password: {e}")
        return Response({"detail": str(e)}, status=500)
# Vue de déconnexion
from django.utils.timezone import now,utc,is_naive, make_aware, get_current_timezone
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
    
    print("Envoi de la requête token avec les données:", token_data)
    token_response = requests.post(token_url, data=token_data)
    print("Statut réponse token:", token_response.status_code)
    print("Contenu réponse token:", token_response.text)
    
    if token_response.status_code != 200:
        return JsonResponse({"error": f"Erreur token Google: {token_response.text}"}, status=400)
    
    tokens = token_response.json()
    access_token = tokens.get("access_token")
    
    # 2. Récupérer les infos utilisateur
    print("Récupération des infos utilisateur avec token:", access_token[:10] + "...")
    user_info_response = requests.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        params={"access_token": access_token}
    )
    
    print("Statut réponse userinfo:", user_info_response.status_code)
    print("Contenu réponse userinfo:", user_info_response.text)
    
    if user_info_response.status_code != 200:
        return JsonResponse({"error": f"Erreur récupération infos utilisateur: {user_info_response.text}"}, status=400)
    
    user_info = user_info_response.json()
    email = user_info.get("email", "").lower().strip()
    username = user_info.get("name", email.split("@")[0] if email else "")
    
    print(f"Email extrait: '{email}'")
    print(f"Username extrait: '{username}'")
    
    if not email:
        return JsonResponse({"error": "Email non récupéré"}, status=400)
    
    # 3. Vérifier ou créer l'utilisateur dans MongoEngine
    try:
        print(f"Recherche utilisateur avec email: {email}")
        user = CustomUser.objects.get(email=email)
        print(f"Utilisateur trouvé: {user.id}, rôle: {user.role}")
    except CustomUser.DoesNotExist:
        print(f"Utilisateur non trouvé, création d'un nouveau compte")
        try:
            user = CustomUser.objects.create(
                email=email,
                username=username,
                role="comptable",
                password="",
                is_active=True
            )
            print(f"Utilisateur créé avec ID: {user.id}")
        except Exception as e:
            print(f"Erreur lors de la création de l'utilisateur: {str(e)}")
            return JsonResponse({"error": f"Erreur création utilisateur: {str(e)}"}, status=400)
    
    # 4. Générer le JWT
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow()
    }
    
    print(f"Génération du JWT avec payload: {payload}")
    jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    
    return JsonResponse({
        "token": jwt_token,
        "role": user.role,
        "user_id": str(user.id),
        "email": user.email
    })

@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def facebook_auth_callback(request):
    code = request.data.get('code')
    print("Code Facebook reçu:", code)

    if not code:
        return JsonResponse({"error": "Code non fourni par Facebook"}, status=400)

    # 1. Obtenir le token d'accès depuis Facebook
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    redirect_uri = "http://localhost:3000/auth/facebook/callback"
    app_id = settings.FACEBOOK_APP_ID  # Utiliser les settings Django
    app_secret = settings.FACEBOOK_APP_SECRET  # Utiliser les settings Django

    token_params = {
        "code": code,
        "client_id": app_id,
        "client_secret": app_secret,
        "redirect_uri": redirect_uri,
    }

    print("Envoi de la requête de token Facebook avec les paramètres:", token_params)
    token_response = requests.post(token_url, params=token_params)
    print("Statut réponse token Facebook:", token_response.status_code)
    print("Contenu réponse token Facebook:", token_response.text)

    if token_response.status_code != 200:
        return JsonResponse({"error": f"Erreur token Facebook: {token_response.text}"}, status=400)

    tokens = token_response.json()
    access_token = tokens.get("access_token")

    if not access_token:
        return JsonResponse({"error": "Token d'accès Facebook non récupéré"}, status=400)

    # 2. Récupérer les infos utilisateur depuis Facebook
    user_info_url = "https://graph.facebook.com/v19.0/me"
    user_info_params = {
        "access_token": access_token,
        "fields": "id,name,email"  # Demander les champs nécessaires
    }

    print("Récupération des infos utilisateur Facebook avec token:", access_token[:10] + "...")
    user_info_response = requests.get(user_info_url, params=user_info_params)
    print("Statut réponse userinfo Facebook:", user_info_response.status_code)
    print("Contenu réponse userinfo Facebook:", user_info_response.text)

    if user_info_response.status_code != 200:
        return JsonResponse({"error": f"Erreur récupération infos utilisateur Facebook: {user_info_response.text}"}, status=400)

    user_info = user_info_response.json()
    email = user_info.get("email", "").lower().strip()
    username = user_info.get("name", email.split("@")[0] if email else "")
    facebook_id = user_info.get("id")

    print(f"Email Facebook extrait: '{email}'")
    print(f"Username Facebook extrait: '{username}'")
    print(f"Facebook ID extrait: '{facebook_id}'")

    if not email:
        return JsonResponse({"error": "Email non récupéré depuis Facebook"}, status=400)

    # 3. Vérifier ou créer l'utilisateur dans MongoEngine
    try:
        print(f"Recherche utilisateur avec email: {email}")
        user = CustomUser.objects.get(email=email)
        print(f"Utilisateur trouvé: {user.id}, rôle: {user.role}")
    except CustomUser.DoesNotExist:
        print(f"Utilisateur non trouvé, création d'un nouveau compte via Facebook")
        try:
            user = CustomUser.objects.create(
                email=email,
                username=username,
                role="comptable",
                password="",
                is_active=True
            )
            print(f"Utilisateur créé avec ID: {user.id}")
        except Exception as e:
            print(f"Erreur lors de la création de l'utilisateur via Facebook: {str(e)}")
            return JsonResponse({"error": f"Erreur création utilisateur Facebook: {str(e)}"}, status=400)

    # 4. Générer le JWT
    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow()
    }

    print(f"Génération du JWT avec payload: {payload}")
    jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return JsonResponse({
        "token": jwt_token,
        "role": user.role,
        "user_id": str(user.id),
        "email": user.email
    })
#rapport 
from .models import Rapport

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

@csrf_exempt
def AuditApi(request, id=None):
    """
    API pour la gestion des audits financiers (CRUD)
    """
    # Fonction pour enregistrer les actions (uniquement pour les directeurs)
    def log_action(user, action_type, description, details, statut="Terminé"):
        """Enregistre une action dans le journal d'audit"""
        if user and hasattr(user, 'role') and user.role == 'directeur':  # Vérifie que user existe et est directeur
            try:
                ActionLog(
                    user=user,
                    type_action=action_type,
                    description=description,
                    details=details,
                    statut=statut
                ).save()
            except Exception as e:
                print(f"Erreur lors de l'enregistrement du log: {str(e)}")
        else:
            # Pour le développement, enregistrez au moins dans la console ce qui aurait été journalisé
            print(f"[LOG] Type: {action_type} | Description: {description} | Détails: {details} | Statut: {statut}")

    # Pour les environnements de développement/test, on peut permettre les requêtes non authentifiées
    # En production, cette vérification devrait être réactivée avec un système d'authentification approprié
    user = request.user if request.user.is_authenticated else None
    
    # Si une action nécessite absolument un utilisateur, on vérifiera plus tard dans le code

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
                    'priorite': audit.priorite,
                    'description': audit.description,
                    'observations': audit.observations
                }
                
                # Log de consultation
                log_action(
                    user=user,
                    action_type='consultation',
                    description=f"Consultation de l'audit {audit.nom}",
                    details=f"ID: {audit.id}",
                    statut="Terminé"
                )
                
                return JsonResponse(audit_data)
            except DoesNotExist:
                # Log d'erreur
                log_action(
                    user=user,
                    action_type='consultation',
                    description="Tentative de consultation d'un audit inexistant",
                    details=f"ID: {id}",
                    statut="Échoué"
                )
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
                'priorite': audit.priorite
            } for audit in audits]
            
            # Log de consultation liste (si un utilisateur est connecté)
            if user:
                log_action(
                    user=user,
                    action_type='consultation',
                    description="Consultation de la liste des audits",
                    details=f"{len(audits_list)} audits trouvés",
                    statut="Terminé"
                )
            
            return JsonResponse({'audits': audits_list})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            required_fields = ['nom', 'type', 'responsable', 'date_debut', 'date_fin']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return JsonResponse({"error": f"Champs requis manquants: {', '.join(missing_fields)}"}, status=400)

            try:
                date_debut = datetime.datetime.fromisoformat(data['date_debut'])
                date_fin = datetime.datetime.fromisoformat(data['date_fin'])
            except (ValueError, TypeError):
                return JsonResponse({"error": "Format de date invalide"}, status=400)

            if date_debut > date_fin:
                return JsonResponse({"error": "La date de début ne peut pas être postérieure à la date de fin"}, status=400)

            audit = AuditFinancier(
                nom=data['nom'],
                type=data['type'],
                responsable=data['responsable'],
                date_debut=date_debut,
                date_fin=date_fin,
                statut=data.get('statut', 'Planifié'),
                priorite=data.get('priorite', 'Moyenne'),
                description=data.get('description', ''),
                observations=data.get('observations', []),
                user=user if user else None
            )
            audit.save()

            # Log de création
            log_action(
                user=user,
                action_type='creation',
                description=f"Création d'un nouvel audit",
                details=f"Nom: {audit.nom} | Type: {audit.type} | Statut: {audit.statut}",
                statut="Terminé"
            )

            return JsonResponse({
                "status": "success",
                "message": "Audit créé avec succès",
                "id": str(audit.id)
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)
        except ValidationError as e:
            # Log d'erreur
            log_action(
                user=user,
                action_type='creation',
                description="Erreur lors de la création d'un audit",
                details=str(e),
                statut="Échoué"
            )
            return JsonResponse({"error": str(e)}, status=400)

    elif request.method == 'PUT':
        if not id or id == 'undefined':
            return JsonResponse({"error": "ID d'audit requis"}, status=400)
            
        try:
            audit = AuditFinancier.objects.get(id=id)
            
            try:
                data = json.loads(request.body)
                
                # Sauvegarde des anciennes valeurs pour le log
                old_data = {
                    'nom': audit.nom,
                    'type': audit.type,
                    'responsable': audit.responsable,
                    'statut': audit.statut,
                    'priorite': audit.priorite
                }
                
                # Mise à jour des champs
                for field in ['nom', 'type', 'responsable', 'statut', 'priorite', 'description']:
                    if field in data:
                        setattr(audit, field, data[field])
                
                # Traitement spécial pour les dates
                for date_field in ['date_debut', 'date_fin']:
                    if date_field in data:
                        try:
                            setattr(audit, date_field, datetime.datetime.fromisoformat(data[date_field]))
                        except ValueError:
                            return JsonResponse({"error": f"Format de date invalide pour {date_field}"}, status=400)
                
                # Traitement spécial pour observations (liste)
                if 'observations' in data:
                    audit.observations = data['observations']
                
                # Vérification de cohérence des dates
                if audit.date_debut > audit.date_fin:
                    return JsonResponse({"error": "La date de début ne peut pas être postérieure à la date de fin"}, status=400)
                
                audit.save()
                
                # Identifier les changements pour le log
                changes = {
                    k: f"{old_data[k]} → {getattr(audit, k)}" 
                    for k in old_data 
                    if old_data[k] != getattr(audit, k)
                }
                
                # Log de modification
                log_action(
                    user=user,
                    action_type='modification',
                    description=f"Modification de l'audit {audit.nom}",
                    details=f"Changements: {changes}",
                    statut="Terminé"
                )
                
                return JsonResponse({
                    "status": "success",
                    "message": "Audit mis à jour avec succès",
                    "audit": {
                        "id": str(audit.id),
                        "nom": audit.nom,
                        "type": audit.type,
                        "responsable": audit.responsable,
                        "date_debut": audit.date_debut.isoformat(),
                        "date_fin": audit.date_fin.isoformat(),
                        "priorite": audit.priorite,
                        "statut": audit.statut,
                        "description": audit.description
                    }
                })
                
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)

        except DoesNotExist:
            # Log d'erreur
            log_action(
                user=user,
                action_type='modification',
                description="Tentative de modification d'un audit inexistant",
                details=f"ID: {id}",
                statut="Échoué"
            )
            return JsonResponse({"error": "Audit non trouvé"}, status=404)
        except ValidationError as e:
            return JsonResponse({"error": str(e)}, status=400)

    elif request.method == 'DELETE':
        if not id or id == 'undefined':
            return JsonResponse({"error": "ID d'audit requis"}, status=400)
            
        try:
            audit = AuditFinancier.objects.get(id=id)
            audit_name = audit.nom  # Sauvegarde du nom avant suppression
            
            # Log de suppression avant de supprimer l'audit
            log_action(
                user=user,
                action_type='suppression',
                description=f"Suppression de l'audit",
                details=f"Nom: {audit_name} | ID: {id}",
                statut="Terminé"
            )

            audit.delete()
            return JsonResponse({"status": "success", "message": "Audit supprimé avec succès"})

        except DoesNotExist:
            # Log d'erreur
            log_action(
                user=user,
                action_type='suppression',
                description="Tentative de suppression d'un audit inexistant",
                details=f"ID: {id}",
                statut="Échoué"
            )
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
            
            # Suppression du compte associé à l'utilisateur s'il existe
            try:
                compte = Compte.objects.get(user=user)
                compte.delete()
                logger.info(f"Compte associé supprimé pour {user.username}")
            except Compte.DoesNotExist:
                logger.info(f"Pas de compte associé trouvé pour {user.username}")
            
            # Suppression de l'utilisateur
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
            logger.info("Exécution de ListeComptes")
            
            # Solution 1: Inclure tous les utilisateurs comptables et directeurs, même sans compte
            users = CustomUser.objects.filter(role__in=['comptable', 'directeur'])
            users_data = []
            
            for user in users:
                user_data = {
                    'id': str(user.id),
                    'nom': str(user.username),
                    'email': str(user.email),
                    'role': str(user.role),
                }
                
                try:
                    # Tenter de récupérer le compte associé
                    compte = Compte.objects.get(user=user)
                    user_data['statut'] = str(compte.statut)
                except Compte.DoesNotExist:
                    # Si aucun compte n'existe, indiquer cela plutôt que d'ignorer l'utilisateur
                    user_data['statut'] = "Actif"
                
                users_data.append(user_data)
            
            logger.info(f"ListeComptes - données récupérées: {len(users_data)} utilisateurs")
            return JsonResponse({'users': users_data}, status=200)
        
        except Exception as e:
            logger.error(f"Erreur dans ListeComptes: {str(e)}")
            import traceback
            logger.error(f"Détails de l'erreur: {traceback.format_exc()}")
            return JsonResponse({"error": "Une erreur s'est produite lors de la récupération des comptes."}, status=500)
    
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

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
            
            # Récupération de l'utilisateur
            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse({
                    "status": "error",
                    "message": "Utilisateur non trouvé"
                }, status=404)
            
            # Récupération ou création du compte si nécessaire
            try:
                compte = Compte.objects.get(user=user)
            except Compte.DoesNotExist:
                # Création automatique d'un compte si l'utilisateur n'en a pas
                logger.info(f"Création d'un compte pour l'utilisateur {user.username} (id: {user_id})")
                compte = Compte(
                    user=user,
                    statut="Actif",
                    date_creation=datetime.datetime.now()
                )
                compte.save()
            
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
                expediteur=expediteur,
                titre="Signalement de votre compte",
                message=f"Votre compte a été signalé. Motif: {motif}",
                type_notification='signalement'
            )
            notification.save()
            
            return JsonResponse({
                "status": "success",
                "message": "Compte signalé et notification créée",
                "notification_id": str(notification.id)
            })
        
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




# Configurer le logger
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
                    'metadata': facture.metadata,
                    'fichier_url': request.build_absolute_uri(f'/api/factures/{facture.id}/download/'),
                    'filename': facture.fichier.filename if facture.fichier else None
                })
            else:
                factures = Facture.objects.all()
                return JsonResponse([{
                    'id': str(f.id),
                    'numero': f.numero,
                    'metadata': f.metadata,
                    'fichier_url': request.build_absolute_uri(f'/api/factures/{f.id}/download/') if f.fichier else None,
                    'filename': f.fichier.filename if f.fichier else None
                } for f in factures], safe=False)
                
        elif request.method == 'POST':
            if 'fichier' not in request.FILES:
                return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)

            fichier = request.FILES['fichier']
            
            if not fichier.name.lower().endswith('.pdf'):
                return JsonResponse({'error': 'Seuls les fichiers PDF sont acceptés'}, status=400)
    
            # 1. Extraction des données via Flask
            metadata = json.loads(request.POST.get('metadata', '{}'))
            try:
                fichier.seek(0)  # Reset file pointer
                response = requests.post(
                    'http://localhost:5000/api/extract-document',
                    files={'file': (fichier.name, fichier, 'application/pdf')},
                    data={'type': 'invoice'},  # Force le type facture
                    timeout=30
                )
                
                if response.status_code == 200:
                    extracted_data = response.json().get('data', {})
                    metadata.update(extracted_data)  # Fusion des métadonnées
            except Exception as e:
                logger.warning(f"Échec extraction Flask: {str(e)}")

            # 2. Création unique dans MongoDB
            numero_facture = metadata.get('numero_facture', f"AUTO-{uuid.uuid4().hex[:8].upper()}")
            
            facture = Facture(
                numero=numero_facture,
                montant_total=float(metadata.get('montant_total', 0)) if metadata.get('montant_total') else None,
                date_emission=datetime.strptime(metadata['date_emission'], "%Y-%m-%d") if metadata.get('date_emission') else None,
                emetteur=metadata.get('emetteur'),
                destinataire=metadata.get('destinataire'),
                ligne_details=metadata.get('ligne_details', []),
                metadata=metadata
            )
            
            fichier.seek(0)  # Reset pour sauvegarde
            facture.fichier.put(fichier, content_type='application/pdf', filename=fichier.name)
            facture.save()
            
            return JsonResponse({
                'id': str(facture.id),
                'numero': facture.numero,
                'metadata': facture.metadata,
                'fichier_url': request.build_absolute_uri(f'/api/factures/{facture.id}/download/'),
                'filename': fichier.name
            }, status=201)

        elif request.method == 'DELETE':
            if not id:
                return JsonResponse({'error': 'ID requis'}, status=400)
                
            facture = Facture.objects.get(id=ObjectId(id))
            facture.delete()
            return JsonResponse({'message': 'Facture supprimée'})
            
    except Facture.DoesNotExist:
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
        
        data = facture.fichier.read()
        response = HttpResponse(data, content_type='application/pdf')
        
        filename = facture.fichier.filename or f'facture-{facture.numero if facture.numero else "sans-numero"}.pdf'
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
            
    except (DoesNotExist, InvalidId):
        return JsonResponse({'error': 'Facture non trouvée'}, status=404)
    except Exception as e:
        logger.error(f"Erreur téléchargement: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)



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
                    'metadata': releve.metadata,
                    'fichier_url': request.build_absolute_uri(f'/api/banques/{releve.id}/download/'),
                    'filename': releve.fichier.filename if releve.fichier else None
                })
            else:
                releves = Banque.objects.all()
                return JsonResponse([{
                    'id': str(f.id),
                    'numero': f.numero,
                    'metadata': f.metadata,
                    'fichier_url': request.build_absolute_uri(f'/api/banques/{f.id}/download/') if f.fichier else None,
                    'filename': f.fichier.filename if f.fichier else None
                } for f in releves], safe=False)
                
        elif request.method == 'POST':
            if 'fichier' not in request.FILES:
                return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)
            
            fichier = request.FILES['fichier']
            
            # Vérification PDF
            if not fichier.name.lower().endswith('.pdf'):
                return JsonResponse({'error': 'Seuls les fichiers PDF sont acceptés'}, status=400)
            
            # 1. Extraction des données via Flask
            try:
                fichier.seek(0)  # Reset file pointer
                response = requests.post(
                    'http://localhost:5000/api/extract-document',
                    files={'file': (fichier.name, fichier, 'application/pdf')},
                    timeout=30
                )
                
                if response.status_code != 200:
                    raise ValueError("Échec de l'extraction")
                    
                result = response.json()
                metadata = json.loads(request.POST.get('metadata', '{}'))
                metadata.update(result['data'])  # Fusion des métadonnées
                
            except Exception as e:
                logger.error(f"Erreur extraction: {str(e)}")
                metadata = json.loads(request.POST.get('metadata', '{}'))
            
            # 2. Création unique dans MongoDB
            fichier.seek(0)  # Reset pour sauvegarde
            releve = Banque(
                
                numero=metadata.get('numero_releve', f"AUTO-{uuid.uuid4().hex[:8].upper()}"),
                montant=float(metadata.get('montant', 0)) if metadata.get('montant') else None,
                date_transaction=datetime.strptime(metadata['date_transaction'], "%Y-%m-%d") if metadata.get('date_transaction') else None,
                metadata=metadata
            )
            releve.fichier.put(fichier, content_type='application/pdf', filename=fichier.name)
            releve.save()
            
            return JsonResponse({
                'id': str(releve.id),
                'numero': releve.numero,
                'metadata': releve.metadata,
                'fichier_url': request.build_absolute_uri(f'/api/banques/{releve.id}/download/')
            }, status=201)
            
        elif request.method == 'DELETE':
            if not id:
                return JsonResponse({'error': 'ID requis'}, status=400)
                
            releve = Banque.objects.get(id=ObjectId(id))
            releve.delete()
            return JsonResponse({'message': 'Relevé supprimé'})
            
    except Banque.DoesNotExist:
        return JsonResponse({'error': 'Relevé non trouvé'}, status=404)
    except ValidationError as e:
        return JsonResponse({'error': f'Données invalides: {str(e)}'}, status=400)
    except ValueError as e:
        return JsonResponse({'error': f'Format de données incorrect: {str(e)}'}, status=400)
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
        # Total counts - Notez les parenthèses après count
        facture_count = Facture.objects().count()
        releve_count = Banque.objects().count()
        rapport_count = Rapport.objects().count()
        
        # New factures in last 30 days using created_at field
        last_month = datetime.datetime.now() - datetime.timedelta(days=30)
        new_factures = Facture.objects(created_at__gte=last_month).count()
        new_rapports = Rapport.objects(created_at__gte=last_month).count()
        
        return JsonResponse({
            'status': True,
            'data': {
                'stats': {
                    'facture': facture_count,
                    'releve': releve_count,
                    'newFactures': new_factures,
                    'rapport': rapport_count,
                    'newRapports': new_rapports
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





from flask import Blueprint, request, jsonify
from .utils.ocr_utils import extract_text_with_ocr
from .utils.invoice_parser import extract_invoice_data
from .utils.bank import extract_bank_statement_data
from .utils.verifi import verify_payment
import google.generativeai as genai
import json

api_blueprint = Blueprint('api', __name__)


@csrf_exempt
@api_blueprint.route('/extract-document', methods=['POST'])
def extract_document():
    """Endpoint pour extraire les données d'un seul document"""
    if 'file' not in request.files:
        return jsonify(error="Fichier PDF requis"), 400
    
    try:
        file = request.files['file']
        doc_type = request.form.get('type', 'auto').lower()
        
        text = extract_text_with_ocr(file)
        
        if doc_type == 'auto':
            invoice_keywords = ['facture', 'invoice', 'total ttc', 'montant ht', 'tva']
            bank_keywords = ['relevé', 'statement', 'solde', 'balance', 'transaction']
            
            invoice_score = sum(1 for kw in invoice_keywords if kw.lower() in text.lower())
            bank_score = sum(1 for kw in bank_keywords if kw.lower() in text.lower())
            
            doc_type = 'invoice' if invoice_score > bank_score else 'bank'
        
        if doc_type == 'invoice':
            data = extract_invoice_data(text)
            result_type = "facture"
        else:
            data = extract_bank_statement_data(text)
            result_type = "releve_bancaire"
        
        return jsonify({
            "type": result_type,
            "text": text[:2000],
            "data": data
        })
    
    except Exception as e:
        return jsonify(error=str(e)), 500

@api_blueprint.route('/compare-documents', methods=['POST'])
def compare_documents():
    """Endpoint pour comparer une facture et un relevé bancaire"""
    if not all(k in request.files for k in ('invoice', 'statement')):
        return jsonify(error="Deux fichiers PDF requis (facture et relevé)"), 400
    
    try:
        invoice_file = request.files['invoice']
        statement_file = request.files['statement']
        
        invoice_text = extract_text_with_ocr(invoice_file)
        statement_text = extract_text_with_ocr(statement_file)
        
        invoice_data = extract_invoice_data(invoice_text)
        statement_data = extract_bank_statement_data(statement_text)
        
        verification = verify_payment(invoice_data, statement_data)
        
        analysis = analyze_with_ai(invoice_text, statement_text, invoice_data, statement_data, verification)
        
        return jsonify({
            "invoice": {
                "text_extract": invoice_text[:1000],
                "data": invoice_data
            },
            "statement": {
                "text_extract": statement_text[:1000],
                "data": statement_data
            },
            "verification": verification,
            "analysis": analysis
        })
    
    except Exception as e:
        return jsonify(error=str(e)), 500
@csrf_exempt
def admin_actions_list(request):
    if request.method == 'GET':
        actions = ActionLog.objects.all().order_by('-date_action')  # Utilise date_action pour le tri
        data = {
            'actions': [{
                'id': str(action.id),
                'username': action.user.username if action.user else 'Système',
                'email': action.user.email if action.user else '',
                'role': action.user.role if action.user else '',
                'action_type': action.type_action,
                'description': action.description,
                'timestamp': action.date_action.isoformat(), # Utilise date_action ici
                'details': action.details,
                'audit': str(action.audit.id) if action.audit else None # Convertit l'ID de l'audit en string
            } for action in actions]
        }
        return JsonResponse(data)
    else:
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)