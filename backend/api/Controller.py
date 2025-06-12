import jwt
import datetime
from django.conf import settings
from api.models import CustomUser, ActionLog
from api.exceptions import InvalidCredentialsError


class UserController:

    @staticmethod
    def login_user(email, password):
        # Recherche sécurisée de l'utilisateur
        user = CustomUser.objects(email=email).first()

        # Si aucun utilisateur trouvé, renvoyer une erreur générique sans détails
        if not user:
            raise InvalidCredentialsError("Identifiants incorrects")

        # Vérification du mot de passe
        if not user.check_password(password):
            UserController._log_failed_attempt(user, "Mot de passe incorrect")
            raise InvalidCredentialsError("Identifiants incorrects")

        # Génération des tokens JWT
        tokens = UserController._generate_tokens(user)

        # Journaliser la connexion réussie
        UserController._log_successful_login(user)

        return {
            'status': 'success',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'username': user.username,
                'role': user.role
            },
            'access_token': tokens['access_token'],
            'token_type': 'Bearer',
            'expires_in': 1800,  # secondes (30 minutes)
            'refresh_token': tokens['refresh_token']
        }

    @staticmethod
    def _generate_tokens(user):
        # Création du token d'accès
        access_token = jwt.encode(
            {
                'user_id': str(user.id),
                'email': user.email,
                'role': user.role,
                'is_superuser': user.is_superuser, 
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
            },
            settings.JWT_SECRET_KEY,
            algorithm='HS256'
        )

        # Création du token de rafraîchissement
        refresh_token = jwt.encode(
            {
                'user_id': str(user.id),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
                'type': 'refresh'
            },
            settings.JWT_REFRESH_SECRET_KEY,
            algorithm='HS256'
        )

        return {'access_token': access_token, 'refresh_token': refresh_token}

    @staticmethod
    def _log_successful_login(user):
        # Journalise uniquement pour les rôles sensibles
        if user.role in ['comptable', 'directeur']:
            ActionLog.objects.create(
                user=user,
                type_action='connexion',
                description=f"Connexion réussie pour {user.email}",
                details=f"Rôle: {user.role}",
                statut="Terminé"
            )

    @staticmethod
    def _log_failed_attempt(user, reason):
        # Journalise uniquement pour les utilisateurs valides avec rôle sensible
        if user.role in ['comptable', 'directeur']:
            ActionLog.objects.create(
                user=user,
                type_action='connexion',
                description=f"Tentative de connexion échouée pour {user.email}",
                details=reason,
                statut="Échoué"
            )
