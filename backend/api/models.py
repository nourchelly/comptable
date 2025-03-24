from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models

# Manager personnalisé
class UserApiManager(UserManager):
    def create_user(self, username, email, role, password=None, **extra_fields):
        if not email:
            raise ValueError("L'utilisateur doit avoir une adresse email")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(username=username, email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        # Le rôle admin est attribué par défaut au superutilisateur
        return self.create_user(username, email, role="admin", password=password, **extra_fields)

# Modèle utilisateur personnalisé
class CustomUser(AbstractUser):
    email = models.EmailField(max_length=255, unique=True)  # Email unique pour l'authentification

    ROLE_CHOICES = [
        ("admin", "Administrateur"),
        ("comptable", "Comptable"),
        ("directeur", "Directeur Financier"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="comptable")

    # Utilisation du manager personnalisé
    objects = UserApiManager()

    # Spécifier que l'email sera le champ d'authentification principal
    USERNAME_FIELD = "email"

    # Ajouter 'username' dans les champs requis, mais ne le laisser pas vide
    REQUIRED_FIELDS = ["username"]  # 'username' est requis mais sera optionnel pour l'authentification

    def __str__(self):
        return self.email  # La représentation de l'utilisateur sera son email
