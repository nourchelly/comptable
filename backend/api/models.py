from mongoengine import Document, fields
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import secrets

import bcrypt  # Remplace les fonctions Django make_password/check_password

class CustomUser(Document):
    username = fields.StringField(max_length=150, unique=True)
    email = fields.EmailField(unique=True, required=True)
    password = fields.StringField(required=True)
    
    ROLE_CHOICES = [
        ("admin", "Administrateur"),
        ("comptable", "Comptable"),
        ("directeur", "Directeur Financier"),
    ]
    role = fields.StringField(max_length=20, choices=ROLE_CHOICES, default="comptable")
    
    reset_token = fields.StringField(max_length=100, null=True)
    reset_token_expires = fields.DateTimeField(null=True)
    
    is_active = fields.BooleanField(default=True)
    is_staff = fields.BooleanField(default=False)
    is_superuser = fields.BooleanField(default=False)
    last_login = fields.DateTimeField(null=True)
    date_joined = fields.DateTimeField(default=timezone.now)

    def set_password(self, raw_password):
        # Utilisation de bcrypt pour le hachage
        self.password = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.save()

    def check_password(self, raw_password):
    # Version temporaire pour développement

      return self.password == raw_password
    def generate_reset_token(self):
        self.reset_token = secrets.token_urlsafe(48)
        self.reset_token_expires = timezone.now() + timezone.timedelta(hours=1)
        self.save()
        return self.reset_token

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