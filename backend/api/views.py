from rest_framework.views import APIView
import logging
from bson.errors import InvalidId
from decimal import Decimal,InvalidOperation
from datetime import datetime as dt
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import (
    api_view, 
    authentication_classes,  # Ajoutez ceci
    permission_classes
)
import locale
from django.utils.timezone import localtime
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.Controller import UserController
from api.exceptions import InvalidCredentialsError, InvalidDataError
import traceback
import re
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
from api.models import Rapport ,Compte,CustomUser,ActionLog,Facture,Banque,Notification,Comptable,DirecteurFinancier,Admin
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

from .serializers import PasswordResetRequestSerializer
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
#from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import ensure_csrf_cookie

from django.utils.timezone import now,utc,is_naive, make_aware, get_current_timezone
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import JsonResponse
from django.contrib.auth import logout
from django.http import HttpResponse
# Vue de déconnexion
from django.views.decorators.csrf import csrf_exempt
# Configurer le logger
logger = logging.getLogger(__name__)

@require_GET
@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})

# Vue pour GoogleLogin
class GoogleLogin(SocialLoginView):
    authentication_classes = []  # Désactive l'authentification par défaut
    permission_classes = [AllowAny] 
    adapter_class = GoogleOAuth2Adapter
    callback_url = "http://localhost:3000/google/callback"  # Adapte l'URL en fonction de ton frontend
    client_class = OAuth2Client


def get_serializer(self, *args, **kwargs):
        serializer_class = self.get_serializer_class()
        kwargs['context'] = self.get_serializer_context()
        return serializer_class(*args, **kwargs)
# Vue d'inscription de l'utilisateur
import re
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework.views import APIView,View
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
    try:
        existing_user = CustomUser.objects(email=data['email']).first()
        if existing_user:
            return Response({'error': 'Email déjà utilisé'}, status=400)
    except Exception:
        pass
    
    if data['password'] != data.get('confirmPassword', ''):
        return Response({'error': 'Les mots de passe ne correspondent pas'}, status=400)
    
    # Validation des emails secondaires
    secondary_emails = data.get('secondary_emails', [])
    valid_secondary_emails = []
    
    for email in secondary_emails:
        try:
            validate_email(email)
            if email != data['email']:
                valid_secondary_emails.append(email)
        except ValidationError:
            continue
    
    # Création de l'utilisateur
    try:
        role = data.get('role', 'comptable')
        
        # Différencier le traitement selon le rôle
        if role == 'admin':
            # ADMIN : Création directe, actif immédiatement, pas d'email d'activation
            user = CustomUser(
                username=data['username'],
                email=data['email'],
                role=role,
                secondary_emails=valid_secondary_emails,
                is_active=True,  # Admin actif immédiatement
                is_superuser=True,  # Admin = superuser
                approval_status='approved'  # Auto-approuvé
            )
            user.set_password(data['password'])
            user.save()
            
            # Création du compte associé (actif)
            compte = Compte(
                user=user,
                statut='Actif'
            )
            compte.save()
            
            return Response({
                'success': True,
                'message': 'Compte administrateur créé avec succès ! Vous pouvez vous connecter immédiatement.',
                'status': 'admin_created',
                'can_login_immediately': True,
                'compte_id': str(compte.id)
            }, status=200)
            
        else:
            # COMPTABLE/DIRECTEUR : Processus avec email d'activation + approbation admin
            # 1. Génération du token d'activation
            activation_token = jwt.encode({
                'email': data['email'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, settings.SECRET_KEY, algorithm='HS256')
            
            # 2. Création de l'utilisateur (INACTIF jusqu'à activation email)
            user = CustomUser(
                username=data['username'],
                email=data['email'],
                role=role,
                secondary_emails=valid_secondary_emails,
                is_active=False,  # Inactif jusqu'à activation email
                approval_status='pending',  # En attente d'approbation
                activation_token=activation_token
            )
            user.set_password(data['password'])
            user.save()
            
            # 3. Création du compte associé
            compte = Compte(
                user=user,
                statut='En attente d\'activation'
            )
            compte.save()
            
            # 4. Envoi de l'email d'activation à l'utilisateur
            activation_link = f"{settings.FRONTEND_URL}/activate/{activation_token}"
            all_emails = [user.email] + valid_secondary_emails
            
            role_display = {
                'comptable': 'Comptable',
                'directeur_financier': 'Directeur Financier',
                'directeur': 'Directeur Financier'
            }.get(role, role)
            
            send_mail(
                'Activez votre compte - Confirmation d\'inscription',
                f'''Bonjour {user.username},
                
Merci pour votre inscription en tant que {role_display} !

Pour finaliser la création de votre compte, veuillez cliquer sur le lien d'activation ci-dessous :

{activation_link}

Ce lien est valide pendant 7 jours.

⚠️ Important : Après activation de votre compte, votre demande sera soumise à l'approbation d'un administrateur.

Détails de votre inscription :
- Email : {user.email}
- Rôle : {role_display}
- Date d'inscription : {user.date_joined.strftime('%d/%m/%Y à %H:%M')}

Cordialement,
L'équipe de votre application''',
                settings.DEFAULT_FROM_EMAIL,
                all_emails,
                fail_silently=False,
            )
            
            # 5. Notification à l'admin
            admin_users = CustomUser.objects(is_superuser=True, is_active=True)
            admin_emails = [admin.email for admin in admin_users]
            
            if admin_emails:
                send_mail(
                    f'Nouvelle inscription {role_display} - En attente d\'activation',
                    f'''Bonjour,
                    
Une nouvelle inscription pour le rôle "{role_display}" a été effectuée :
                    
- Nom d'utilisateur : {user.username}
- Email : {user.email}
- Rôle : {role_display}
- Date d'inscription : {user.date_joined.strftime('%d/%m/%Y à %H:%M')}

L'utilisateur doit d'abord activer son compte via email, puis vous devrez l'approuver.
                    
Cordialement,
Système d'inscription''',
                    settings.DEFAULT_FROM_EMAIL,
                    admin_emails,
                    fail_silently=True,
                )
            
            return Response({
                'success': True,
                'message': 'Inscription réussie ! Veuillez vérifier votre email et cliquer sur le lien d\'activation pour activer votre compte.',
                'status': 'email_activation_required',
                'requires_admin_approval': True,
                'can_login_immediately': False,
                'compte_id': str(compte.id)
            }, status=200)

    except NotUniqueError as e:
        return Response({
            'success': False,
            'error': 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
        }, status=400)
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Erreur d'inscription : {str(e)}\n{error_traceback}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


class CustomJWTAuthentication:
    """
    Custom JWT Authentication class that handles our specific token format
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
            
        token = auth_header.split(' ')[1]
        
        try:
            # Use the same secret key used for token creation
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=['HS256']
            )
            
            # Check if token is expired
            exp = payload.get('exp')
            if exp and datetime.datetime.utcnow().timestamp() > exp:
                logger.error("Token expired")
                return None
            
            # Get user
            user_id = payload.get('user_id')
            if not user_id:
                logger.error("No user_id in token")
                return None
                
            try:
                user = CustomUser.objects.get(id=user_id)
            except DoesNotExist:
                logger.error(f"User {user_id} not found")
                return None
            
            # Ensure user properties match token
            user.role = payload.get('role', getattr(user, 'role', 'user'))
            user.is_superuser = payload.get('is_superuser', getattr(user, 'is_superuser', False))
            
            logger.info(f"Authentication successful for user {user.id} - Role: {user.role} - Superuser: {user.is_superuser}")
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            logger.error("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None

    def authenticate_header(self, request):
        return 'Bearer'
  
@csrf_exempt
@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def pending_users(request):
    try:
        user = request.user
        logger.info(f"User accessing pending_users: ID={user.id}, Role={getattr(user, 'role', 'N/A')}, Superuser={getattr(user, 'is_superuser', False)}")
        
        # Check admin permissions
        is_admin = (
            getattr(user, 'is_superuser', False) or 
            getattr(user, 'role', '') == 'admin'
        )
        
        if not is_admin:
            logger.error(f"Access denied for user {user.id} - not admin")
            return Response(
                {'success': False, 'error': 'Accès refusé. Seul un administrateur peut accéder à cette ressource.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get pending users (comptable et directeur_financier qui ont activé leur compte)
        pending_users_qs = CustomUser.objects(
            is_active=True,  # Compte activé par email
            approval_status='pending',
            role__in=['comptable', 'directeur_financier', 'directeur']
        ).order_by('-date_joined')

        # Format results
        users_data = [{
            'id': str(u.id),
            'username': u.username,
            'email': u.email,
            'role': getattr(u, 'role', 'user'),
            'date_joined': localtime(make_aware(u.date_joined) if is_naive(u.date_joined) else u.date_joined).isoformat(),
            'is_superuser': getattr(u, 'is_superuser', False),
            'secondary_emails': getattr(u, 'secondary_emails', []),
            'role_display': {
                'comptable': 'Comptable',
                'directeur_financier': 'Directeur Financier',
                'directeur': 'Directeur Financier'
            }.get(getattr(u, 'role', ''), getattr(u, 'role', ''))
        } for u in pending_users_qs]

        logger.info(f"Successfully retrieved {len(users_data)} pending users requiring admin approval")

        return Response({
            'success': True,
            'pending_users': users_data,
            'count': len(users_data),
            'message': f'{len(users_data)} utilisateur(s) en attente d\'approbation administrative'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in pending_users: {str(e)}", exc_info=True)
        return Response({
            'success': False, 
            'error': 'Erreur serveur interne.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
   
@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def approve_user(request, user_id):
    """Approve a user (Admin only) - Only for comptable and directeur_financier roles"""
    try:
        # Check permissions
        if not (getattr(request.user, 'is_superuser', False) or getattr(request.user, 'role', '') == 'admin'):
            return Response({'success': False, 'error': 'Accès refusé'}, status=403)
        
        # Get user
        try:
            user = CustomUser.objects.get(
                id=user_id, 
                approval_status='pending',
                is_active=True,  # L'utilisateur doit avoir activé son compte via email
                role__in=['comptable', 'directeur_financier', 'directeur']
            )
        except DoesNotExist:
            return Response(
                {'success': False, 'error': 'Utilisateur non trouvé, déjà traité, compte non activé, ou rôle non éligible'}, 
                status=404
            )

        # Update approval status
        user.approval_status = 'approved'
        user.approved_by = str(request.user.id)
        user.approved_at = datetime.datetime.utcnow()
        user.save()

        # Update associated account
        try:
            compte = Compte.objects(user=user).first()
            if compte:
                compte.statut = 'Actif'  # Compte maintenant entièrement actif
                
                # Link with specific roles
                if getattr(user, 'role', '') == 'comptable':
                    comptable = Comptable.objects(user=user).first()
                    if comptable:
                        compte.comptable = comptable
                elif getattr(user, 'role', '') in ['directeur_financier', 'directeur']:
                    directeur = DirecteurFinancier.objects(user=user).first()
                    if directeur:
                        compte.directeur = directeur
                
                compte.save()
        except Exception as e:
            logger.warning(f"Could not update compte for user {user_id}: {e}")

        # Send approval confirmation email
        try:
            all_emails = [user.email] + getattr(user, 'secondary_emails', [])
            
            role_display = {
                'comptable': 'Comptable',
                'directeur_financier': 'Directeur Financier',
                'directeur': 'Directeur Financier'
            }.get(user.role, user.role)
            
            send_mail(
                'Félicitations ! Votre compte a été approuvé',
                f'''Bonjour {user.username},

Excellente nouvelle ! Votre compte avec le rôle "{role_display}" a été approuvé par un administrateur.

Vous pouvez maintenant vous connecter à votre compte avec vos identifiants :
- Email : {user.email}
- Rôle : {role_display}

Lien de connexion : {settings.FRONTEND_URL}/connexion

Détails de votre compte :
- Date d'approbation : {user.approved_at.strftime('%d/%m/%Y à %H:%M')}
- Statut : Actif et approuvé
- Approuvé par : Administrateur

Bienvenue dans notre application !

Cordialement,
L'équipe de votre application''',
                settings.DEFAULT_FROM_EMAIL,
                all_emails,
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Could not send approval email: {e}")
            return Response({
                'success': False,
                'error': 'Utilisateur approuvé mais échec d\'envoi de l\'email de confirmation'
            }, status=500)

        return Response({
            'success': True,
            'message': f'Utilisateur {user.username} ({role_display}) approuvé avec succès. Il peut maintenant se connecter.'
        })

    except Exception as e:
        logger.error(f"Error in approve_user: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Erreur lors de l\'approbation'
        }, status=500)

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def reject_user(request, user_id):
    """Reject a user (Admin only) - Only for comptable and directeur_financier roles"""
    try:
        # Check permissions
        if not (getattr(request.user, 'is_superuser', False) or getattr(request.user, 'role', '') == 'admin'):
            return Response({'success': False, 'error': 'Accès refusé'}, status=403)
        
        # Get user
        try:
            user = CustomUser.objects.get(
                id=user_id, 
                approval_status='pending',
                role__in=['comptable', 'directeur_financier', 'directeur']
            )
        except DoesNotExist:
            return Response({'success': False, 'error': 'Utilisateur non trouvé, déjà traité, ou rôle non éligible'}, status=404)
        
        data = request.data
        rejection_reason = data.get('reason', 'Aucune raison spécifiée')
        
        # Update status
        user.approval_status = 'rejected'
        user.approved_by = str(request.user.id)
        user.approved_at = datetime.datetime.utcnow()
        user.rejection_reason = rejection_reason
        user.save()
        
        # Delete associated account
        try:
            compte = Compte.objects(user=user).first()
            if compte:
                compte.delete()
        except Exception as e:
            logger.warning(f"Could not delete compte for user {user_id}: {e}")
        
        # Send notification email
        try:
            all_emails = [user.email] + getattr(user, 'secondary_emails', [])
            role_display = {
                'comptable': 'Comptable',
                'directeur_financier': 'Directeur Financier',
                'directeur': 'Directeur Financier'
            }.get(user.role, user.role)
            
            send_mail(
                'Demande d\'inscription rejetée',
                f'''Bonjour {user.username},
                
Nous regrettons de vous informer que votre demande d'inscription pour le rôle "{role_display}" a été rejetée.

Raison : {rejection_reason}

Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez plus d'informations, 
n'hésitez pas à nous contacter.

Cordialement,
L'équipe de votre application''',
                settings.DEFAULT_FROM_EMAIL,
                all_emails,
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f"Could not send rejection email: {e}")
        
        return Response({
            'success': True,
            'message': f'Utilisateur {user.username} ({role_display}) rejeté. Notification envoyée.',
            'reason': rejection_reason
        })
    
    except Exception as e:
        logger.error(f"Error in reject_user: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Erreur lors du rejet'
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def activate_account(request, token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Chercher l'utilisateur par email
        user_email = payload.get('email')
        user_id = payload.get('user_id')
        
        if user_email:
            user = CustomUser.objects(email=user_email).first()
        elif user_id:
            user = CustomUser.objects(id=user_id).first()
        else:
            return Response({'success': False, 'error': 'Token invalide'}, status=400)
        
        if not user:
            return Response({'success': False, 'error': 'Utilisateur non trouvé'}, status=400)
        
        # Vérifier si c'est un admin (ne devrait pas arriver car admin pas d'email d'activation)
        if user.role == 'admin':
            return Response({
                'success': False,
                'error': 'Les comptes administrateurs n\'ont pas besoin d\'activation.'
            }, status=400)
        
        # Vérifier si le compte est déjà actif et approuvé
        if user.is_active and user.approval_status == 'approved':
            return Response({
                'success': True,
                'message': 'Ce compte est déjà activé et approuvé. Vous pouvez vous connecter directement.'
            }, status=200)
        
        # Activer le compte après validation email
        user.is_active = True
        user.activation_token = None
        user.save()
        
        # Mettre à jour le statut du compte associé
        try:
            compte = Compte.objects(user=user).first()
            if compte:
                compte.statut = 'En attente d\'approbation'  # Maintenant en attente d'approbation admin
                compte.save()
        except Exception as e:
            logger.warning(f"Could not update compte status for user {user.id}: {e}")
        
        # Envoyer confirmation d'activation à l'utilisateur
        try:
            all_emails = [user.email] + getattr(user, 'secondary_emails', [])
            role_display = {
                'comptable': 'Comptable',
                'directeur_financier': 'Directeur Financier',
                'directeur': 'Directeur Financier'
            }.get(user.role, user.role)
            
            send_mail(
                'Compte activé - En attente d\'approbation',
                f'''Bonjour {user.username},

Votre compte {role_display} a été activé avec succès !

Votre demande d'inscription est maintenant soumise à l'approbation d'un administrateur.
Vous recevrez un email de confirmation une fois votre compte approuvé par l'admin.

Détails de votre compte :
- Email : {user.email}
- Rôle : {role_display}
- Statut : Activé, en attente d'approbation administrative

Cordialement,
L'équipe de votre application''',
                settings.DEFAULT_FROM_EMAIL,
                all_emails,
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f"Could not send activation confirmation email: {e}")
        
        # Notifier l'admin que l'utilisateur a activé son compte
        try:
            admin_users = CustomUser.objects(is_superuser=True, is_active=True)
            admin_emails = [admin.email for admin in admin_users]
            
            if admin_emails:
                role_display = {
                    'comptable': 'Comptable',
                    'directeur_financier': 'Directeur Financier',
                    'directeur': 'Directeur Financier'
                }.get(user.role, user.role)
                
                send_mail(
                    f'Compte {role_display} activé - Approbation requise',
                    f'''Bonjour,
                    
Un utilisateur {role_display} a activé son compte et est maintenant en attente d'approbation :

- Nom d'utilisateur : {user.username}
- Email : {user.email}
- Rôle : {role_display}
- Date d'inscription : {user.date_joined.strftime('%d/%m/%Y à %H:%M')}
- Date d'activation : {datetime.datetime.utcnow().strftime('%d/%m/%Y à %H:%M')}

Veuillez vous connecter à l'interface d'administration pour approuver ou rejeter cette demande.

Lien d'administration : {settings.FRONTEND_URL}/admin/pending-users

Cordialement,
Système d'inscription''',
                    settings.DEFAULT_FROM_EMAIL,
                    admin_emails,
                    fail_silently=True,
                )
        except Exception as e:
            logger.warning(f"Could not send admin notification: {e}")
        
        return Response({
            'success': True,
            'message': 'Compte activé avec succès ! Votre demande est maintenant en attente d\'approbation par un administrateur.',
            'next_step': 'admin_approval_required'
        })
        
    except jwt.ExpiredSignatureError:
        return Response({
            'success': False,
            'error': 'Le lien d\'activation a expiré. Veuillez vous réinscrire.'
        }, status=400)
    except Exception as e:
        logger.error(f"Error in activate_account: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Erreur lors de l\'activation du compte'
        }, status=400)
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from django.conf import settings


from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mongoengine import DoesNotExist
import json

@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return JsonResponse({'status': 'error', 'message': 'Tous les champs sont requis'}, status=400)

        try:
            user = CustomUser.objects.get(email=email)
        except DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Email ou mot de passe invalide'}, status=401)

        if not user.check_password(password):
            return JsonResponse({'status': 'error', 'message': 'Email ou mot de passe invalide'}, status=401)

        # BYPASS POUR LES ADMINS : Les admins peuvent se connecter directement
        user_role = getattr(user, 'role', 'user')
        is_admin = user.is_superuser or user_role == 'admin'
        
        if is_admin:
            logger.info(f"Admin login bypass for user {user.id} - Role: {user_role} - Superuser: {user.is_superuser}")
            # Les admins passent directement à la génération du token
            pass
        else:
            # VÉRIFICATIONS COMPLÈTES POUR LES NON-ADMINS (comptable/directeur)
            if not user.is_active:
                approval_status = getattr(user, 'approval_status', '')
                
                if approval_status == 'pending':
                    # Vérifier si l'utilisateur a un token d'activation (pas encore activé par email)
                    if hasattr(user, 'activation_token') and user.activation_token:
                        return JsonResponse({
                            'status': 'error',
                            'message': 'Votre compte n\'est pas encore activé. Veuillez vérifier votre email et cliquer sur le lien d\'activation.',
                            'action_required': 'email_activation'
                        }, status=403)
                    else:
                        # Email activé mais en attente d'approbation admin
                        return JsonResponse({
                            'status': 'error',
                            'message': 'Votre compte est activé mais en attente d\'approbation par un administrateur.',
                            'action_required': 'admin_approval'
                        }, status=403)
                
                elif approval_status == 'rejected':
                    reason = getattr(user, 'rejection_reason', 'Aucune raison spécifiée.')
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Votre demande d\'inscription a été rejetée. Raison : {reason}',
                        'action_required': 'rejected'
                    }, status=403)
                
                else:
                    # Cas général de compte inactif
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Votre compte n\'est pas actif. Veuillez contacter l\'administrateur.',
                        'action_required': 'contact_admin'
                    }, status=403)

            # Vérification supplémentaire : compte actif mais statut de validation
            if user.is_active and getattr(user, 'approval_status', '') != 'approved':
                return JsonResponse({
                    'status': 'error',
                    'message': 'Votre compte est en cours de traitement. Veuillez patienter.',
                    'action_required': 'pending_processing'
                }, status=403)

        # GÉNÉRATION DU TOKEN (pour tous les utilisateurs autorisés)
        # Create token with proper expiration timestamp
        exp_time = datetime.datetime.utcnow() + timedelta(hours=24)
        token_payload = {
            'user_id': str(user.id),
            'email': user.email,
            'role': getattr(user, 'role', 'user'),
            'is_superuser': getattr(user, 'is_superuser', False),
            'exp': int(exp_time.timestamp())  # Convert to timestamp
        }
        
        access_token = jwt.encode(
            token_payload,
            settings.JWT_SECRET_KEY,
            algorithm='HS256'
        )
        
        # Refresh token
        refresh_exp = datetime.datetime.utcnow() + timedelta(days=7)
        refresh_payload = {
            'user_id': str(user.id),
            'type': 'refresh',
            'exp': int(refresh_exp.timestamp())
        }
        
        refresh_token = jwt.encode(
            refresh_payload,
            getattr(settings, 'JWT_REFRESH_SECRET_KEY', settings.JWT_SECRET_KEY),
            algorithm='HS256'
        )

        login_type = "Admin bypass" if is_admin else "Standard login"
        logger.info(f"{login_type} successful for user {user.id} - Role: {getattr(user, 'role', 'user')} - Superuser: {getattr(user, 'is_superuser', False)}")

        response = JsonResponse({
            'status': 'success',
            'message': 'Connexion réussie!',
            'access_token': access_token,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'user'),
                'is_superuser': getattr(user, 'is_superuser', False),
                'approval_status': getattr(user, 'approval_status', 'approved')
            }
        })
        
        # Set refresh cookie
        response.set_cookie(
            'refresh_token',
            refresh_token,
            max_age=7*24*60*60,  # 7 days
            httponly=True,
            secure=False,  # True in production
            samesite='Lax'
        )
        
        return response

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Données JSON invalides'}, status=400)
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return JsonResponse({'status': 'error', 'message': 'Erreur interne du serveur'}, status=500)

@csrf_exempt
def refresh_token_view(request):
    """Version simplifiée et plus robuste"""
    if request.method == 'POST':
        try:
            # Accepte à la fois le token dans les cookies ET le body
            refresh_token = request.COOKIES.get('refresh_token') or request.POST.get('refresh_token')
            
            if not refresh_token:
                return JsonResponse({'status': 'error', 'message': 'Token manquant'}, status=401)
            
            # Décodage du token
            payload = jwt.decode(refresh_token, settings.JWT_REFRESH_SECRET_KEY, algorithms=['HS256'])
            
            if payload.get('type') != 'refresh':
                return JsonResponse({'status': 'error', 'message': 'Mauvais type de token'}, status=401)
                
            # Récupération utilisateur
            user = CustomUser.objects.get(id=payload['user_id'])
            
            # Création nouveau token
            access_token = jwt.encode({
                'user_id': str(user.id),
                'email': user.email,
                'role': user.role,
                'exp': datetime.datetime.utcnow() + timedelta(minutes=30)
            }, settings.JWT_SECRET_KEY, algorithm='HS256')
            
            response = JsonResponse({
                'status': 'success',
                'access_token': access_token,
                'expires_in': 1800
            })
            
            # Configure les headers CORS
            response["Access-Control-Allow-Origin"] = request.headers.get('Origin', '*')
            response["Access-Control-Allow-Credentials"] = "true"
            
            return response
            
        except Exception as e:
            logger.error(f"Refresh error: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=401)
    
    return JsonResponse({'status': 'error', 'message': 'Méthode non autorisée'}, status=405)

# Dans votre views.py Django
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["GET", "POST"])
def deco_view(request):
    """Endpoint pour se déconnecter et invalider les tokens"""
    try:
        # Récupérer et vérifier le token d'accès pour identifier l'utilisateur
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            try:
                # Décoder le token sans vérifier l'expiration
                payload = jwt.decode(
                    token,
                    settings.JWT_SECRET_KEY,
                    algorithms=['HS256'],
                    options={'verify_exp': False}
                )
                
                user_id = payload.get('user_id')
                role = payload.get('role')
                
                # Enregistrement de la déconnexion pour comptable et directeur
                if role in ['comptable', 'directeur']:
                    try:
                        user = CustomUser.objects.get(id=user_id)
                        ActionLog(
                            user=user,
                            type_action='déconnexion',
                            description=f"Déconnexion réussie pour {user.email}",
                            details=f"Rôle: {user.role}",
                            statut="Terminé"
                        ).save()
                    except CustomUser.DoesNotExist:
                        pass
                    
            except (jwt.InvalidTokenError, jwt.DecodeError):
                # Token invalide, on continue quand même pour nettoyer le cookie
                pass
        
        # Créer une réponse qui supprime le cookie refresh_token
        response = JsonResponse({
            'status': 'success', 
            'message': 'Déconnexion réussie'
        })
        
        # Supprimer le cookie refresh_token
        response.delete_cookie('refresh_token')
        
        # S'assurer qu'aucun header d'authentification HTTP n'est envoyé
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur lors de la déconnexion: {str(e)}")
        # NE PAS retourner d'erreur 401 qui pourrait déclencher la popup
        return JsonResponse({
            'status': 'error', 
            'message': 'Erreur interne du serveur'
        }, status=500)


from django.views.decorators.csrf import csrf_exempt
import json
  # Importez directement CustomUser
from django.http import JsonResponse
from django.utils import timezone

from django.db import IntegrityError
@csrf_exempt
def ProfilAdminApi(request, id=None):
    """
    API endpoint for managing Admin profiles.
    Supports GET (retrieve), POST (update user info for existing admin), 
    PUT (full update of user and admin profile), and DELETE (delete user and admin).
    """

    # GET: Retrieve Admin Profile
    if request.method == 'GET':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la récupération"}, status=400)
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

            try:
                admin = Admin.objects(user=user).first()
                
                # Prepare base user data
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'nom_complet': getattr(user, 'nom_complet', None),
                    'telephone': getattr(user, 'telephone', None),
                    'date_naissance': user.date_naissance.isoformat() if user.date_naissance else None,
                    'sexe': user.sexe if hasattr(user, 'sexe') and user.sexe else None,
                    'is_active_user': user.is_active, # Clarify this is user's active status
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'date_modification': user.date_modification.isoformat() if user.date_modification else None,
                    'secondary_emails': [str(email) for email in user.secondary_emails] if user.secondary_emails else [],
                    'has_complete_profile': user.has_complete_profile(),
                }

                # Add admin specific data if admin profile exists
                if admin:
                    user_data.update({
                        'niveau_admin': admin.niveau_admin,
                        'is_active_admin_profile': admin.is_active # Clarify this is admin profile's active status
                    })
                else:
                    user_data['admin_profile_status'] = "Profil admin non trouvé pour cet utilisateur. L'utilisateur existe en tant que CustomUser."
                
                return JsonResponse(user_data, status=200)

            except DoesNotExist:
                # If CustomUser exists but Admin profile doesn't, return user data with a note
                user_data['admin_profile_status'] = "Profil admin non trouvé pour cet utilisateur. L'utilisateur existe en tant que CustomUser."
                return JsonResponse(user_data, status=200)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de la récupération du profil admin: {str(e)}"}, status=500)

        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la récupération de l'utilisateur: {str(e)}"}, status=500)

    # POST: Update basic User information for an existing admin (requires user_id in body)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)

        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse({"error": "Champs 'user_id' est requis"}, status=400)

        try:
            user = CustomUser.objects(id=user_id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Vérifier si l'utilisateur a le rôle admin
            if user.role != 'admin':
                return JsonResponse({"error": "L'utilisateur n'a pas le rôle admin"}, status=403)
            
            # Implémentation manuelle de get_or_create pour MongoEngine
            admin = Admin.objects(user=user).first()
            created = False
            if not admin:
                admin = Admin(
                    user=user,
                    niveau_admin='moderateur',  # Valeur par défaut valide
                    is_active=True
                )
                admin.save()
                created = True
            
            # Mise à jour des champs utilisateur
            if 'nom_complet' in data and data['nom_complet'] is not None:
                user.nom_complet = data['nom_complet']
            if 'telephone' in data and data['telephone'] is not None:
                user.telephone = data['telephone']
            if 'sexe' in data and data['sexe'] is not None:
                # Validation du sexe si des choix sont définis
                if hasattr(user.__class__.sexe, 'choices') and data['sexe'] not in [choice[0] for choice in user.__class__.sexe.choices]:
                    return JsonResponse({"error": f"Valeur de 'sexe' invalide. Les options sont : {', '.join([choice[0] for choice in user.__class__.sexe.choices])}"}, status=400)
                user.sexe = data['sexe']
            if 'date_naissance' in data and data['date_naissance'] is not None:
                try:
                    user.date_naissance = datetime.datetime.strptime(data['date_naissance'], '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({"error": "Format de date invalide. Utilisez YYYY-MM-DD"}, status=400)
            
            user.save()
            
            return JsonResponse({
                "status": "success",
                "message": "Profil admin et informations utilisateur mises à jour",
                "user_id": str(user.id),
                "admin_created": created  # Indique si le profil admin a été créé
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # PUT: Full update of User and Admin profile
    elif request.method == 'PUT':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la mise à jour complète"}, status=400)
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Check if the user is indeed an admin
            admin = Admin.objects(user=user).first()
            if not admin:
                return JsonResponse({"error": "Profil admin non trouvé pour cet utilisateur. L'utilisateur n'est pas un administrateur enregistré."}, status=404)

            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)

            try:
                # Update CustomUser fields
                for key in ['username', 'email', 'nom_complet', 'telephone', 'sexe']:
                    if key in data and data[key] is not None:
                        # Prevent changing email/username if they are not allowed to be updated this way
                        if key in ['username', 'email'] and getattr(user, key) != data[key]:
                             # This logic implies these fields should only be updated if necessary.
                             # If email/username change is a sensitive operation, consider a separate endpoint or more robust checks.
                             # For now, let's assume they can be updated directly here.
                             pass 
                        # Specific validation for 'sexe' during PUT
                        if key == 'sexe' and data['sexe'] not in [choice[0] for choice in CustomUser.sexe.choices]:
                            return JsonResponse({"error": f"Valeur de 'sexe' invalide. Les options sont : {', '.join([choice[0] for choice in CustomUser.sexe.choices])}"}, status=400)
                        setattr(user, key, data[key])
                
                # Handle password separately using set_password
                if 'password' in data and data['password'] is not None:
                    user.set_password(data['password'])
                
                # Handle date_naissance which is a DateField
                if 'date_naissance' in data and data['date_naissance'] is not None:
                    try:
                        user.date_naissance = datetime.datetime.strptime(data['date_naissance'], '%Y-%m-%d').date()
                    except ValueError:
                        return JsonResponse({"error": "Format de date de naissance invalide. Utilisez 'YYYY-MM-DD'."}, status=400)

                # Update Admin fields
                if 'niveau_admin' in data and data['niveau_admin'] is not None:
                    admin.niveau_admin = data['niveau_admin']
                
                if 'is_active_admin_profile' in data and data['is_active_admin_profile'] is not None:
                    admin.is_active = data['is_active_admin_profile']
                
                # Update user's general active status if passed
                if 'is_active_user' in data and data['is_active_user'] is not None:
                    user.is_active = data['is_active_user']

                user.save()  # This will trigger CustomUser's clean method
                admin.save() # This will trigger Admin's clean method

                return JsonResponse({
                    "status": "success",
                    "message": "Profil administrateur et utilisateur mis à jour avec succès",
                    "user_id": str(user.id)
                }, status=200)

            except ValidationError as e:
                # Catch validation errors from either user.save() or admin.save()
                return JsonResponse({"error": f"Erreur de validation: {str(e)}"}, status=400)
            except NotUniqueError as e:
                # Catch unique constraint errors
                if 'username' in str(e):
                    return JsonResponse({"error": "Ce nom d'utilisateur est déjà utilisé."}, status=409)
                elif 'email' in str(e):
                    return JsonResponse({"error": "Cet email est déjà utilisé."}, status=409)
                return JsonResponse({"error": f"Erreur de duplication: {str(e)}"}, status=409)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de la mise à jour complète du profil: {str(e)}"}, status=500)

        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur serveur lors de la récupération de l'utilisateur pour la mise à jour: {str(e)}"}, status=500)

    # DELETE: Delete user (and associated admin profile due to CASCADE)
    elif request.method == 'DELETE':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la suppression"}, status=400)
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
           
            
            # Let's ensure the user actually has an admin role before allowing deletion through this endpoint
            if user.role != 'admin':
                 return JsonResponse({"error": "Impossible de supprimer. Cet utilisateur n'a pas le rôle 'admin'."}, status=403) # Forbidden
            
           
            
            user.delete() # This will trigger the cascade deletion for the Admin document

            return JsonResponse({
                "status": "success",
                "message": "Compte utilisateur et profil administrateur supprimés avec succès"
            }, status=200)
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la suppression du compte: {str(e)}"}, status=500)

    # Method Not Allowed
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

@csrf_exempt
def ProfilComptableApi(request, id=None):
    """
    API endpoint for managing Comptable profiles.
    Supports GET (retrieve), POST (update user info for existing comptable), 
    PUT (full update of user and comptable profile), and DELETE (delete user and comptable).
    """
    
    def log_action(user, action_type, description, details, statut):
        if user and user.role == 'comptable':
            ActionLog(
                user=user,
                type_action=action_type,
                description=description,
                details=details,
                statut=statut
            ).save()

    # ------------------------- GET -------------------------
    if request.method == 'GET':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la récupération"}, status=400)
        
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

            try:
                comptable = Comptable.objects(user=user).first()
                
                # Prepare base user data
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'nom_complet': getattr(user, 'nom_complet', None),
                    'telephone': getattr(user, 'telephone', None),
                    'date_naissance': user.date_naissance.isoformat() if user.date_naissance else None,
                    'sexe': user.sexe if hasattr(user, 'sexe') and user.sexe else None,
                    'is_active_user': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'date_modification': user.date_modification.isoformat() if user.date_modification else None,
                    'secondary_emails': [str(email) for email in user.secondary_emails] if user.secondary_emails else [],
                    'has_complete_profile': user.has_complete_profile(),
                }

                # Add comptable specific data if comptable profile exists
                if comptable:
                    user_data.update({
                        'departement': comptable.departement,
                        'niveau_formation': comptable.niveau_formation,
                        'is_active_comptable_profile': comptable.is_active if hasattr(comptable, 'is_active') else True
                    })
                else:
                    user_data['comptable_profile_status'] = "Profil comptable non trouvé pour cet utilisateur. L'utilisateur existe en tant que CustomUser."

                log_action(user, 'consultation', "Consultation profil", "", "Terminé")
                return JsonResponse(user_data, status=200)

            except DoesNotExist:
                # If CustomUser exists but Comptable profile doesn't, return user data with a note
                user_data['comptable_profile_status'] = "Profil comptable non trouvé pour cet utilisateur. L'utilisateur existe en tant que CustomUser."
                log_action(user, 'consultation', "Consultation profil (profil comptable manquant)", "", "Terminé")
                return JsonResponse(user_data, status=200)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de la récupération du profil comptable: {str(e)}"}, status=500)

        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la récupération de l'utilisateur: {str(e)}"}, status=500)

    # ------------------------- POST -------------------------
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)

        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse({"error": "Champs 'user_id' est requis"}, status=400)
        valid_departements = ['Générale', 'Comptabilité F', 'CR', 'Agent', 'F']
        if 'departement' in data and data['departement'] not in valid_departements:
            return JsonResponse({
                "error": f"Département invalide. Choix valides: {', '.join(valid_departements)}",
                "valid_choices": valid_departements
            }, status=400)
        try:
            user = CustomUser.objects(id=user_id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Vérifier si l'utilisateur a le rôle comptable
            if user.role != 'comptable':
                return JsonResponse({"error": "L'utilisateur n'a pas le rôle comptable"}, status=403)
            
            # Implémentation manuelle de get_or_create pour MongoEngine
            comptable = Comptable.objects(user=user).first()
            created = False
            if not comptable:
                comptable = Comptable(
                    user=user,
                    departement=data.get('departement', 'général'),  # Valeur par défaut
                    niveau_formation=data.get('niveau_formation', 'débutant')  # Valeur par défaut
                )
                comptable.save()
                created = True
            
            # Mise à jour des champs utilisateur
            if 'nom_complet' in data and data['nom_complet'] is not None:
                user.nom_complet = data['nom_complet']
            if 'telephone' in data and data['telephone'] is not None:
                user.telephone = data['telephone']
            if 'sexe' in data and data['sexe'] is not None:
                # Validation du sexe si des choix sont définis
                if hasattr(user.__class__.sexe, 'choices') and data['sexe'] not in [choice[0] for choice in user.__class__.sexe.choices]:
                    return JsonResponse({"error": f"Valeur de 'sexe' invalide. Les options sont : {', '.join([choice[0] for choice in user.__class__.sexe.choices])}"}, status=400)
                user.sexe = data['sexe']
            if 'date_naissance' in data and data['date_naissance'] is not None:
                try:
                    user.date_naissance = datetime.datetime.strptime(data['date_naissance'], '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({"error": "Format de date invalide. Utilisez YYYY-MM-DD"}, status=400)
            
            user.save()

            log_action(user, 'creation' if created else 'modification', 
                      "Profil créé" if created else "Profil mis à jour", 
                      f"Département: {comptable.departement}", "Terminé")
            
            return JsonResponse({
                "status": "success",
                "message": "Profil comptable et informations utilisateur mises à jour",
                "user_id": str(user.id),
                "comptable_created": created  # Indique si le profil comptable a été créé
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # ------------------------- PUT -------------------------
    elif request.method == 'PUT':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la mise à jour complète"}, status=400)
        
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Check if the user is indeed a comptable
            comptable = Comptable.objects(user=user).first()
            if not comptable:
                return JsonResponse({"error": "Profil comptable non trouvé pour cet utilisateur. L'utilisateur n'est pas un comptable enregistré."}, status=404)

            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)

            try:
                # Update CustomUser fields
                for key in ['username', 'email', 'nom_complet', 'telephone', 'sexe']:
                    if key in data and data[key] is not None:
                        # Specific validation for 'sexe' during PUT
                        if key == 'sexe' and hasattr(CustomUser.sexe, 'choices') and data['sexe'] not in [choice[0] for choice in CustomUser.sexe.choices]:
                            return JsonResponse({"error": f"Valeur de 'sexe' invalide. Les options sont : {', '.join([choice[0] for choice in CustomUser.sexe.choices])}"}, status=400)
                        setattr(user, key, data[key])
                
                # Handle password separately using set_password
                if 'password' in data and data['password'] is not None:
                    user.set_password(data['password'])
                
                # Handle date_naissance which is a DateField
                if 'date_naissance' in data and data['date_naissance'] is not None:
                    try:
                        user.date_naissance = datetime.datetime.strptime(data['date_naissance'], '%Y-%m-%d').date()
                    except ValueError:
                        return JsonResponse({"error": "Format de date de naissance invalide. Utilisez 'YYYY-MM-DD'."}, status=400)

                # Update Comptable fields
                if 'departement' in data and data['departement'] is not None:
                    comptable.departement = data['departement']
                
                if 'niveau_formation' in data and data['niveau_formation'] is not None:
                    comptable.niveau_formation = data['niveau_formation']
                
                if 'is_active_comptable_profile' in data and data['is_active_comptable_profile'] is not None:
                    if hasattr(comptable, 'is_active'):
                        comptable.is_active = data['is_active_comptable_profile']
                
                # Update user's general active status if passed
                if 'is_active_user' in data and data['is_active_user'] is not None:
                    user.is_active = data['is_active_user']

                user.save()  # This will trigger CustomUser's clean method
                comptable.save()  # This will trigger Comptable's clean method

                log_action(user, 'modification', "Profil mis à jour complètement", "", "Terminé")
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil comptable et utilisateur mis à jour avec succès",
                    "user_id": str(user.id)
                }, status=200)

            except ValidationError as e:
                # Catch validation errors from either user.save() or comptable.save()
                return JsonResponse({"error": f"Erreur de validation: {str(e)}"}, status=400)
            except NotUniqueError as e:
                # Catch unique constraint errors
                if 'username' in str(e):
                    return JsonResponse({"error": "Ce nom d'utilisateur est déjà utilisé."}, status=409)
                elif 'email' in str(e):
                    return JsonResponse({"error": "Cet email est déjà utilisé."}, status=409)
                return JsonResponse({"error": f"Erreur de duplication: {str(e)}"}, status=409)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de la mise à jour complète du profil: {str(e)}"}, status=500)

        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur serveur lors de la récupération de l'utilisateur pour la mise à jour: {str(e)}"}, status=500)

    # ------------------------- DELETE -------------------------
    elif request.method == 'DELETE':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la suppression"}, status=400)
        
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Let's ensure the user actually has a comptable role before allowing deletion through this endpoint
            if user.role != 'comptable':
                return JsonResponse({"error": "Impossible de supprimer. Cet utilisateur n'a pas le rôle 'comptable'."}, status=403)
            
            # Log before deletion
            log_action(user, 'suppression', "Compte utilisateur et profil comptable supprimés", "", "Terminé")
            
            # The Comptable profile will be deleted automatically due to reverse_delete_rule=CASCADE
            # in the Comptable model's 'user' field (if configured)
            user.delete()  # This will trigger the cascade deletion for the Comptable document

            return JsonResponse({
                "status": "success",
                "message": "Compte utilisateur et profil comptable supprimés avec succès"
            }, status=200)
            
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la suppression du compte: {str(e)}"}, status=500)

    # Method Not Allowed
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)
    #Directeur profil
@csrf_exempt
def ProfilDirecteurApi(request, id=None):
    """
    API endpoint for managing Comptable profiles.
    Supports GET (retrieve), POST (update user info for existing comptable), 
    PUT (full update of user and comptable profile), and DELETE (delete user and comptable).
    """
    
    def log_action(user, action_type, description, details, statut):
        if user and user.role == 'directeur':
            ActionLog(
                user=user,
                type_action=action_type,
                description=description,
                details=details,
                statut=statut
            ).save()

    # ------------------------- GET -------------------------
    if request.method == 'GET':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la récupération"}, status=400)
        
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

            try:
                directeur = DirecteurFinancier.objects(user=user).first()
                
                # Prepare base user data
                user_data = {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'nom_complet': getattr(user, 'nom_complet', None),
                    'telephone': getattr(user, 'telephone', None),
                    'date_naissance': user.date_naissance.isoformat() if user.date_naissance else None,
                    'sexe': user.sexe if hasattr(user, 'sexe') and user.sexe else None,
                    'matricule': getattr(user, 'matricule', None),
                    'is_active_user': user.is_active,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'date_modification': user.date_modification.isoformat() if user.date_modification else None,
                    'secondary_emails': [str(email) for email in user.secondary_emails] if user.secondary_emails else [],
                    'has_complete_profile': user.has_complete_profile(),
                }

                # Add comptable specific data if comptable profile exists
                if directeur:
                    user_data.update({
                        'departement': directeur.departement,
                        'specialite': directeur.specialite,
                        'is_active_directeur_profile': directeur.is_active if hasattr(directeur, 'is_active') else True
                    })
                else:
                    user_data['directeur_profile_status'] = "Profil directeur non trouvé pour cet utilisateur. L'utilisateur existe en tant que CustomUser."

                log_action(user, 'consultation', "Consultation profil", "", "Terminé")
                return JsonResponse(user_data, status=200)

            except DoesNotExist:
                # If CustomUser exists but Comptable profile doesn't, return user data with a note
                user_data['directeur_profile_status'] = "Profil directeur  non trouvé pour cet utilisateur. L'utilisateur existe en tant que CustomUser."
                log_action(user, 'consultation', "Consultation profil (profil directeur  manquant)", "", "Terminé")
                return JsonResponse(user_data, status=200)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de la récupération du profil directeur : {str(e)}"}, status=500)

        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la récupération de l'utilisateur: {str(e)}"}, status=500)

    # ------------------------- POST -------------------------
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)

        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse({"error": "Champs 'user_id' est requis"}, status=400)
        valid_departements = ['Finance', 'Comptabilité ', 'RH', 'Direction', 'IT']
        if 'departement' in data and data['departement'] not in valid_departements:
            return JsonResponse({
                "error": f"Département invalide. Choix valides: {', '.join(valid_departements)}",
                "valid_choices": valid_departements
            }, status=400)
        try:
            user = CustomUser.objects(id=user_id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Vérifier si l'utilisateur a le rôle comptable
            if user.role != 'directeur':
                return JsonResponse({"error": "L'utilisateur n'a pas le rôle comptable"}, status=403)
            
            # Implémentation manuelle de get_or_create pour MongoEngine
            directeur = DirecteurFinancier.objects(user=user).first()
            created = False
            if not directeur:
                directeur = DirecteurFinancier(
                    user=user,
                    departement=data.get('departement', 'Finance'),  # Valeur par défaut
                    specialite=data.get('specialite')  # Valeur par défaut
                )
                directeur.save()
                created = True
            
            # Mise à jour des champs utilisateur
            if 'nom_complet' in data and data['nom_complet'] is not None:
                user.nom_complet = data['nom_complet']
            if 'telephone' in data and data['telephone'] is not None:
                user.telephone = data['telephone']
            if 'sexe' in data and data['sexe'] is not None:
                # Validation du sexe si des choix sont définis
                if hasattr(user.__class__.sexe, 'choices') and data['sexe'] not in [choice[0] for choice in user.__class__.sexe.choices]:
                    return JsonResponse({"error": f"Valeur de 'sexe' invalide. Les options sont : {', '.join([choice[0] for choice in user.__class__.sexe.choices])}"}, status=400)
                user.sexe = data['sexe']
            if 'date_naissance' in data and data['date_naissance'] is not None:
                try:
                    user.date_naissance = datetime.datetime.strptime(data['date_naissance'], '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({"error": "Format de date invalide. Utilisez YYYY-MM-DD"}, status=400)
            
            # Gérer le matricule s'il est fourni
            if 'matricule' in data and data['matricule'] is not None:
                # Vérifier l'unicité seulement si une valeur est fournie
                existing_user = CustomUser.objects(matricule=data['matricule'], id__ne=user.id).first()
                if existing_user:
                    return JsonResponse({"error": "Ce matricule est déjà utilisé par un autre utilisateur."}, status=409)
                user.matricule = data['matricule']
            
            user.save()

            log_action(user, 'creation' if created else 'modification', 
                      "Profil créé" if created else "Profil mis à jour", 
                      f"Département: {directeur.departement}", "Terminé")
            
            return JsonResponse({
                "status": "success",
                "message": "Profil directeur et informations utilisateur mises à jour",
                "user_id": str(user.id),
                "directeur_created": created  # Indique si le profil comptable a été créé
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    # ------------------------- PUT -------------------------
    elif request.method == 'PUT':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la mise à jour complète"}, status=400)
        
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Check if the user is indeed a comptable
            directeur = DirecteurFinancier.objects(user=user).first()
            if not directeur:
                return JsonResponse({"error": "Profil directeur non trouvé pour cet utilisateur. L'utilisateur n'est pas un directeur enregistré."}, status=404)

            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Données JSON invalides"}, status=400)

            try:
                # Update CustomUser fields
                for key in ['username', 'email', 'nom_complet', 'telephone', 'sexe', 'matricule']:
                    if key in data and data[key] is not None:
                        # Specific validation for 'sexe' during PUT
                        if key == 'sexe' and hasattr(CustomUser.sexe, 'choices') and data['sexe'] not in [choice[0] for choice in CustomUser.sexe.choices]:
                            return JsonResponse({"error": f"Valeur de 'sexe' invalide. Les options sont : {', '.join([choice[0] for choice in CustomUser.sexe.choices])}"}, status=400)
                        setattr(user, key, data[key])
                
                # Handle password separately using set_password
                if 'password' in data and data['password'] is not None:
                    user.set_password(data['password'])
                
                # Handle date_naissance which is a DateField
                if 'date_naissance' in data and data['date_naissance'] is not None:
                    try:
                        user.date_naissance = datetime.datetime.strptime(data['date_naissance'], '%Y-%m-%d').date()
                    except ValueError:
                        return JsonResponse({"error": "Format de date de naissance invalide. Utilisez 'YYYY-MM-DD'."}, status=400)

                # Update Comptable fields
                if 'departement' in data and data['departement'] is not None:
                    directeur.departement = data['departement']
                
                if 'specialite' in data and data['specialite'] is not None:
                    directeur.specialite = data['specialite']
                
                if 'is_active_directeur_profile' in data and data['is_active_directeur_profile'] is not None:
                    if hasattr(directeur, 'is_active'):
                        directeur.is_active = data['is_active_directeur_profile']
                
                # Update user's general active status if passed
                if 'is_active_user' in data and data['is_active_user'] is not None:
                    user.is_active = data['is_active_user']

                user.save()  # This will trigger CustomUser's clean method
                directeur.save()  # This will trigger Comptable's clean method

                log_action(user, 'modification', "Profil mis à jour complètement", "", "Terminé")
                
                return JsonResponse({
                    "status": "success",
                    "message": "Profil directeur et utilisateur mis à jour avec succès",
                    "user_id": str(user.id)
                }, status=200)

            except ValidationError as e:
                # Catch validation errors from either user.save() or comptable.save()
                return JsonResponse({"error": f"Erreur de validation: {str(e)}"}, status=400)
            except NotUniqueError as e:
                # Catch unique constraint errors
                if 'username' in str(e):
                    return JsonResponse({"error": "Ce nom d'utilisateur est déjà utilisé."}, status=409)
                elif 'email' in str(e):
                    return JsonResponse({"error": "Cet email est déjà utilisé."}, status=409)
                elif 'matricule' in str(e):
                    return JsonResponse({"error": "Ce matricule est déjà utilisé."}, status=409)
                return JsonResponse({"error": f"Erreur de duplication: {str(e)}"}, status=409)
            except Exception as e:
                return JsonResponse({"error": f"Erreur lors de la mise à jour complète du profil: {str(e)}"}, status=500)

        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur serveur lors de la récupération de l'utilisateur pour la mise à jour: {str(e)}"}, status=500)

    # ------------------------- DELETE -------------------------
    elif request.method == 'DELETE':
        if not id:
            return JsonResponse({"error": "ID de l'utilisateur est requis pour la suppression"}, status=400)
        
        try:
            user = CustomUser.objects(id=id).first()
            if not user:
                return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
            
            # Let's ensure the user actually has a comptable role before allowing deletion through this endpoint
            if user.role != 'directeur':
                return JsonResponse({"error": "Impossible de supprimer. Cet utilisateur n'a pas le rôle 'directeur'."}, status=403)
            
            # Log before deletion
            log_action(user, 'suppression', "Compte utilisateur et profil directeur supprimés", "", "Terminé")
            
            # The Comptable profile will be deleted automatically due to reverse_delete_rule=CASCADE
            # in the Comptable model's 'user' field (if configured)
            user.delete()  # This will trigger the cascade deletion for the Comptable document

            return JsonResponse({
                "status": "success",
                "message": "Compte utilisateur et profil comptable supprimés avec succès"
            }, status=200)
            
        except DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur lors de la suppression du compte: {str(e)}"}, status=500)

    # Method Not Allowed
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


#@csrf_exempt
def logout_view(request):
    # Supprimer le cookie
    response = JsonResponse({'Status': True})
    response.delete_cookie('token')  # Effacer le cookie 'token'
    
    # Si l'utilisateur est authentifié, déconnecter
    logout(request)
    
    return response

# Vue pour l'authentification via Google
@api_view(['GET'])
def google_auth(request):
    return Response({'message': 'Endpoint Google Auth'})
@api_view(['POST'])
@csrf_exempt
@permission_classes([AllowAny])
def google_auth_callback(request):
    try:
        code = request.data.get('code')
        if not code:
            return JsonResponse({"error": "Code d'autorisation manquant"}, status=400)

        # Configuration OAuth Google
        token_url = "https://oauth2.googleapis.com/token"
        redirect_uri = "http://localhost:3000/auth/google/callback"
        client_id = "11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com"
        client_secret = "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"
        
        # Échange du code contre un token
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        
        token_response = requests.post(token_url, data=token_data)
        if token_response.status_code != 200:
            return JsonResponse(
                {"error": "Échec de l'obtention du token Google"}, 
                status=400
            )
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        # Récupération des infos utilisateur
        user_info = requests.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            params={"access_token": access_token}
        ).json()
        
        email = user_info.get("email", "").lower().strip()
        if not email:
            return JsonResponse({"error": "Email non trouvé dans les infos Google"}, status=400)
        
        # Version 1: En utilisant filter() puis get() ou create() séparément
        try:
            user = CustomUser.objects.get(email=email)
            created = False
        except CustomUser.DoesNotExist:
            user = CustomUser.objects.create(
                email=email,
                username=user_info.get("name", email.split("@")[0]),
                role='comptable',  # Rôle par défaut
                is_active=True
            )
            created = True
        
        # Génération du JWT
        payload = {
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            "iat": datetime.datetime.utcnow()
        }
        
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        
        response = JsonResponse({
            "token": jwt_token,
            "role": user.role,
            "user_id": str(user.id),
            "email": user.email
        })
        
        # Définir le cookie HTTP-only pour le refresh token si nécessaire
        response.set_cookie(
            key='refresh_token', 
            value=tokens.get('refresh_token', ''),
            httponly=True,
            secure=settings.DEBUG is False,
            samesite='Lax',
            max_age=604800  # 7 jours
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur Google OAuth: {str(e)}")
        return JsonResponse({"error": f"Erreur interne du serveur: {str(e)}"}, status=500)@api_view(['POST'])
#rapport 
from api.models import Rapport

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

    
    user = request.user if request.user.is_authenticated else None
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
                'responsable': audit.responsable
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
    "audit": {  # ← Ajoutez l'objet audit complet
        "id": str(audit.id),
        "nom": audit.nom,
        "type": audit.type,
        "responsable": audit.responsable,
        "date_debut": audit.date_debut.isoformat(),
        "date_fin": audit.date_fin.isoformat(),
        "statut": audit.statut,
        "description": audit.description,
        "observations": audit.observations
    }
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
                    'statut': audit.statut
                }
                
                # Mise à jour des champs
                for field in ['nom', 'type', 'responsable', 'statut', 'description']:
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
logger = logging.getLogger(__name__)
@csrf_exempt
def CompteApi(request, id=None):
    if request.method != 'POST' and (not id or id == 'undefined'):
        return JsonResponse({"error": "ID utilisateur requis"}, status=400)

    if request.method == 'GET':
        try:
            user = CustomUser.objects.get(id=id)
            user_data = {
                'id': str(user.id),
                'email': user.email,
                'username': user.username,
                'role': user.role,
            }
            return JsonResponse(user_data)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)

    elif request.method == 'DELETE':
        try:
            user = CustomUser.objects.get(id=id)
            logger.info(f"Suppression du compte utilisateur {user.username}")
            user.delete()
            return JsonResponse({"status": "success", "message": "Utilisateur supprimé avec succès"})
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Utilisateur non trouvé"}, status=404)
    


@csrf_exempt
def ListeComptes(request):
    if request.method == 'GET':
        try:
            logger.info("Exécution de ListeComptes")

            # Récupérer tous les utilisateurs ayant le rôle comptable ou directeur
            users = CustomUser.objects.filter(role__in=['comptable', 'directeur'])
            users_data = []

            for user in users:
                user_data = {
                    'id': str(user.id),
                    'nom': str(user.username),
                    'email': str(user.email),
                    'role': str(user.role),
                    'statut': "Actif"  # Statut fixé manuellement
                }
                users_data.append(user_data)

            logger.info(f"ListeComptes - données récupérées: {len(users_data)} utilisateurs")
            return JsonResponse({'users': users_data}, status=200)

        except Exception as e:
            logger.error(f"Erreur dans ListeComptes: {str(e)}")
            import traceback
            logger.error(f"Détails de l'erreur: {traceback.format_exc()}")
            return JsonResponse({"error": "Une erreur s'est produite lors de la récupération des utilisateurs."}, status=500)

    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)


from django.utils.decorators import method_decorator
# Configurer le logger
logger = logging.getLogger(__name__)

# --- Fonctions utilitaires sécurisées ---
def safe_float(value):
    """Convertit une valeur en float de manière sécurisée, retourne None si échec."""
    if value is None or (isinstance(value, str) and value.strip() == ''):
        return None 
    try:
        s_value = str(value).strip()
        if isinstance(value, float): # Si c'est déjà un float, pas de conversion
            return float(value)

        # Logique pour gérer les virgules et les points comme séparateurs décimaux
        # et retirer les milliers si présents.
        if ',' in s_value and '.' in s_value:
            # Si la dernière virgule est après le dernier point (ex: "1.234,56")
            if s_value.rfind(',') > s_value.rfind('.'):
                s_value = s_value.replace('.', '').replace(',', '.')
            else: # Sinon (ex: "1,234.56")
                s_value = s_value.replace(',', '')
        elif ',' in s_value: # Si seulement des virgules (ex: "123,45")
            s_value = s_value.replace(',', '.')

        # Supprime tous les caractères non numériques, non points et non tirets (pour les nombres négatifs)
        cleaned_value = re.sub(r'[^\d.-]', '', s_value)

        # Gérer les cas où il y aurait trop de tirets (ex: "--123.45")
        if cleaned_value.count('-') > 1 or (cleaned_value.count('-') == 1 and not cleaned_value.startswith('-')):
            cleaned_value = cleaned_value.replace('-', '') # Supprime les tirets supplémentaires

        if not cleaned_value or cleaned_value == '.' or cleaned_value == '-':
            logger.debug(f"safe_float: Valeur nettoyée vide ou invalide pour '{value}'. Retourne None.")
            return None

        return round(float(cleaned_value), 2)
    except (ValueError, TypeError) as e:
        logger.warning(f"safe_float: Impossible de convertir '{value}' en float. Erreur: {e}. Retourne None.")
    return None

def safe_str(value, default=''):
    """Convertit une valeur en chaîne de caractères de manière sécurisée, retourne une chaîne vide si None."""
    if value is None:
        return default
    return str(value).strip()

def safe_date(value):
    """Convertit une valeur en objet date de manière sécurisée, retourne None si échec ou vide."""
    if value is None or not isinstance(value, str) or value.strip() == '':
        logger.debug(f"safe_date: Valeur d'entrée vide ou invalide: '{value}'. Retourne None.") # NOUVEAU LOG
        return None

    # Liste des formats de date à essayer, du plus spécifique au plus générique
    date_formats = [
        '%Y-%m-%dT%H:%M:%S.%f%z', # Ex: 2022-03-31T00:00:00.000+00:00 (avec fuseau horaire et microsecondes)
        '%Y-%m-%dT%H:%M:%S%z',    # Ex: 2022-03-31T00:00:00+00:00 (avec fuseau horaire)
        '%Y-%m-%d %H:%M:%S',      # Ex: 2023-01-15 10:30:00
        '%Y-%m-%d',               # Ex: 2023-01-15 (format ISO du frontend ou extraction)
        '%d/%m/%Y',               # Ex: 15/01/2023 (format courant)
        '%d-%m-%Y',               # Ex: 15-01-2023
        '%d.%m.%Y',               # Ex: 15.01.2023
        '%m/%d/%Y',               # Ex: 01/15/2023
        '%Y/%m/%d',               # Ex: 2023/01/15
        '%d/%m/%y',               # Ex: 15/01/23
        '%m/%d/%y'                # Ex: 01/15/23
    ]

    logger.debug(f"safe_date: Tentative de parsing pour la valeur: '{value}'") # NOUVEAU LOG
    for fmt in date_formats:
        try:
            # Tente de parser avec le format complet, y compris l'heure et le fuseau horaire
            dt_obj = datetime.datetime.strptime(value.strip(), fmt)
            logger.debug(f"safe_date: Parsé avec succès '{value}' en {dt_obj} avec le format '{fmt}'.") # NOUVEAU LOG
            return dt_obj.date() # Retourne seulement la partie date
        except ValueError:
            # Si le parsing échoue, essayez de splitter la chaîne avant de parser la date seule
            try:
                # Cette partie s'assure que nous gérons bien "2023-01-15 10:30:00" ou "2023-01-15T..."
                # en ne prenant que la partie date.
                parts = value.strip().split(' ')
                if len(parts) > 0:
                    # Traiter les formats ISO avec 'T' comme séparateur aussi
                    if 'T' in parts[0]:
                        parts[0] = parts[0].split('T')[0]

                    # Ici, on re-tente de parser la partie date avec le même format
                    # car le format peut correspondre à la partie date seule
                    dt_obj = datetime.datetime.strptime(parts[0], fmt).date() 
                    logger.debug(f"safe_date: Parsé avec succès '{parts[0]}' en {dt_obj} (date seule) avec le format '{fmt}'.") # NOUVEAU LOG
                    return dt_obj
            except ValueError:
                continue # Essayer le format suivant

    logger.warning(f"safe_date: Impossible de parser la date '{value}' avec les formats connus. Retourne None.")
    return None

@method_decorator(csrf_exempt, name='dispatch')
class FactureAPIView(View):
    def _authenticate(self, request):
        """Authentification JWT (non testée ici, gardée pour la structure)"""
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            logger.warning("Tentative d'accès non autorisé: pas de jeton Bearer.")
            return None

        try:
            token = auth_header.split(' ')[1]
            # Assurez-vous que settings.JWT_SECRET_KEY est défini dans votre settings.py
            # et que 'jwt' est importé
            # import jwt # Assurez-vous que jwt est importé si utilisé
            # return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
            # Pour l'exemple, nous retournons un utilisateur factice
            return {"user": "debug_user"} 
        except Exception as e:
            logger.error(f"Erreur d'authentification: {str(e)}", exc_info=True)
            return None

    def get(self, request, id=None):
        """Récupérer une ou plusieurs factures"""
        user = self._authenticate(request)
        if not user and not settings.DEBUG: # Autoriser GET sans auth en DEBUG
            return JsonResponse({'error': 'Non autorisé'}, status=401)

        try:
            if id:
                facture = Facture.objects.get(id=ObjectId(id))
                response_data = {
                    'id': str(facture.id),
                    'numero': facture.numero,
                    'montant_total': safe_float(facture.montant_total), # Utiliser safe_float pour la cohérence
                    'montant_ht': safe_float(getattr(facture, 'montant_ht', None)),
                    'montant_tva': safe_float(getattr(facture, 'montant_tva', None)),
                    'net_a_payer': safe_float(getattr(facture, 'net_a_payer', None)),
                    'taux_tva': safe_float(getattr(facture, 'taux_tva', None)),
                    'mode_reglement': safe_str(getattr(facture, 'mode_reglement', None)),
                    'reference_paiement': safe_str(getattr(facture, 'reference_paiement', None)),
                    # Correction ici pour le GET d'une seule facture
                    'date_emission': facture.date_emission.isoformat() if facture.date_emission else None,
                    'date_echeance': getattr(facture, 'date_echeance', None).isoformat() if getattr(facture, 'date_echeance', None) else None,
                    'emetteur': safe_str(facture.emetteur),
                    'client': safe_str(getattr(facture, 'client', None)), # Utilise le champ 'client' du modèle
                    'destinataire': safe_str(facture.destinataire), # Utilise le champ 'destinataire' du modèle
                    'devise': safe_str(getattr(facture, 'devise', 'TND')),
                    'fichier_url': request.build_absolute_uri(f'/api/factures/{facture.id}/download/') if facture.fichier else None,
                    # Correction ici pour le GET d'une seule facture
                    'filename': getattr(facture.fichier, 'filename', None) if facture.fichier else None,
                    'date_import': facture.date_import.isoformat() if hasattr(facture, 'date_import') and facture.date_import else None,
                    'type': safe_str(getattr(facture, 'type', 'facture')),
                    'confiance_extraction': safe_float(getattr(facture, 'confiance_extraction', None))
                }
                logger.debug(f"GET (ID): Retourne la facture {id}: {json.dumps(response_data, indent=2)}")
                return JsonResponse(response_data)
            else:
                page = int(request.GET.get('page', 1))
                limit = int(request.GET.get('limit', 100))
                skip = (page - 1) * limit

                factures = Facture.objects.skip(skip).limit(limit)
                total = Facture.objects.count()

                data_list = []
                for f in factures:
                    # Logs détaillés pour chaque facture lors du GET
                    logger.debug(f"GET - Facture ID: {str(f.id)}, Numéro: {f.numero}, Date Em.: {f.date_emission}, Client: {getattr(f, 'client', 'N/A')}")
                    logger.debug(f"GET - Montants: Total={f.montant_total}, HT={getattr(f, 'montant_ht', None)}, TVA={getattr(f, 'montant_tva', None)}, Net={getattr(f, 'net_a_payer', None)}")

                    data_list.append({
                        'id': str(f.id),
                        'numero': safe_str(f.numero),
                        'montant_total': safe_float(f.montant_total),
                        'montant_ht': safe_float(getattr(f, 'montant_ht', None)),
                        'montant_tva': safe_float(getattr(f, 'montant_tva', None)),
                        'net_a_payer': safe_float(getattr(f, 'net_a_payer', None)),
                        'mode_reglement': safe_str(getattr(f, 'mode_reglement', None)),
                        # Ici aussi, si facture.date_emission est None, cela renverra None
                        'date_emission': f.date_emission.isoformat() if f.date_emission else None, 
                        'date_echeance': getattr(f, 'date_echeance', None).isoformat() if getattr(f, 'date_echeance', None) else None,
                        'emetteur': safe_str(f.emetteur),
                        'client': safe_str(getattr(f, 'client', None)), # Retourne le champ 'client'
                        'destinataire': safe_str(f.destinataire), # Retourne le champ 'destinataire'
                        'fichier_url': request.build_absolute_uri(f'/api/factures/{f.id}/download/') if f.fichier else None,
                        'filename': getattr(f.fichier, 'filename', None) if f.fichier else None,
                        'date_import': f.date_import.isoformat() if hasattr(f, 'date_import') and f.date_import else None,
                        'type': safe_str(getattr(f, 'type', 'facture')),
                        'devise': safe_str(getattr(f, 'devise', 'TND')),
                        'confiance_extraction': safe_float(getattr(f, 'confiance_extraction', None))
                    })

                logger.info(f"GET - Retourne {len(data_list)} factures sur {total} au total (page {page}).")
                return JsonResponse({
                    'total': total,
                    'page': page,
                    'limit': limit,
                    'data': data_list
                }, safe=False)

        except Facture.DoesNotExist:
            logger.warning(f"Facture avec ID '{id}' non trouvée.")
            return JsonResponse({'error': 'Facture non trouvée'}, status=404)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des factures: {str(e)}", exc_info=True)
            return JsonResponse({'error': 'Erreur serveur interne lors du GET'}, status=500)


    def post(self, request):
        """Créer une nouvelle facture"""
        # L'authentification est commentée pour faciliter le test, à décommenter en production
        # user = self._authenticate(request)
        # if not user:
        #     return JsonResponse({'error': 'Non autorisé'}, status=401)

        try:
            if 'fichier' not in request.FILES:
                logger.error("POST - Aucun fichier fourni.")
                return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)

            fichier = request.FILES['fichier']

            if not fichier.name.lower().endswith('.pdf'):
                logger.error(f"POST - Type de fichier invalide: {fichier.name}. Seuls les PDF sont acceptés.")
                return JsonResponse({'error': 'Seuls les fichiers PDF sont acceptés'}, status=400)

            if fichier.size > 10 * 1024 * 1024: 
                logger.error(f"POST - Fichier trop volumineux: {fichier.size} octets. Max 10MB.")
                return JsonResponse({'error': 'Fichier trop volumineux (max 10MB)'}, status=400)

            metadata = {}
            try:
                if request.POST.get('metadata'):
                    metadata = json.loads(request.POST['metadata'])
                    logger.info(f"POST - Métadonnées reçues du frontend: {metadata}")
                else:
                    logger.info("POST - Pas de métadonnées fournies par le frontend, tentons l'extraction automatique.")
            except json.JSONDecodeError as e:
                logger.error(f"POST - Erreur parsing métadonnées JSON du frontend: {str(e)}", exc_info=True)
                return JsonResponse({'error': 'Format de métadonnées invalide'}, status=400)

            # --- LOGIQUE D'EXTRACTION AUTOMATIQUE (si pas de métadonnées du frontend) ---
            if not metadata:
                try:
                    fichier.seek(0) # Remettre le curseur au début du fichier
                    response = requests.post(
                        'http://localhost:5000/api/extract-document', # Assurez-vous que l'URL est correcte pour votre service Flask
                        files={'file': (fichier.name, fichier, 'application/pdf')},
                        data={'type': 'invoice'},
                        timeout=30
                    )

                    if response.status_code == 200:
                        result = response.json()
                        if result.get('success') and result.get('data'):
                            metadata = result['data'] # Utilisez les données extraites comme métadonnées
                            logger.info(f"POST - Données extraites automatiquement (brutes): {metadata}")
                        else:
                            logger.warning(f"POST - Extraction automatique n'a pas retourné de données valides: {response.text}")
                    else:
                        logger.warning(f"POST - Échec appel extraction automatique, statut: {response.status_code}, réponse: {response.text}")
                except requests.exceptions.RequestException as e:
                    logger.warning(f"POST - Erreur réseau/timeout lors de l'extraction automatique: {str(e)}")
                except Exception as e:
                    logger.warning(f"POST - Échec général extraction automatique: {str(e)}", exc_info=True)

            # NOUVEAU LOG : LES MÉTA-DONNÉES COMPLÈTES AVANT TRAITEMENT
            logger.info(f"POST - Métadonnées COMPLÈTES reçues (frontend ou extraction): {json.dumps(metadata, indent=2)}")


            # --- Nettoyage et validation des métadonnées AVEC LES FONCTIONS safe_ ---
            cleaned_metadata = {}

            # Numéro de facture: prioriser le frontend, sinon extraction, sinon UUID
            numero_from_frontend = metadata.get('numero')
            if numero_from_frontend:
                cleaned_metadata['numero'] = safe_str(numero_from_frontend)
            elif metadata.get('numero_facture'): # Fallback si le service d'extraction utilise 'numero_facture'
                cleaned_metadata['numero'] = safe_str(metadata.get('numero_facture'))
            else:
                cleaned_metadata['numero'] = f"FAC-{uuid.uuid4().hex[:6].upper()}"
                logger.warning(f"POST - Aucun numéro de facture valide trouvé, génération d'un UUID: {cleaned_metadata['numero']}")

            # Gestion de l'émetteur, destinataire et client
            cleaned_metadata['emetteur'] = safe_str(metadata.get('emetteur') or metadata.get('fournisseur'))

            # Le champ 'client' dans le modèle Django doit correspondre à ce que le frontend attend
            # On privilégie 'client' si le frontend l'envoie, sinon 'destinataire' (qui peut être le client aussi)
            cleaned_metadata['client'] = safe_str(metadata.get('client') or metadata.get('destinataire'))
            # 'destinataire' peut être le même que 'client' ou une autre valeur si votre modèle le permet
            cleaned_metadata['destinataire'] = safe_str(metadata.get('destinataire') or cleaned_metadata['client'])


            cleaned_metadata['mode_reglement'] = safe_str(metadata.get('mode_reglement'))
            cleaned_metadata['reference_paiement'] = safe_str(metadata.get('reference_paiement'))
            cleaned_metadata['devise'] = safe_str(metadata.get('devise', 'TND'))
            cleaned_metadata['type'] = safe_str(metadata.get('type', 'facture'))
            cleaned_metadata['confiance_extraction'] = safe_float(metadata.get('confiance_extraction'))

            # Champs numériques
            cleaned_metadata['montant_total'] = safe_float(metadata.get('montant_total'))
            cleaned_metadata['montant_ht'] = safe_float(metadata.get('montant_ht'))
            cleaned_metadata['montant_tva'] = safe_float(metadata.get('montant_tva'))
            cleaned_metadata['net_a_payer'] = safe_float(metadata.get('net_a_payer'))
            cleaned_metadata['taux_tva'] = safe_float(metadata.get('taux_tva'))

            # Calculs automatiques si des montants sont manquants ou nuls
            if cleaned_metadata['montant_total'] is None and \
               (cleaned_metadata['montant_ht'] is not None and cleaned_metadata['montant_ht'] > 0) and \
               (cleaned_metadata['montant_tva'] is not None and cleaned_metadata['montant_tva'] > 0):
                cleaned_metadata['montant_total'] = round(cleaned_metadata['montant_ht'] + cleaned_metadata['montant_tva'], 2)
                logger.info(f"POST - Montant total calculé: {cleaned_metadata['montant_total']}")

            if cleaned_metadata['net_a_payer'] is None and \
               cleaned_metadata['montant_total'] is not None and cleaned_metadata['montant_total'] > 0:
                cleaned_metadata['net_a_payer'] = cleaned_metadata['montant_total']
                logger.info(f"POST - Net à payer ajusté: {cleaned_metadata['net_a_payer']}")

            # Champs de date - LOGIQUE CRITIQUE POUR LA DATE D'ÉMISSION
            # Capture des dates brutes pour le logging
            raw_date_emission_from_metadata = metadata.get('date_emission')
            raw_date_from_metadata = metadata.get('date') # Ce pourrait être la date problématique

            logger.info(f"POST - Raw metadata date_emission: '{raw_date_emission_from_metadata}'")
            logger.info(f"POST - Raw metadata date: '{raw_date_from_metadata}'")

            # Prioriser 'date_emission' si présent, sinon 'date'
            date_value_to_parse = raw_date_emission_from_metadata or raw_date_from_metadata

            parsed_date_emission = safe_date(date_value_to_parse)
            parsed_date_echeance = safe_date(metadata.get('date_echeance'))

            # Traitement des fuseaux horaires si votre modèle utilise DateTimeField et USE_TZ est True
            # Et si la date a été parsée avec succès
            if parsed_date_emission: # Vérifier si une date a été parsée
                if settings.USE_TZ:
                    # Convertir l'objet date en datetime à minuit, puis le rendre aware
                    dt_object_naive = datetime.datetime.combine(parsed_date_emission, datetime.time.min)
                    # Rendre l'objet datetime aware du fuseau horaire local (TIME_ZONE de Django)
                    cleaned_metadata['date_emission'] = timezone.make_aware(dt_object_naive, timezone.get_current_timezone()) # Utilise le fuseau horaire configuré dans settings
                    logger.info(f"POST - Date émission aware (après make_aware): {cleaned_metadata['date_emission']}")
                else:
                    # Si USE_TZ est False, stocker simplement l'objet datetime.date (ou le convertir en datetime naïf)
                    cleaned_metadata['date_emission'] = parsed_date_emission # C'est déjà un datetime.date
                    logger.info(f"POST - Date émission naïve (USE_TZ=False): {cleaned_metadata['date_emission']}")
            else:
                cleaned_metadata['date_emission'] = None
                logger.warning("POST - Aucune date d'émission valide après parsing ou source manquante.")

            if parsed_date_echeance:
                if settings.USE_TZ:
                    dt_object_naive = datetime.datetime.combine(parsed_date_echeance, datetime.time.min)
                    cleaned_metadata['date_echeance'] = timezone.make_aware(dt_object_naive, timezone.get_current_timezone())
                    logger.info(f"POST - Date échéance aware (après make_aware): {cleaned_metadata['date_echeance']}")
                else:
                    cleaned_metadata['date_echeance'] = parsed_date_echeance
                    logger.info(f"POST - Date échéance naïve (USE_TZ=False): {cleaned_metadata['date_echeance']}")
            else:
                cleaned_metadata['date_echeance'] = None
                logger.warning("POST - Aucune date d'échéance valide après parsing ou source manquante.")


            # >>> LOG TRÈS IMPORTANT AVANT LA CRÉATION DE LA FACTURE <<<<
            logger.info(f"POST - Métadonnées nettoyées finales (avant création Facture): {cleaned_metadata}")

            # Création de la facture
            try:
                facture = Facture(
                    numero=cleaned_metadata['numero'],
                    montant_total=cleaned_metadata['montant_total'],
                    montant_ht=cleaned_metadata['montant_ht'],
                    montant_tva=cleaned_metadata['montant_tva'],
                    net_a_payer=cleaned_metadata['net_a_payer'],
                    taux_tva=cleaned_metadata['taux_tva'],
                    mode_reglement=cleaned_metadata['mode_reglement'],
                    reference_paiement=cleaned_metadata['reference_paiement'],
                    # Les dates doivent être des objets datetime.date ou datetime.datetime (aware ou naive)
                    date_emission=cleaned_metadata['date_emission'], 
                    date_echeance=cleaned_metadata['date_echeance'],
                    emetteur=cleaned_metadata['emetteur'],
                    client=cleaned_metadata['client'], 
                    destinataire=cleaned_metadata['destinataire'], 
                    devise=cleaned_metadata['devise'],
                    type=cleaned_metadata['type'],
                    confiance_extraction=cleaned_metadata['confiance_extraction'],
                    date_import=datetime.datetime.now() # date_import peut être laissé tel quel, c'est une date interne
                )

                # NOUVEAU LOG : L'OBJET DATE_EMISSION DANS LA FACTURE AVANT SAUVEGARDE
                logger.info(f"POST - FINAL avant sauvegarde: facture.date_emission={facture.date_emission}, type={type(facture.date_emission).__name__}, tzinfo={getattr(facture.date_emission, 'tzinfo', 'Naïf')}")

                # Sauvegarde du fichier dans GridFS via MongoEngine FileField
                fichier.seek(0) # Remettre le curseur au début du fichier
                facture.fichier.put(fichier, content_type='application/pdf', filename=fichier.name)
                facture.save()

                logger.info(f"POST - Facture créée avec succès: ID {str(facture.id)}, Numéro {facture.numero}")

            except Exception as e:
                logger.error(f"POST - Erreur lors de la création/sauvegarde de la facture dans MongoDB: {str(e)}", exc_info=True)
                raise # Rélève l'exception pour être capturée par le outer try-except

            # Retour de la réponse JSON après succès
            response_data = {
                'id': str(facture.id),
                'numero': safe_str(facture.numero),
                'montant_total': safe_float(facture.montant_total),
                'montant_ht': safe_float(facture.montant_ht),
                'montant_tva': safe_float(facture.montant_tva),
                'net_a_payer': safe_float(facture.net_a_payer),
                'mode_reglement': safe_str(facture.mode_reglement),
                'reference_paiement': safe_str(getattr(facture, 'reference_paiement', None)),
                'date_emission': facture.date_emission.isoformat() if facture.date_emission else None,
                'date_echeance': facture.date_echeance.isoformat() if facture.date_echeance else None,
                'emetteur': safe_str(facture.emetteur),
                'client': safe_str(getattr(facture, 'client', None)), 
                'destinataire': safe_str(facture.destinataire), 
                'devise': safe_str(getattr(facture, 'devise', 'TND')),
                'type': safe_str(getattr(facture, 'type', 'facture')),
                'confiance_extraction': safe_float(getattr(facture, 'confiance_extraction', None)),
                'fichier_url': request.build_absolute_uri(f'/api/factures/{facture.id}/download/') if facture.fichier else None,
                'filename': fichier.name, # filename est le nom du fichier original
                'date_import': facture.date_import.isoformat() if facture.date_import else None
            }
            logger.info(f"POST - Réponse succès: {json.dumps(response_data, indent=2)}")
            return JsonResponse(response_data, status=201)

        except ValueError as e:
            logger.error(f"POST - Erreur de validation des données reçues (ValueError): {str(e)}", exc_info=True)
            return JsonResponse({'error': f'Données invalides: {str(e)}'}, status=400)
        except Exception as e:
            logger.error(f"POST - Erreur générale lors de la création de la facture: {str(e)}", exc_info=True)
            return JsonResponse({
                'error': 'Erreur serveur interne lors du POST', 
                'details': str(e) if settings.DEBUG else 'Une erreur inattendue est survenue.'
            }, status=500)

    def delete(self, request, id):
        """Supprimer une facture"""
        user = self._authenticate(request)
        if not user and not settings.DEBUG: # Autoriser DELETE sans auth en DEBUG
            return JsonResponse({'error': 'Non autorisé'}, status=401)

        try:
            if not id:
                logger.error("DELETE - ID de facture manquant.")
                return JsonResponse({'error': 'ID requis'}, status=400)

            facture = Facture.objects.get(id=ObjectId(id))
            # Supprimer le fichier associé également
            if facture.fichier:
                # Utiliser getattr pour accéder au nom de fichier de manière sécurisée
                logger.info(f"DELETE - Tentative de suppression du fichier de facture '{getattr(facture.fichier, 'filename', 'nom inconnu')}' (ID: {facture.id}).")
                facture.fichier.delete()
                logger.info(f"DELETE - Fichier de facture '{getattr(facture.fichier, 'filename', 'nom inconnu')}' supprimé avec succès.")
            else:
                logger.info(f"DELETE - Pas de fichier associé à la facture ID {id}.")

            facture.delete()
            logger.info(f"DELETE - Facture avec ID {id} supprimée avec succès.")
            return JsonResponse({'message': 'Facture supprimée avec succès'})

        except Facture.DoesNotExist:
            logger.warning(f"DELETE - Facture avec ID '{id}' non trouvée pour suppression.")
            return JsonResponse({'error': 'Facture non trouvée'}, status=404)
        except Exception as e:
            logger.error(f"DELETE - Erreur générale lors de la suppression de la facture ID {id}: {str(e)}", exc_info=True)
            return JsonResponse({'error': 'Erreur serveur interne lors du DELETE'}, status=500)


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




logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class ReleveAPIView(View):
    def _authenticate(self, request):
        """Authentification JWT pour sécuriser l'API."""
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            logger.warning("Authentication: Missing or invalid Authorization header.")
            return None
        
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.error("Authentication: Token expired.")
            return None
        except jwt.InvalidTokenError:
            logger.error("Authentication: Invalid token.")
            return None
        except Exception as e:
            logger.error(f"Unexpected authentication error: {str(e)}", exc_info=True)
            return None

    def _format_operations(self, operations):
        # Configuration de la locale pour le format numérique français
        # Utilisez 'fr_FR.UTF-8' pour Linux/macOS ou 'fra_fra' pour Windows
        # Attention: locale.setlocale n'est pas thread-safe, pour une API multi-threadée,
        # il est préférable d'utiliser une fonction de parsing explicite ou de le gérer via un middleware
        # Pour le débogage, c'est acceptable.
        try:
            locale.setlocale(locale.LC_NUMERIC, 'fr_FR.UTF-8') # Pour Linux/macOS
        except locale.Error:
            try:
                locale.setlocale(locale.LC_NUMERIC, 'fra_fra') # Pour Windows
            except locale.Error:
                logger.warning("Could not set locale for French numeric format. Ensure correct locale is installed on your system.")
                # Si la locale ne peut pas être définie, on peut toujours tenter un nettoyage manuel.

        formatted_operations = []
        for op in operations:
            if isinstance(op, dict):
                # Fonction utilitaire pour nettoyer et convertir les nombres
                def parse_french_float(value):
                    if value is None:
                        return 0.0
                    try:
                        # Supprime les espaces de milliers, remplace la virgule par un point
                        s_value = str(value).replace(' ', '').replace(',', '.')
                        return float(s_value)
                    except ValueError:
                        logger.error(f"Failed to parse numeric value: '{value}'. Returning 0.0")
                        return 0.0

                credit = parse_french_float(op.get('credit'))
                debit = parse_french_float(op.get('debit'))
                solde = parse_french_float(op.get('solde'))
                
                montant = credit - debit # Montant unifié (crédit positif, débit négatif)
                
                op_date_str = op.get('date', '')
                formatted_date = None
                if op_date_str:
                    try:
                        # Tente de parser les formats de date courants
                        if '/' in op_date_str:
                            formatted_date = datetime.datetime.strptime(op_date_str, "%d/%m/%Y")
                        elif '-' in op_date_str and len(op_date_str.split('-')[0]) == 4: # Suppose AAAA-MM-JJ
                            formatted_date = datetime.datetime.strptime(op_date_str, "%Y-%m-%d")
                        elif '-' in op_date_str and len(op_date_str.split('-')[0]) <= 2: # Suppose JJ-MM-AAAA
                            formatted_date = datetime.datetime.strptime(op_date_str, "%d-%m-%Y")
                        else:
                            logger.warning(f"Unrecognized date format for operation: '{op_date_str}'. Skipping date conversion.")
                    except ValueError:
                        logger.error(f"Date conversion error for operation: '{op_date_str}'. Expected formats like 'DD/MM/YYYY' or 'YYYY-MM-DD'.", exc_info=True)

                formatted_op = {
                    'date': formatted_date, 
                    'libelle': op.get('libelle', op.get('description', '')),
                    'debit': debit,
                    'credit': credit,
                    'solde': solde, 
                    'montant': montant, 
                    'ref_facture': op.get('ref_facture', ''), 
                    'reference': op.get('reference', op.get('ref', '')),
                    'numero_piece': op.get('numero_piece', op.get('piece', '')),
                    'type_operation': op.get('type_operation', op.get('type', '')),
                }

                if formatted_op['date'] is None:
                    logger.error(f"Operation skipped: 'date' is required but missing or invalid. Raw op: {op}")
                    continue 
                if not formatted_op['libelle']:
                    logger.warning(f"Operation: 'libelle' is required but missing. Using empty string. Raw op: {op}")

                formatted_operations.append(formatted_op)
        
        return formatted_operations

    def get(self, request, id=None):
        """Récupère un ou plusieurs relevés bancaires avec toutes les données nécessaires au rapprochement."""
        user_payload = self._authenticate(request)
        if not user_payload:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            if id:
                releve = Banque.objects.get(id=ObjectId(id)) 
                
                metadata = releve.metadata or {} # Assurez-vous que metadata est toujours un dictionnaire
                
                data = {
                    'id': str(releve.id),
                    # Accédez au nom du fichier via l'attribut .filename de l'objet GridFSProxy
                    'nom_fichier': releve.fichier.filename if releve.fichier else None, 
                    'date_import': releve.date_import.isoformat() if releve.date_import else None,
                    
                    'metadata': {
                        'nom': releve.nom, 
                        'numero_compte': releve.numero_compte,
                        'titulaire': releve.titulaire, 
                        'banque': releve.nom, # Mappe 'banque' sur le champ 'nom' du modèle
                        'iban': releve.iban, 
                        'bic': releve.bic,
                        'numero': releve.numero,
                        
                        'periode': releve.periode,
                        'date_debut': releve.date_debut.isoformat() if releve.date_debut else None,
                        'date_fin': releve.date_fin.isoformat() if releve.date_fin else None,
                        
                        'solde_initial': releve.solde_initial, 
                        'solde_final': releve.solde_final,
                        
                        'total_credits': releve.total_credits,
                        'total_debits': releve.total_debits,
                        
                        'operations': [op.to_mongo() for op in releve.operations] if releve.operations else [],
                        
                        'client': releve.titulaire, # Mappe 'client' sur le champ 'titulaire'
                        'emetteur': metadata.get('emetteur'), 
                        'nom_titulaire': releve.titulaire,
                    },
                    
                    'downloadUrl': request.build_absolute_uri(f'/api/banques/{releve.id}/download/') if releve.id else None,
                    'banque': releve.nom 
                }
                
                return JsonResponse(data)
            
            else: # Pour lister plusieurs relevés
                date_debut_str = request.GET.get('date_debut')
                date_fin_str = request.GET.get('date_fin')
                
                queryset = Banque.objects.all()
                
                if date_debut_str and date_fin_str:
                    try:
                        date_debut_obj = datetime.datetime.strptime(date_debut_str, "%Y-%m-%d")
                        date_fin_obj = datetime.datetime.strptime(date_fin_str, "%Y-%m-%d") + datetime.timedelta(days=1)
                        queryset = queryset.filter(
                            date_import__gte=date_debut_obj,
                            date_import__lt=date_fin_obj 
                        )
                    except ValueError:
                        logger.warning(f"Malformed date filter: date_debut={date_debut_str}, date_fin={date_fin_str}")
                        pass # Continue sans filtrer par date si les dates sont mal formées
                
                releves = []
                for releve in queryset.order_by('-date_import'):
                    metadata = releve.metadata or {} 
                    
                    releve_data = {
                        'id': str(releve.id),
                        'nom_fichier': releve.fichier.filename if releve.fichier else None,
                        'date_import': releve.date_import.isoformat() if releve.date_import else None,
                        
                        'metadata': {
                            'nom': releve.nom, 
                            'numero_compte': releve.numero_compte,
                            'titulaire': releve.titulaire,
                            
                            'banque': releve.nom, 
                            'iban': releve.iban, 
                            'bic': releve.bic, 
                            'numero': releve.numero,
                            
                            'periode': releve.periode,
                            'date_debut': releve.date_debut.isoformat() if releve.date_debut else None,
                            'date_fin': releve.date_fin.isoformat() if releve.date_fin else None,
                            
                            'solde_initial': releve.solde_initial,
                            'solde_final': releve.solde_final,
                            
                            'total_credits': releve.total_credits,
                            'total_debits': releve.total_debits,
                            
                            'operations': [op.to_mongo() for op in releve.operations] if releve.operations else [], 
                            
                            'client': releve.titulaire, 
                            'emetteur': metadata.get('emetteur'),
                            'nom_titulaire': releve.titulaire,
                        },
                        
                        'downloadUrl': request.build_absolute_uri(f'/api/banques/{releve.id}/download/'),
                        'banque': releve.nom 
                    }
                    releves.append(releve_data)
                
                return JsonResponse(releves, safe=False)
            
        except Banque.DoesNotExist: # Exception spécifique à MongoEngine
            return JsonResponse({'error': 'Bank statement not found'}, status=404)
        except Exception as e:
            logger.error(f"GET error: {str(e)}", exc_info=True)
            return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)

    def post(self, request):
        """Crée un nouveau relevé bancaire."""
        user_payload = self._authenticate(request)
        if not user_payload:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        releve_data = {}   
        try:
            if 'fichier' not in request.FILES:
                return JsonResponse({'error': 'No file provided'}, status=400)
            
            # Récupère l'objet UploadedFile qui contient le contenu binaire du fichier
            fichier = request.FILES['fichier'] 
            
            if not fichier.name.lower().endswith('.pdf'):
                return JsonResponse({'error': 'Only PDF files are accepted'}, status=400)
            
            if fichier.size > 10 * 1024 * 1024: # Limite de 10 Mo
                return JsonResponse({'error': 'File too large (max 10MB)'}, status=400)

            metadata_str = request.POST.get('metadata', '{}')
            try:
                metadata = json.loads(metadata_str)
                # --- LOG DE DÉBOGAGE CRUCIAL ---
                logger.debug(f"DEBUG: Metadata received from request (POST): {metadata}") 
            except json.JSONDecodeError:
                logger.error(f"Invalid metadata format in POST: {metadata_str}")
                return JsonResponse({'error': 'Invalid metadata format'}, status=400)
                # AJOUTEZ LA LIGNE SUIVANTE ICI :
             #Ajoutez cette ligne tout en haut du fichier si elle n'y est pas déjà
            logger.debug(f"DEBUG_RAW_OPERATIONS: {metadata.get('operations', [])}")
            
            releve_data['operations'] = self._format_operations(metadata.get('operations', []))
            # Récupérez les données clés avec des valeurs de secours.
            # C'est ici que vous définissez ce qui sera stocké dans les champs principaux.
            bank_name = metadata.get('banque', metadata.get('nom', 'Unknown Bank'))
            account_number = metadata.get('numero_compte', metadata.get('iban', 'N/A'))
            account_holder = metadata.get('titulaire', metadata.get('client', metadata.get('nom_titulaire', 'Unknown Holder')))
            
            # --- LOG DE DÉBOGAGE POUR LES VALEURS PRINCIPALES ---
            logger.debug(f"DEBUG: Processed bank_name: '{bank_name}', account_holder: '{account_holder}'")

            # Validez les champs obligatoires du modèle
            # Si ces champs sont vides ici, c'est que l'extraction n'a pas mis les bonnes données dans 'metadata'
            fields_to_validate = {
                'nom': bank_name,
                'numero_compte': account_number,
                'titulaire': account_holder,
                'operations': metadata.get('operations') 
            }
            missing_fields = []
            for field, value in fields_to_validate.items():
                # Vérifie si la valeur est vide, ou une de vos valeurs par défaut si l'extraction a échoué
                if not value or value == 'N/A' or value == 'Unknown Bank' or value == 'Unknown Holder':
                    missing_fields.append(field)
                elif field == 'operations' and (not isinstance(value, list) or len(value) == 0):
                    missing_fields.append(f"{field} (empty list or not a list)")

            if missing_fields:
                logger.error(f"POST validation failed: Missing or invalid fields: {', '.join(missing_fields)}. Received metadata: {metadata}")
                return JsonResponse({
                    'error': f'Required fields missing or invalid: {", ".join(missing_fields)}. Operations are essential for reconciliation.',
                    'missing_fields': missing_fields
                }, status=400)

            # Préparez les données pour l'objet MongoEngine Banque
            releve_data = {
                'fichier': fichier, # <<<<< MODIFICATION CLÉ : Passez l'objet UploadedFile directement ici
                'nom': bank_name,
                'numero_compte': account_number,
                'titulaire': account_holder,
                'metadata': metadata, # Stockez toutes les métadonnées brutes extraites (DictField)
                'date_import': datetime.datetime.now(), 
            }
            
            # Ajoutez les champs numériques et de date avec une conversion sécurisée
            numerical_fields = ['solde_initial', 'solde_final', 'total_credits', 'total_debits']
            date_fields = ['date_debut', 'date_fin']
            
            for field in numerical_fields:
                val = metadata.get(field)
                if val is not None:
                    try:
                        releve_data[field] = float(val)
                    except (ValueError, TypeError):
                        logger.warning(f"Float conversion failed for {field}: {val}. Stored as None.")
                        releve_data[field] = None 

            for field in date_fields:
                val = metadata.get(field)
                if val is not None and isinstance(val, str):
                    try:
                        releve_data[field] = datetime.datetime.strptime(val, "%Y-%m-%d") 
                    except ValueError:
                        logger.warning(f"Invalid date format for {field}: {val}. Stored as None.")
                        releve_data[field] = None 

            # Formatez les opérations et assignez-les au champ 'operations' du modèle
            releve_data['operations'] = self._format_operations(metadata.get('operations', []))

            # Ajoutez d'autres champs de modèle directs si présents dans les métadonnées
            if metadata.get('iban') is not None:
                releve_data['iban'] = metadata.get('iban')
            if metadata.get('bic') is not None:
                releve_data['bic'] = metadata.get('bic')
            if metadata.get('periode') is not None:
                releve_data['periode'] = metadata.get('periode')

            # --- LOG DE DÉBOGAGE AVANT LA SAUVEGARDE ---
            # Ceci vous montrera les données exactes qui vont être enregistrées dans le document principal
            logger.debug(f"DEBUG: releve_data prepared for Banque model: {releve_data.keys()}")
            logger.debug(f"DEBUG: releve_data['nom']: {releve_data.get('nom')}, releve_data['titulaire']: {releve_data.get('titulaire')}")

            # Créez et sauvegardez l'objet Banque
            releve = Banque(**releve_data)
            releve.save() # Le fichier PDF sera écrit dans GridFS ici, et les autres champs dans le document

            # Journalisation finale après sauvegarde
            logger.info(f"Statement successfully created with ID: {releve.id}. Bank: '{releve.nom}', Holder: '{releve.titulaire}'. {len(releve.operations)} operations saved.")
            
            # Préparez la réponse pour le frontend
            response_data = {
                'id': str(releve.id),
                'nom': releve.nom, 
                'numero_compte': releve.numero_compte,
                'titulaire': releve.titulaire,
                'date_import': releve.date_import.isoformat(),
                'nom_fichier': releve.fichier.filename if releve.fichier else None, 
                'operations': [op.to_mongo() for op in releve.operations] if releve.operations else [], 
                'downloadUrl': request.build_absolute_uri(f'/api/banques/{releve.id}/download/'),
                'banque': releve.nom 
            }
            
            return JsonResponse(response_data, status=201)
            
        except Exception as e:
            logger.error(f"POST error: {str(e)}", exc_info=True)
            return JsonResponse({
                'error': f'Error during creation: {str(e)}',
                'traceback': traceback.format_exc() if settings.DEBUG else None
            }, status=500)

    def delete(self, request, id):
        """Supprime un relevé bancaire."""
        user_payload = self._authenticate(request)
        if not user_payload:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            if not id:
                return JsonResponse({'error': 'ID required'}, status=400)
                
            releve = Banque.objects.get(id=ObjectId(id))
            releve_nom = releve.nom if releve.nom else str(releve.id)
            releve.delete() # Ceci supprimera le document et le fichier associé dans GridFS
            
            logger.info(f"Statement '{releve_nom}' (ID: {id}) deleted by {user_payload.get('email', 'unknown')}")
            return JsonResponse({'message': 'Bank statement successfully deleted'})
            
        except Banque.DoesNotExist:
            return JsonResponse({'error': 'Bank statement not found'}, status=404)
        except Exception as e:
            logger.error(f"DELETE error: {str(e)}", exc_info=True)
            return JsonResponse({'error': f'Error during deletion: {str(e)}'}, status=500)

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
from api.models import Notification


@api_view(['GET'])
@csrf_exempt
@permission_classes([AllowAny]) 
def mes_notifications(request):
    try:
        # Si vous voulez tester sans authentification, vous pouvez utiliser 
        # cette approche temporaire (SEULEMENT POUR DÉVELOPPEMENT)
        from api.models import CustomUser, Notification
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Remplacez par l'ID ou l'username d'un utilisateur de test
        test_user = CustomUser.objects.first()  
        
        if not test_user:
            logger.warning("Aucun utilisateur trouvé dans la base")
            return JsonResponse({
                "status": "success",
                "notifications": []
            })
        
        notifications = Notification.objects(destinataire=test_user).order_by('-date_creation')
        logger.info(f"Trouvé {len(notifications)} notifications pour l'utilisateur {test_user}")
        
        data = []
        for n in notifications:
            notification_data = {
                "id": str(n.id),
                "titre": n.titre,
                "message": n.message,
                "type_notification": n.type_notification,  # CORRECTION: Cohérence avec React
                "lue": n.lue,
                "date_creation": n.date_creation.strftime("%Y-%m-%d %H:%M:%S"),
            }
            data.append(notification_data)
            logger.debug(f"Notification ajoutée: {notification_data}")
        
        response_data = {
            "status": "success",
            "notifications": data
        }
        
        logger.info(f"Réponse API: {len(data)} notifications")
        
        # Format de réponse attendu par le composant React
        return JsonResponse(response_data, safe=False)
        
    except Exception as e:
        logger.error(f"Erreur récupération notifications: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JsonResponse({"status": "error", "error": "Erreur serveur"}, status=500)

@csrf_exempt  
@require_http_methods(["PUT"])
def mark_notification_read(request, notification_id):
    """
    Marque une notification comme lue
    PUT: /api/notifications/{notification_id}/read/
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
    
       
        test_user = CustomUser.objects.first()
        
        if not test_user:
            return JsonResponse({
                'status': 'error',
                'message': 'Utilisateur de test non trouvé'
            }, status=404)
        
        # Vérifier que la notification existe et appartient à l'utilisateur
        notification = Notification.objects(id=notification_id, destinataire=test_user).first()
        
        if not notification:
            logger.warning(f"Notification {notification_id} non trouvée pour l'utilisateur {test_user}")
            return JsonResponse({
                'status': 'error',
                'message': 'Notification non trouvée ou non autorisée'
            }, status=404)
        
        # Marquer comme lue
        notification.lue = True
        notification.save()
        
        logger.info(f"Notification {notification_id} marquée comme lue")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification marquée comme lue'
        })
    except Exception as e:
        logger.error(f"Erreur marquage notification: {str(e)}")
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
        import logging
        logger = logging.getLogger(__name__)
        
        # Version temporaire pour le développement
        from api.models import CustomUser, Notification
        test_user = CustomUser.objects.first()
        
        if not test_user:
            return JsonResponse({
                'status': 'error',
                'message': 'Utilisateur de test non trouvé'
            }, status=404)
            
        # Mettre à jour toutes les notifications non lues de l'utilisateur
        result = Notification.objects(destinataire=test_user, lue=False).update(set__lue=True)
        
        logger.info(f"{result} notifications marquées comme lues pour {test_user}")
        
        return JsonResponse({
            'status': 'success',
            'message': f'{result} notifications marquées comme lues'
        })
    except Exception as e:
        logger.error(f"Erreur marquage toutes notifications: {str(e)}")
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
        import logging
        logger = logging.getLogger(__name__)
        
        # Version temporaire pour le développement
        from api.models import CustomUser, Notification
        test_user = CustomUser.objects.first()
        
        if not test_user:
            return JsonResponse({
                'status': 'error',
                'message': 'Utilisateur de test non trouvé'
            }, status=404)
        
        # Vérifier que la notification existe et appartient à l'utilisateur
        notification = Notification.objects(id=notification_id, destinataire=test_user).first()
        
        if not notification:
            return JsonResponse({
                'status': 'error',
                'message': 'Notification non trouvée ou non autorisée'
            }, status=404)
        
        # Supprimer la notification
        notification.delete()
        
        logger.info(f"Notification {notification_id} supprimée")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Notification supprimée'
        })
    except Exception as e:
        logger.error(f"Erreur suppression notification: {str(e)}")
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
        import logging
        logger = logging.getLogger(__name__)
        
        # Version temporaire pour le développement
        from api.models import CustomUser, Notification
        test_user = CustomUser.objects.first()
        
        if not test_user:
            return JsonResponse({
                'status': 'error',
                'message': 'Utilisateur de test non trouvé'
            }, status=404)
        
        # Compter les notifications non lues
        count = Notification.objects(destinataire=test_user, lue=False).count()
        
        logger.info(f"{count} notifications non lues pour {test_user}")
        
        return JsonResponse({
            'status': 'success',
            'count': count
        })
    except Exception as e:
        logger.error(f"Erreur comptage notifications: {str(e)}")
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
@csrf_exempt  # Retirez si vous gérez le CSRF token côté frontend
def get_notifications(request):
    if request.method == 'GET':
        try:
            # Vérification de l'authentification
            user = request.user
            if not user.is_authenticated:
                return JsonResponse({
                    "status": "error",
                    "message": "Utilisateur non authentifié"
                }, status=401)
            
            # Récupération des notifications avec MongoEngine
            notifications = Notification.objects(
                destinataire=user
            ).order_by('-date_creation')
            
            notifications_data = []
            for notif in notifications:
                notifications_data.append({
                    'id': str(notif.id),  # MongoEngine ObjectId -> string
                    'titre': notif.titre,
                    'message': notif.message,
                    'type_notification': notif.type_notification,
                    'lue': notif.lue,
                    'date_creation': notif.date_creation.isoformat(),
                    # Ajout d'infos sur l'expéditeur si présent
                    'expediteur': {
                        'id': str(notif.expediteur.id) if notif.expediteur else None,
                        'username': notif.expediteur.username if notif.expediteur else None
                    } if notif.expediteur else None
                })
            
            return JsonResponse({
                "status": "success",
                "notifications": notifications_data,
                "count": len(notifications_data)
            })
            
        except Exception as e:
            print(f"Erreur lors de la récupération des notifications: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Erreur interne du serveur"
            }, status=500)
    
    return JsonResponse({
        "status": "error", 
        "message": "Méthode non autorisée"
    }, status=405)


# Version alternative avec pagination
@csrf_exempt
def get_notifications_paginated(request):
    if request.method == 'GET':
        try:
            user = request.user
            if not user.is_authenticated:
                return JsonResponse({
                    "status": "error",
                    "message": "Utilisateur non authentifié"
                }, status=401)
            
            # Paramètres de pagination
            page = int(request.GET.get('page', 1))
            limit = int(request.GET.get('limit', 20))
            offset = (page - 1) * limit
            
            # Filtres optionnels
            only_unread = request.GET.get('unread', 'false').lower() == 'true'
            notification_type = request.GET.get('type')
            
            # Construction de la requête
            query = Notification.objects(destinataire=user)
            
            if only_unread:
                query = query.filter(lue=False)
            
            if notification_type:
                query = query.filter(type_notification=notification_type)
            
            # Pagination
            total_count = query.count()
            notifications = query.order_by('-date_creation').skip(offset).limit(limit)
            
            notifications_data = []
            for notif in notifications:
                notifications_data.append({
                    'id': str(notif.id),
                    'titre': notif.titre,
                    'message': notif.message,
                    'type_notification': notif.type_notification,
                    'lue': notif.lue,
                    'date_creation': notif.date_creation.isoformat(),
                    'expediteur': {
                        'id': str(notif.expediteur.id) if notif.expediteur else None,
                        'username': notif.expediteur.username if notif.expediteur else None
                    } if notif.expediteur else None
                })
            
            return JsonResponse({
                "status": "success",
                "notifications": notifications_data,
                "pagination": {
                    "current_page": page,
                    "total_pages": (total_count + limit - 1) // limit,
                    "total_count": total_count,
                    "has_next": offset + limit < total_count,
                    "has_previous": page > 1
                }
            })
            
        except ValueError as e:
            return JsonResponse({
                "status": "error",
                "message": "Paramètres de pagination invalides"
            }, status=400)
        except Exception as e:
            print(f"Erreur lors de la récupération des notifications: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Erreur interne du serveur"
            }, status=500)
    
    return JsonResponse({
        "status": "error", 
        "message": "Méthode non autorisée"
    }, status=405)


# Fonction pour marquer une notification comme lue
@csrf_exempt
def mark_notification_read(request, notification_id):
    if request.method == 'POST':
        try:
            user = request.user
            if not user.is_authenticated:
                return JsonResponse({
                    "status": "error",
                    "message": "Utilisateur non authentifié"
                }, status=401)
            
            # Récupération et mise à jour de la notification
            notification = Notification.objects(
                id=notification_id,
                destinataire=user
            ).first()
            
            if not notification:
                return JsonResponse({
                    "status": "error",
                    "message": "Notification non trouvée"
                }, status=404)
            
            notification.lue = True
            notification.save()
            
            return JsonResponse({
                "status": "success",
                "message": "Notification marquée comme lue"
            })
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour de la notification: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Erreur interne du serveur"
            }, status=500)
    
    return JsonResponse({
        "status": "error", 
        "message": "Méthode non autorisée"
    }, status=405)


# Fonction pour marquer toutes les notifications comme lues
@csrf_exempt
def mark_all_notifications_read(request):
    if request.method == 'POST':
        try:
            user = request.user
            if not user.is_authenticated:
                return JsonResponse({
                    "status": "error",
                    "message": "Utilisateur non authentifié"
                }, status=401)
            
            # Mise à jour de toutes les notifications non lues
            updated_count = Notification.objects(
                destinataire=user,
                lue=False
            ).update(lue=True)
            
            return JsonResponse({
                "status": "success",
                "message": f"{updated_count} notifications marquées comme lues"
            })
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour des notifications: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Erreur interne du serveur"
            }, status=500)
    
    return JsonResponse({
        "status": "error", 
        "message": "Méthode non autorisée"
    }, status=405)   