# Dans un fichier auth_middleware.py dans votre application Django
import jwt
from django.conf import settings
from django.http import JsonResponse
from .models import CustomUser
from functools import wraps
import logging

logger = logging.getLogger(__name__)

def jwt_auth_required(allowed_roles=None):
    """
    Décorateur pour vérifier l'authentification JWT et le rôle d'utilisateur
    
    :param allowed_roles: Liste des rôles autorisés à accéder à cette vue
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Vérifier le token dans l'en-tête Authorization
            auth_header = request.headers.get('Authorization', '')
            
            if not auth_header.startswith('Bearer '):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Token d\'authentification manquant ou invalide'
                }, status=401)
            
            token = auth_header.split(' ')[1]
            
            try:
                # Décoder et vérifier le token
                payload = jwt.decode(
                    token,
                    settings.JWT_SECRET_KEY,
                    algorithms=['HS256']
                )
                
                user_id = payload.get('user_id')
                role = payload.get('role')
                
                # Vérifier si le rôle de l'utilisateur est autorisé
                if allowed_roles and role not in allowed_roles:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Accès non autorisé pour ce rôle'
                    }, status=403)
                
                # Récupérer l'utilisateur et le passer à la vue
                try:
                    user = CustomUser.objects.get(id=user_id)
                    request.user = user
                except CustomUser.DoesNotExist:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Utilisateur non trouvé'
                    }, status=404)
                
                # Exécuter la vue
                return view_func(request, *args, **kwargs)
                
            except jwt.ExpiredSignatureError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Token expiré'
                }, status=401)
                
            except jwt.InvalidTokenError:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Token invalide'
                }, status=401)
                
            except Exception as e:
                logger.error(f"Erreur d'authentification: {str(e)}")
                return JsonResponse({
                    'status': 'error',
                    'message': 'Erreur interne du serveur'
                }, status=500)
                
        return wrapped_view
    return decorator


# Exemple d'utilisation du décorateur:
"""
@jwt_auth_required(allowed_roles=['admin', 'comptable'])
def protected_view(request):
    # Accéder à l'utilisateur authentifié
    user = request.user
    
    # Votre code ici
    return JsonResponse({
        'status': 'success',
        'message': f'Bonjour {user.username}'
    })
"""