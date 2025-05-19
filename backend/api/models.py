from mongoengine import DictField,Document,StringField,DateTimeField, ReferenceField,fields, CASCADE,NULLIFY,EmailField, ListField
from django.contrib.auth.hashers import make_password, check_password
from mongoengine.errors import ValidationError, NotUniqueError,DoesNotExist
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
     
    activation_token = fields.StringField(null=True) 
    secondary_emails = ListField(EmailField())  # Pour stocker les emails secondaires
    USERNAME_FIELD = 'email'  # pour l’authentification via email
    EMAIL_FIELD = 'email'  
    def clean(self):
        """Normalisation avant sauvegarde"""
        self.email = self.email.lower().strip()
        self.role = self.role.lower().strip()
    meta = {
        'collection': 'users',
        'indexes': [
            {'fields': ['email'], 'unique': True},
            {'fields': ['username'], 'unique': True},
            'role',
            'is_active',
            {
                'fields': ['$username', '$email', '$role'],
                'default_language': 'french',
                'weights': {'username': 10, 'email': 5, 'role': 2},
                'name': 'text_search_index'
            }
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
        self.reset_token_expires = timezone.now() + timedelta(hours=24) # timezone.now() est "aware" en UTC
        self.save()
      
    def clear_reset_token(self):
        self.reset_token = None
        self.reset_token_expires = None
        self.save()

    def generate_activation_token(self):
     payload = {
        'user_id': str(self.id),
        'exp': datetime.datetime.now(timezone.utc) + timedelta(hours=24)
    }
     token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm='HS256'
    )
     self.activation_token = str(token)  # Conversion en string
     self.save()  # Sauvegarde sans spécifier update_fields
     return str(token)


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
class Banque(Document):
    numero = fields.StringField(required=False)  # Numéro de compte bancaire
    montant = fields.FloatField()  # Montant de la transaction
    date_transaction = fields.DateTimeField()  # Date de la transaction
    description = fields.StringField()  # Description de la transaction
    solde = fields.FloatField()  # Solde bancaire après la transaction
    fichier = fields.FileField()  # Fichier PDF du relevé bancaire
    metadata = fields.DictField()  # Métadonnées supplémentaires
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    
    meta = {
        'collection': 'banques',
        'indexes': [
            {
                'fields': ['numero'],
                'unique': False,
                'name': 'numero_index'
            },
            {
                'fields': ['date_transaction'],
                'name': 'date_transaction_index'
            }
        ],
        'strict': False  # Permet des champs supplémentaires
    }

    def clean(self):
        """Validation avant sauvegarde"""
        if self.montant and not isinstance(self.montant, (float, int)):
            raise ValidationError("Le montant doit être un nombre")

    @property
    def fichier_url(self):
        return f'/api/banques/{self.id}/download/'
       
class Rapport(Document):
    """Modèle pour stocker les rapports de réconciliation générés"""
    
    # Références aux documents liés
    facture = ReferenceField('Facture', required=True)
    banque = ReferenceField('Banque', reverse_delete_rule=NULLIFY)
    reconciliation = ReferenceField('Reconciliation', required=True)
    
    # Métadonnées du rapport
    titre = StringField(required=True)
    date_generation = DateTimeField(default=datetime.datetime.now)
    statut = StringField(choices=['complet', 'incomplet', 'anomalie', 'validé'], required=True)
    
    # Contenu du rapport
    resume_facture = DictField(required=True)
    resume_releve = DictField(required=True)
    resultat_verification = DictField(required=True)
    anomalies = ListField(StringField())
    recommendations = ListField(StringField())
    created_at = DateTimeField(default=datetime.datetime.now)
    analyse_texte = StringField()
    rapport_complet = DictField(required=True)
    
    meta = {
        'collection': 'rapport',  # Nom de collection au pluriel
        'indexes': [
            'facture', 
            'banque', 
            'reconciliation', 
            'date_generation',
            'statut'
        ],
        'ordering': ['-date_generation']  # Tri par défaut
    }
    
    def __str__(self):
        return f"Rapport {self.titre} - {self.date_generation.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        """Validation avant sauvegarde"""
        # Vérifie que la facture référencée existe
        if not Facture.objects(id=self.facture.id).first():
            raise ValidationError("La facture référencée n'existe pas")
            
        # Vérifie que la reconciliation référencée existe
        if not Reconciliation.objects(id=self.reconciliation.id).first():
            raise ValidationError("La réconciliation référencée n'existe pas")
            
        # Vérification optionnelle de la banque
        if self.banque and not Banque.objects(id=self.banque.id).first():
            raise ValidationError("La banque référencée n'existe pas")
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
    user = fields.ReferenceField(CustomUser , required=False, sparse=True)
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
        {'fields': ['date_debut', 'date_fin'], 'name': 'date_range_idx'},
        {'fields': ['user'], 'name': 'user_idx', 'sparse': True}
    ]
}
    def clean(self):
        """Validation personnalisée"""
        # Met à jour le champ derniere_modification à chaque sauvegarde
        self.derniere_modification = timezone.now()
        
        # Vérification de la cohérence des dates
        if self.date_debut and self.date_fin and self.date_debut > self.date_fin:
            raise ValidationError("La date de début ne peut pas être postérieure à la date de fin")
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
    date_creation = fields.DateTimeField(default=datetime.datetime.now)
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
        ('ajout', 'Ajouter'),
        ('modification', 'Modifier'),
        ('suppression', 'Supprimer'),
        ('consultation', 'Consulter'),
        ('connexion', 'Connexion'),
        ('deconnexion', 'Déconnexion'),
        ('creation', 'Création '),  
        ('creation_audit', 'Création Audit'),
        ('modification_audit', 'Modification Audit'),
        ('suppression_audit', 'Suppression Audit'),
        ('consultation_audit', 'Consultation Audit'),
        ('consultation_liste_audits', 'Consultation Liste Audits')       # Ajouté

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
        'collection': 'actions'
    }
    def get_type_action_display(self):
        return dict(self.TYPES_ACTION).get(self.type_action, self.type_action)



def facture_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('factures', filename)
class ImportedFile(Document):
    filename = fields.StringField(required=True)
    filepath = fields.StringField(required=True)
    upload_date = fields.DateTimeField(default=datetime.datetime.utcnow)
    file_type = fields.StringField(required=True, choices=['invoice', 'statement'])
    # Ajoutez d'autres champs pertinents comme l'ID de l'utilisateur qui a importé, etc.
class Facture(Document):
    user = ReferenceField('CustomUser', required=False, sparse=True)
    numero = fields.StringField(required=False)  # Changé à required=False
    montant_total = fields.FloatField()
    date_emission = fields.DateTimeField()
    emetteur = fields.StringField()
    destinataire = fields.StringField()
    ligne_details = ListField(fields.DictField())
    fichier = fields.FileField()
    metadata = fields.DictField()  # Nouveau champ pour les données brutes
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    rapport_id = fields.StringField()
    
    meta = {
        'collection': 'factures',
        'indexes': [
            {'fields': ['numero'], 'unique': True, 'sparse': True, 'name': 'numero_unique_sparse'},  # sparse=True permet plusieurs null
            {'fields': ['user'], 'name': 'user_idx', 'sparse': True}
        ]
    }

    @property
    def fichier_url(self):
        return f'/api/factures/{self.id}/download/'

    @property
    def filename(self):
        if self.fichier and hasattr(self.fichier, 'name'):
            return os.path.basename(str(self.fichier.name))
        return None


    
# models.py
class Notification(Document):
    destinataire = ReferenceField('CustomUser', required=True)
    expediteur = ReferenceField('CustomUser')
    titre = fields.StringField(required=True, max_length=200)
    message = fields.StringField(required=True)
    type_notification = fields.StringField(
        choices=('signalement', 'avertissement', 'info', 'autre'),
        default='info'
    )
    lue = fields.BooleanField(default=False)
    date_creation = fields.DateTimeField(default=datetime.datetime.utcnow)

    meta = {
        'collection': 'notifications',
        'ordering': ['-date_creation'],
        'indexes': [
            {'fields': ['destinataire']},
            {'fields': ['lue']},
            {'fields': ['date_creation']}
        ]
    }

class Reconciliation(Document):
    facture=fields.ReferenceField(Facture)
    banque=fields.ReferenceField(Banque)
    invoice_data = fields.DictField(required=True)
    statement_data = fields.DictField(required=True)
    verification_result = fields.DictField(required=True)
    analysis = fields.StringField()
    statut = StringField(choices=['complet', 'anomalie', 'incomplet'], default='incomplet')
    report = fields.DictField(required=True)
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    
    meta = {
        'collection': 'reconciliations',
        'indexes': [
            'invoice_data.numero',
            'statement_data.banque',
            'created_at'
        ]
    }