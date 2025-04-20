from mongoengine import Document, ReferenceField,fields, CASCADE,NULLIFY
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import datetime, timedelta
import uuid

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
    
 # Champs pour réinitialisation mot de passe
    reset_token = fields.StringField(max_length=36, null=True)
    reset_token_expires = fields.DateTimeField(null=True)
     # Statuts
    is_active = fields.BooleanField(default=True)
    is_staff = fields.BooleanField(default=False)
    is_superuser = fields.BooleanField(default=False)
    last_login = fields.DateTimeField(null=True)
    date_joined = fields.DateTimeField(default=timezone.now)
    USERNAME_FIELD = 'email'  # pour l’authentification via email
    EMAIL_FIELD = 'email'  
    meta = {
        'collection': 'users',
        'indexes': [
            {'fields': ['email'], 'unique': True},
            {'fields': ['username'], 'unique': True},
            'role',
            'is_active'
        ],
        'ordering': ['-date_joined']
    }

    def __str__(self):
        return f"{self.email} ({self.role})"

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    @property
    def is_authenticated(self):
        return True
    @property
    def is_anonymous(self):
        return False

    def get_username(self):
        return self.username
    def generate_reset_token(self):
        self.reset_token = str(uuid.uuid4())
        self.reset_token_expires = datetime.now() + timedelta(hours=24)
        self.save()

    def clear_reset_token(self):
        self.reset_token = None
        self.reset_token_expires = None
        self.save()


class Comptable(Document):
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE)
    nom_complet = fields.StringField(required=True)
    telephone = fields.StringField(required=True)
    matricule = fields.StringField(required=True, unique=True)
    departement = fields.StringField(required=True)
    is_active = fields.BooleanField(default=True)

    meta = {
        'collection': 'comptable',
        'indexes': [
            'matricule',
            'user',
            'departement'
        ]
    }

    def __str__(self):
        return f"{self.nom_complet} ({self.matricule})"

class DirecteurFinancier(Document):
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE)
    departement = fields.StringField()
    comptables = fields.ListField(fields.ReferenceField(Comptable))

    meta = {
        'collection': 'directeurs_financiers',
        'indexes': ['user']
    }

class Rapport(Document):
    TYPE_CHOICES = [
        ('Financier', 'Financier'),
        ('Bilan', 'Bilan'),
        ('Trésorerie', 'Trésorerie'),
        ('Fiscal', 'Fiscal')
    ]
    
    STATUT_CHOICES = [
        ('En attente', 'En attente'),
        ('Validé', 'Validé'),
        ('Rejeté', 'Rejeté'),
        ('Brouillon', 'Brouillon')
    ]

    comptable = fields.ReferenceField(Comptable, reverse_delete_rule=NULLIFY) 
    directeur = fields.ReferenceField(DirecteurFinancier, null=True)
    nom = fields.StringField(required=True)
    type = fields.StringField(choices=TYPE_CHOICES)
    date = fields.DateTimeField(default=datetime.now)
    statut = fields.StringField(choices=STATUT_CHOICES, default='Brouillon')
    contenu = fields.StringField(required=True)
    created_at = fields.DateTimeField(default=datetime.now)
    updated_at = fields.DateTimeField()
    validated_at = fields.DateTimeField(null=True)

    meta = {
        'collection': 'rapports',
        'indexes': [
            'comptable',
            'directeur',
            'type',
            'statut',
            'date',
            {'fields': ['created_at'], 'expireAfterSeconds': 3600*24*365*2}  # TTL 2 ans
        ]
    }

    def clean(self):
        self.updated_at = datetime.now()
        if self.statut == 'Validé' and not self.validated_at:
            self.validated_at = datetime.now()

# models.py
from mongoengine import Document, fields

class AuditLog(Document):
    user_id = fields.ObjectIdField()
    action_type = fields.StringField(choices=('analysis', 'summary', 'chat', 'validation'))
    input_data = fields.DictField()
    output_result = fields.DictField()
    timestamp = fields.DateTimeField(default=datetime.now)
