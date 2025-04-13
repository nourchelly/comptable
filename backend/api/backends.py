from django.contrib.auth.backends import BaseBackend
from api.models import CustomUser  # Assure-toi que le chemin est correct
from mongoengine.errors import DoesNotExist
from django.contrib.auth.hashers import check_password

class MongoEngineBackend(BaseBackend):
    """
    Backend personnalisé pour l'authentification via MongoEngine.
    """
    def authenticate(self, request, username=None, password=None):
        """
        Vérifie les informations d'identification.
        """
        try:
            # Recherche l'utilisateur par nom d'utilisateur
            user = CustomUser.objects.get(username=username)
            # Vérifie le mot de passe
            if user.check_password(password):
                return user
        except DoesNotExist:
            return None

    def get_user(self, user_id):
        """
        Récupère un utilisateur par ID.
        """
        try:
            return CustomUser.objects.get(id=user_id)
        except DoesNotExist:
            return None
