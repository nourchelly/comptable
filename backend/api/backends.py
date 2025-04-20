from django.contrib.auth.backends import BaseBackend
from mongoengine import DoesNotExist
from .models import CustomUser
from django.contrib.auth.hashers import check_password

class MongoEngineBackend(BaseBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = CustomUser.objects.get(email=email)
            if user.check_password(password):  # Utilisez la méthode check_password de votre modèle
                return user
            return None
        except DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(id=user_id)
        except (DoesNotExist, CustomUser.DoesNotExist):
            return None