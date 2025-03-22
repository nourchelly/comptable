from django.contrib.auth.models import AbstractUser, PermissionsMixin, UserManager
from django.db import models

# Manager personnalisé
class UserApiManager(UserManager):
    def create_user(self, username, email, role, password=None):
        if not email:
            raise ValueError('L\'utilisateur doit avoir une adresse email')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, role=role)
        user.set_password(password)
        user.save()
        return user

# Modèle utilisateur personnalisé
class CustomUser(AbstractUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    
    
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('comptable', 'Comptable'),
        ('directeur', 'Directeur Financier'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='comptable')
    
    # Utilisation du manager personnalisé
    objects = UserApiManager()

    # Spécifier que l'email sera le champ d'authentification principal
    USERNAME_FIELD = 'email'
    
    # Ajouter 'username' dans les champs requis, mais ne le laissez pas vide
    REQUIRED_FIELDS = ['username']  

    def get_full_name(self):
        return self.username

    def get_short_name(self):
        return self.username

    def __str__(self):
        return self.email
