from django.contrib.auth.backends import BaseBackend
from .models import CustomUser

class MongoBackend(BaseBackend):
    def authenticate(self, request, **kwargs):
        email = kwargs.get('email')
        try:
            return CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return None