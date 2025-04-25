from mongoengine import Document, ReferenceField,fields, CASCADE,NULLIFY,EmailField, ListField
from django.contrib.auth.hashers import make_password, check_password
from mongoengine.errors import ValidationError, NotUniqueError
from django.utils import timezone
from datetime import datetime, timedelta
import datetime 
import uuid
import jwt
from django.conf import settings 
import os # Ajoutez cet import en haut du fichier

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
    secondary_emails = ListField(EmailField())  # Pour stocker les emails secondaires
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

    def generate_activation_token(self):
        """Génère un token JWT valide 24h"""
        self.activation_token = jwt.encode(
            {
                'user_id': str(self.id),
                'exp': datetime.utcnow() + timedelta(days=1)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
        self.save()
        return self.activation_token



class Admin(Document):
    """
    Modèle représentant un administrateur dans le système.
    Hérite de Document MongoEngine pour le stockage dans MongoDB.
    """
    
    # Référence à l'utilisateur CustomUser (suppression en cascade)
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE, unique=True)
    
    # Téléphone avec validation de format (+33... ou 0...)
    telephone = fields.StringField(
        required=True, 
        regex=r'^\+?[0-9]{8,15}$',
        verbose_name="Numéro de téléphone"
    )
    
    # Nom complet avec contraintes de longueur
    nom_complet = fields.StringField(
        required=True,
        min_length=3,
        max_length=100,
        verbose_name="Nom complet"
    )
    
    # Dernière connexion (peut être vide)
    last_login = fields.DateTimeField(
        null=True,
        verbose_name="Dernière connexion"
    )
    
    # Date de création (remplie automatiquement)
    date_creation = fields.DateTimeField(
        default=datetime.datetime.utcnow,
        verbose_name="Date de création"
    )
    
    # Statut actif/inactif
    is_active = fields.BooleanField(
        default=True,
        verbose_name="Compte actif"
    )
    
    class Meta:
        """Configuration MongoDB pour la collection Admin"""
        collection = 'admin'
        indexes = [
            'user',  # Index simple
            {'fields': ['nom_complet'], 'name': 'nom_complet_index'},
            {'fields': ['telephone'], 'name': 'telephone_index', 'unique': True},
        ]
        ordering = ['-date_creation']  # Tri par défaut

    def __str__(self):
        """Représentation textuelle de l'administrateur"""
        return f"{self.nom_complet} ({self.telephone})"

    def save(self, *args, **kwargs):
        """Sauvegarde avec pré-remplissage de la date de création si vide"""
        if not self.date_creation:
            self.date_creation = datetime.datetime.utcnow()
        super(Admin, self).save(*args, **kwargs)

    @classmethod
    def creer_admin(cls, user, telephone, nom_complet, **kwargs):
        """
        Méthode utilitaire pour créer un nouvel admin
        Args:
            user: Référence à l'utilisateur CustomUser
            telephone: Numéro de téléphone
            nom_complet: Nom complet
            **kwargs: Autres champs optionnels
        """
        return cls.objects.create(
            user=user,
            telephone=telephone,
            nom_complet=nom_complet,
            **kwargs
        )

    def mettre_a_jour_connexion(self):
        """Met à jour le timestamp de dernière connexion"""
        self.last_login = datetime.datetime.utcnow()
        self.save()

    def activer(self):
        """Active le compte administrateur"""
        self.is_active = True
        self.save()

    def desactiver(self):
        """Désactive le compte administrateur"""
        self.is_active = False
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
    # Référence à l'utilisateur (relation OneToOne)
    user = fields.ReferenceField(
        CustomUser, 
        reverse_delete_rule=CASCADE,
        unique=True,
        required=True,
        verbose_name="Utilisateur associé"
    )
    
    # Téléphone avec validation de format
    telephone = fields.StringField(
        required=True
    )
    
    # Département avec choix prédéfinis
    DEPARTEMENT_CHOICES = (
        ('Finance', 'Direction Financière'),
        ('Comptabilité', 'Comptabilité'),
        ('RH', 'Ressources Humaines'),
        ('Direction', 'Direction Générale'),
        ('IT', 'Informatique')
    )
    departement = fields.StringField(
        required=True,
        choices=DEPARTEMENT_CHOICES,
        verbose_name="Département"
    )
    
    # Spécialité avec validation
    specialite = fields.StringField(
        required=True
    )
    
    # Statut actif/inactif
    is_active = fields.BooleanField(
        default=True,
        verbose_name="Compte actif"
    )
    
    # Métadonnées automatiques
    date_creation = fields.DateTimeField(
        default=datetime.datetime.utcnow,
        verbose_name="Date de création"
    )
    date_modification = fields.DateTimeField(
        default=datetime.datetime.utcnow,
        verbose_name="Dernière modification"
    )

    meta = {
        'collection': 'directeurs_financiers',
        'indexes': [
            'user',
            {'fields': ['telephone'], 'unique': True},
            {'fields': ['departement'], 'name': 'departement_index'},
            {'fields': ['-date_creation'], 'name': 'date_creation_desc'}
        ],
        'ordering': ['-date_creation'],
        'verbose_name': "Directeur Financier",
        'verbose_name_plural': "Directeurs Financiers"
    }

    def __str__(self):
        return f"{self.user.username} ({self.departement})"

   

    def save(self, *args, **kwargs):
        """Override de la sauvegarde avec mise à jour de la date"""
        self.date_modification = datetime.datetime.utcnow()
        self.clean()  # Exécute les validations
        
        try:
            return super(DirecteurFinancier, self).save(*args, **kwargs)
        except NotUniqueError as e:
            if 'telephone' in str(e):
                raise ValidationError("Ce numéro de téléphone est déjà utilisé")
            raise

    # Méthodes métier
    def desactiver_compte(self):
        """Désactive le compte du directeur"""
        self.update(set__is_active=False)
        return self.reload()

    def activer_compte(self):
        """Active le compte du directeur"""
        self.update(set__is_active=True)
        return self.reload()

    @property
    def email(self):
        """Proxy vers l'email de l'utilisateur"""
        return self.user.email

    @classmethod
    def creer_directeur(cls, user, telephone, departement, specialite, **kwargs):
        """Méthode factory pour créer un directeur"""
        directeur = cls(
            user=user,
            telephone=telephone,
            departement=departement,
            specialite=specialite,
            **kwargs
        )
        directeur.save()
        return directeur
    
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
    date = fields.DateTimeField(default=datetime.datetime.now)
    statut = fields.StringField(choices=STATUT_CHOICES, default='Brouillon')
    contenu = fields.StringField(required=True)
    created_at = fields.DateTimeField(default=datetime.datetime.now)
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
        self.updated_at = datetime.datetime.now()
        if self.statut == 'Validé' and not self.validated_at:
            self.validated_at = datetime.datetime.now()

# models.py
from mongoengine import Document, fields


class AuditFinancier(Document):
    TYPE_CHOICES = [
        ('Financier', 'Financier'),
        ('Ressources Humaines', 'Ressources Humaines'),
        ('Processus', 'Processus'),
        ('Conformité', 'Conformité')
    ]
    
    STATUT_CHOICES = [
        ('Planifié', 'Planifié'),
        ('En cours', 'En cours'),
        ('Terminé', 'Terminé'),
        ('Annulé', 'Annulé')
    ]
     
    PRIORITE_CHOICES = [
        ('Haute', 'Haute'),
        ('Moyenne', 'Moyenne'),
        ('Basse', 'Basse')
    ]
    
    nom = fields.StringField(required=True, max_length=100)
    type = fields.StringField(choices=TYPE_CHOICES, required=True)
    responsable = fields.StringField(required=True, max_length=100)
    date_debut = fields.DateTimeField(required=True)
    date_fin = fields.DateTimeField(required=True)
    statut = fields.StringField(choices=STATUT_CHOICES, default='Planifié')
    priorite = fields.StringField(choices=PRIORITE_CHOICES, default='Moyenne')
    description = fields.StringField()
    observations = fields.ListField(fields.StringField())

    meta = {
        'collection': 'audit_financiers',
        'indexes': [
            'nom',
            'type',
            'statut',
            'priorite',
            {'fields': ['date_debut', 'date_fin'], 'name': 'date_range_idx'}
        ]
    }

    def __str__(self):
        return f"{self.nom} ({self.type}) - {self.statut}"
    
class Compte(Document):
    STATUT_CHOICES = [
        ('Actif', 'Actif'),
        ('En cours', 'En cours'),
        ('Inactif', 'Inactif')
    ]
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE)
    comptable = fields.ReferenceField(Comptable, reverse_delete_rule=CASCADE)
    directeur = fields.ReferenceField(DirecteurFinancier, reverse_delete_rule=CASCADE)
    statut = fields.StringField(choices=STATUT_CHOICES, default='Actif')
    
    # Champs supplémentaires pour le signalement
    motif_signalement = fields.StringField(max_length=200, null=True, blank=True)
    description_signalement = fields.StringField(max_length=1000, null=True, blank=True)
    date_signalement = fields.DateTimeField(null=True, blank=True)
    fichier_signalement = fields.FileField(upload_to='signalements/', null=True, blank=True)
    
    meta = {
        'collection': 'compte',
        'indexes': [
            'statut',
        ]
    }
    
    def __str__(self):
        return f"{self.statut}"
 
class ActionLog(Document):
    TYPES_ACTION = [
        ('ajout_audit', 'Ajout Audit'),
        ('modification_audit', 'Modification Audit'),
        ('suppression_audit', 'Suppression Audit'),
        ('consultation_audit', 'Consultation Audit'),
        ('connexion', 'Connexion'),
        ('deconnexion', 'Déconnexion')
    ]
    STATUT_CHOICES = ("Terminé", "Échoué")

    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE)
    audit = fields.ReferenceField(AuditFinancier, reverse_delete_rule=CASCADE, required=False)
    type_action = fields.StringField(choices=TYPES_ACTION, required=True)
    description = fields.StringField(required=True)
    details = fields.StringField()  # Pour stocker des détails supplémentaires (comme les changements effectués)
    date_action = fields.DateTimeField(default=datetime.datetime.now)
    statut = fields.StringField(choices=STATUT_CHOICES, default='Terminé')

    
    meta = {
        'ordering': ['-date_action'],  # Sort by newest first
        'collection': 'action_logs'
    }
    def get_type_action_display(self):
        return dict(self.TYPES_ACTION).get(self.type_action, self.type_action)

def facture_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('factures', filename)

class Facture(Document):
    numero = fields.StringField(required=True, unique=True)
    client = fields.ReferenceField('Client', required=True)
    date_emission = fields.DateTimeField(required=True)
    date_echeance = fields.DateTimeField()
    montant = fields.DecimalField(required=True, precision=2)
    statut = fields.StringField(choices=('impayée', 'payée', 'annulée'), default='impayée')
    fichier = fields.FileField(upload_to=facture_upload_path)
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    created_by = fields.ReferenceField('User')
    
    meta = {
        'collection': 'factures',
        'ordering': ['-date_emission'],
        'indexes': [
            'numero',
            'client',
            'statut',
            'date_emission'
        ]
    }

    def __str__(self):
        return f"Facture {self.numero} - {self.client.nom}"
class Client(Document):
    nom = fields.StringField(required=True)
    email = fields.EmailField(required=True)
    adresse = fields.StringField()
    
    meta = {
        'collection': 'clients',
        'indexes': ['nom', 'email']
    }