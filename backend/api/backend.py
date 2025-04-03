from mongoengine import DoesNotExist
from django.contrib.auth.hashers import check_password
from .models import CustomUser

class MongoAuthBackend:
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Vérifie si l'utilisateur existe dans MongoDB
        user = CustomUser.objects(username=username).first()
        if user and user.check_password(password):
            return user
        return None

    def get_user(self, user_id):
        # Récupère un utilisateur via son ID MongoDB
        return CustomUser.objects(id=user_id).first()
