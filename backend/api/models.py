from mongoengine import Document, StringField, EmailField, BooleanField, DateTimeField, ReferenceField
from django.contrib.auth.hashers import make_password, check_password
from mongoengine import CASCADE
from django.utils import timezone
from datetime import datetime, timedelta
import uuid

class CustomUser(Document):
    username = StringField(max_length=150, unique=True)
    email = EmailField(unique=True, required=True)
    password = StringField(required=True)
    
    ROLE_CHOICES = [
        ("admin", "Administrateur"),
        ("comptable", "Comptable"),
        ("directeur", "Directeur Financier"),
    ]
    role = StringField(max_length=20, choices=ROLE_CHOICES, default="comptable")
    
    reset_token = StringField(max_length=36, null=True)
    reset_token_expires = DateTimeField(null=True)
    is_active = BooleanField(default=True)
    is_staff = BooleanField(default=False)
    is_superuser = BooleanField(default=False)
    last_login = DateTimeField(null=True)
    date_joined = DateTimeField(default=timezone.now)

    meta = {
        'collection': 'users',
        'indexes': [
            {'fields': ['email'], 'unique': True},
            {'fields': ['username'], 'unique': True},
            'role'
        ],
        'ordering': ['-date_joined']
    }

    def __str__(self):
        return f"{self.email} ({self.role})"

    # ---------------------
    # 🔐 Méthodes de gestion du mot de passe et token
    # ---------------------
    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    @property
    def is_authenticated(self):
        return True
    def generate_reset_token(self):
        self.reset_token = str(uuid.uuid4())
        self.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        self.save()

    def clear_reset_token(self):
        self.reset_token = None
        self.reset_token_expires = None
        self.save()

    @classmethod
    def create_user(cls, username, email, role, password=None, **extra_fields):
        user = cls(
            username=username,
            email=email,
            role=role,
            **extra_fields
        )
        user.set_password(password)
        user.save()
        return user

    @classmethod
    def create_superuser(cls, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return cls.create_user(username, email, 'admin', password, **extra_fields)

# ---------------------
# 📄 Modèle Comptable lié à l'utilisateur
# ---------------------
class Comptable(Document):
    user = ReferenceField(CustomUser, required=True, reverse_delete_rule=CASCADE)
    nom_complet = StringField(required=True)
    telephone = StringField(required=True)
    matricule = StringField(required=True)
    departement = StringField(required=True)
    is_active = BooleanField(default=True)
    meta = {'collection': 'comptable'}
def __str__(self):
    return f"{self.nom_complet} - {self.user.email}"

class DirecteurFinancier(Document):
    user = ReferenceField(CustomUser, required=True, unique=True)
    departement = StringField()

#Rapport comptable
# models.py


class Rapport(Document):
    comptable = ReferenceField(Comptable, required=True)  # Référence au comptable qui a créé le rapport
    nom = StringField(required=True)
    type = StringField(required=True, choices=["Financier", "Bilan", "Trésorerie","Fiscal"])
    date =  DateTimeField(default=datetime.utcnow)
    statut = StringField(required=True, choices=["Validé", "En attente", "Rejeté"])
    contenu = StringField(required=True)
    meta = {'collection': 'rapport',
        'ordering': ['-date_creation']}
def __str__(self):
        return f"Rapport: {self.nom} - {self.statut} - {self.date}"

