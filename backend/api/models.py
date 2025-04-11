from mongoengine import Document, fields ,StringField, DateTimeField
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import secrets
import uuid
import pytz
from datetime import datetime, timedelta
from django.db import models
  # Remplace les fonctions Django make_password/check_password

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
    
    reset_token = StringField(max_length=36, null=True)  # Ajuster max_length à 32
    reset_token_expires = DateTimeField(null=True)
    is_active = fields.BooleanField(default=True)
    is_staff = fields.BooleanField(default=False)
    is_superuser = fields.BooleanField(default=False)
    last_login = fields.DateTimeField(null=True)
    date_joined = fields.DateTimeField(default=timezone.now)

    def set_password(self, raw_password):
         self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def generate_reset_token(self):
        self.reset_token = str(uuid.uuid4())
        self.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=24) #Ajouter le timezone
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
# Dans models.py - Modifiez la méthode save()

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