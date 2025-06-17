from mongoengine import FileField, FloatField,DictField,Document,StringField,DateTimeField, ReferenceField,fields, CASCADE,NULLIFY,EmailField, ListField, EmbeddedDocument, EmbeddedDocumentField
from django.contrib.auth.hashers import make_password, check_password
from mongoengine.errors import ValidationError, NotUniqueError
from django.utils import timezone
from datetime import datetime, timedelta
import datetime 
import uuid
import jwt
from django.conf import settings 
import os 
from mongoengine import Document, fields, ListField, EmailField
import datetime
from django.utils import timezone  

class CustomUser(Document):
    username = fields.StringField(max_length=150, unique=True)
    email = fields.EmailField(unique=True, required=True)
    password = fields.StringField(required=True)

    # Ces champs ne sont plus requis pour permettre la création progressive du profil
    nom_complet = fields.StringField(required=False, min_length=3, max_length=100, null=True)
    telephone = fields.StringField(
        required=False,
        regex=r'^\+?[0-9]{8,15}$',
        verbose_name="Numéro de téléphone",
        null=True
    )

    date_naissance = fields.DateField(required=False)
    sexe = fields.StringField(
        choices=[('Homme', 'Homme'), ('Femme', 'Femme'), ('Autre', 'Autre')],
        required=False
    )

    ROLE_CHOICES = [
        ("admin", "Administrateur"),
        ("comptable", "Comptable"),
        ("directeur", "Directeur Financier")
    ]

    role = fields.StringField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="comptable"
    )
    matricule = fields.StringField( unique=False)
    is_active = fields.BooleanField(default=True)
    is_staff = fields.BooleanField(default=False)
    is_superuser = fields.BooleanField(default=False)
    approval_status = fields.StringField(
        choices=['pending', 'approved', 'rejected'],
        default='pending'
    )
    approved_by = fields.ObjectIdField()
    approved_at = fields.DateTimeField()
    rejection_reason = fields.StringField()
    date_joined = fields.DateTimeField(default=datetime.datetime.utcnow)

    date_joined = fields.DateTimeField(default=timezone.now)
    last_login = fields.DateTimeField(null=True)
    date_modification = fields.DateTimeField(default=datetime.datetime.utcnow)

    reset_token = fields.StringField(max_length=36, null=True)
    reset_token_expires = fields.DateTimeField(null=True)
    activation_token = fields.StringField(null=True)

    secondary_emails = ListField(EmailField())

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'

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

    def clean(self):
        """Validation personnalisée"""
        super().clean()
        
        # Validation du téléphone si fourni
        if self.telephone:
            import re
            if not re.match(r'^\+?[0-9]{8,15}$', self.telephone):
                raise ValidationError("Format de téléphone invalide")
        
        # Validation du nom complet si fourni
        if self.nom_complet:
            if len(self.nom_complet.strip()) < 3:
                raise ValidationError("Le nom complet doit contenir au moins 3 caractères")

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
        self.reset_token_expires = timezone.now() + timedelta(hours=24)
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
        self.activation_token = str(token)
        self.save()
        return str(token)
    
    def save(self, *args, **kwargs):
        """Override de la sauvegarde avec mise à jour de la date"""
        self.date_modification = datetime.datetime.utcnow()
        self.clean()  # Exécute les validations
        
        try:
            return super(CustomUser, self).save(*args, **kwargs)  # Fix: utiliser CustomUser au lieu de DirecteurFinancier
        except NotUniqueError as e:
            if 'telephone' in str(e):
                raise ValidationError("Ce numéro de téléphone est déjà utilisé")
            if 'email' in str(e):
                raise ValidationError("Cet email est déjà utilisé")
            if 'username' in str(e):
                raise ValidationError("Ce nom d'utilisateur est déjà utilisé")
            raise

    def has_complete_profile(self):
        """Vérifie si le profil est complet"""
        return bool(self.nom_complet and self.telephone)


class Admin(Document):
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE, unique=True)
    is_active = fields.BooleanField(default=True, verbose_name="Compte actif")
    
    NIVEAU_CHOICES = (
        ('superadmin', 'Super Administrateur'),
        ('moderateur', 'Modérateur'),
    )
    niveau_admin = fields.StringField(
        required=True,
        choices=NIVEAU_CHOICES,
        default='moderateur',
        verbose_name="Niveau d'administration"
    )

    meta = {
        'collection': 'admin',
        'indexes': ['user', 'niveau_admin']
    }

    def __str__(self):
        nom = self.user.nom_complet if self.user.nom_complet else self.user.username
        return f"{nom} ({self.niveau_admin})"

    def activer(self):
        self.is_active = True
        self.save()

    def desactiver(self):
        self.is_active = False
        self.save()

    def clean(self):
        """Validation personnalisée"""
        super().clean()
        
        # Vérifier que l'utilisateur a le bon rôle
        if self.user and self.user.role != 'admin':
            raise ValidationError("L'utilisateur doit avoir le rôle 'admin'")

    def save(self, *args, **kwargs):
        self.clean()
        return super(Admin, self).save(*args, **kwargs)

class Comptable(Document):
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE, unique=True)
    

    departement = fields.StringField(required=True, choices=[
        ('Générale', 'Comptabilité Générale'),
        ('Comptabilité F', 'Comptabilité Fournisseurs'),
        ('CR', 'Comptabilité Client'),
        ('Agent', 'Paie'),
        ('F', 'Fiscalité')
    ])

    # 🆕 Niveau de formation
    NIVEAU_CHOICES = [
        ('débutant', 'Débutant'),
        ('confirmé', 'Confirmé'),
        ('expert', 'Expert')
    ]
    niveau_formation = fields.StringField(
        choices=NIVEAU_CHOICES,
        required=True,
        default='débutant',
        verbose_name='Niveau de formation'
    )
    meta = {
    'collection': 'comptable',
    'ordering': ['user']
}

    def __str__(self):
        return f"{self.user.nom_complet}  - {self.niveau_formation.capitalize()}"
class DirecteurFinancier(Document):
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE, unique=True)
    departement = fields.StringField(required=True, choices=[
        ('Finance', 'Direction Financière'),
        ('Comptabilité', 'Comptabilité'),
        ('RH', 'Ressources Humaines'),
        ('Direction', 'Direction Générale'),
        ('IT', 'Informatique')
    ])
    specialite = fields.StringField(required=True)

    def __str__(self):
        return f"{self.user.nom_complet} ({self.departement})"

    # Méthodes métier
    def desactiver_compte(self):
        """Désactive le compte du directeur"""
        self.update(set__is_active=False)
        return self.reload()

    def activer_compte(self):
        """Active le compte du directeur"""
        self.update(set__is_active=True)
        return self.reload()



       

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
    user = fields.ReferenceField(CustomUser, required=False, sparse=True)
    type = fields.StringField(choices=TYPE_CHOICES, required=True)
    responsable = fields.StringField(required=True, max_length=100)
    date_debut = fields.DateTimeField(required=True)
    date_fin = fields.DateTimeField(required=True)  # Note: J'ai corrigé le nom du champ (date_fin au lieu de date_fin)
    statut = fields.StringField(choices=STATUT_CHOICES, default='Planifié')
    priorite = fields.StringField(choices=PRIORITE_CHOICES, default='Moyenne')
    description = fields.StringField(default='')  # Assure une valeur par défaut
    observations = fields.ListField(fields.StringField(), default=list)
    derniere_modification = fields.DateTimeField()

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
        self.derniere_modification = timezone.now()
        
        if self.date_debut and self.date_fin and self.date_debut > self.date_fin:
            raise ValidationError("La date de début ne peut pas être postérieure à la date de fin")

    def __str__(self):
        return f"{self.nom} ({self.type}) - {self.statut}"
    
class Compte(Document):
   
    user = fields.ReferenceField(CustomUser, reverse_delete_rule=CASCADE)
    comptable = fields.ReferenceField(Comptable, reverse_delete_rule=CASCADE)
    directeur = fields.ReferenceField(DirecteurFinancier, reverse_delete_rule=CASCADE)
    statut = fields.StringField(default="En attente d'approbation")
    date_creation = fields.DateTimeField(default=datetime.datetime.now)
    
    
    
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
        ('ajout', 'Ajouter (Générique)'), # Vous pouvez garder les génériques si vous voulez
        ('modification', 'Modifier (Générique)'),
        ('suppression', 'Supprimer (Générique)'),
        ('consultation', 'Consulter (Générique)'),
        ('connexion', 'Connexion'),
        ('déconnexion', 'Déconnexion'),
        ('creation', 'Création (Générique)'),

        # Spécifiques aux Factures
        ('ajout_facture', 'Ajout Facture'),
        ('modification_facture', 'Modification Facture'),
        ('suppression_facture', 'Suppression Facture'),
        ('consultation_facture', 'Consultation Facture'),
        ('consultation_liste_factures', 'Consultation Liste Factures'), # Pour la liste des factures

        # Spécifiques aux Audits (déjà inclus)
        ('creation_audit', 'Création Audit'),
        ('modification_audit', 'Modification Audit'),
        ('suppression_audit', 'Suppression Audit'),
        ('consultation_audit', 'Consultation Audit'),
        ('consultation_liste_audits', 'Consultation Liste Audits'),
    ]       # Ajouté

    
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
class LigneFacture(EmbeddedDocument):
    description = StringField(required=True)
    quantite = FloatField(min_value=0)
    remise = fields.FloatField(default=0)
    prix_unitaire = FloatField(min_value=0)
    montant = FloatField(min_value=0)
    tva = FloatField(min_value=0, max_value=100)  # En pourcentage
    reference = StringField()
    code_produit = StringField()
    unite = StringField()

class OperationBancaire(EmbeddedDocument):
    date = fields.DateTimeField(required=True)
    libelle = fields.StringField(required=True)
    debit = fields.FloatField(default=0.0)
    credit = fields.FloatField(default=0.0)
    solde = fields.FloatField()
    montant = fields.FloatField(default=0.0)
    ref_facture = fields.StringField(required=False) # Rendre optional si ce n'est pas toujours présent

    # Ajoutez ces champs manquants
    reference = fields.StringField(required=False)
    numero_piece = fields.StringField(required=False)
    type_operation = fields.StringField(required=False)

    # Généralement une bonne pratique pour les EmbeddedDocument

# Votre modèle Banque semble correcte concernant le champ 'operations', mais
# faites attention à la duplication du champ 'montant' dans le modèle Banque.
# Si 'montant' dans Banque est censé être un total ou autre, donnez-lui un nom distinct.
# Si c'est le même montant que celui dans OperationBancaire, il ne devrait pas être dans Banque.

# Votre modèle Banque (pour référence, pas de changement nécessaire ici par rapport à votre dernière version)
from mongoengine import Document, FileField, DictField, ListField, EmbeddedDocumentField, StringField, FloatField, DateTimeField

class Banque(Document):
    user = ReferenceField('CustomUser', required=False) 
    # Champs obligatoires
    nom = fields.StringField(required=True, max_length=100)
    numero_compte = fields.StringField(required=True)
    titulaire = fields.StringField(required=True)
    fichier = fields.FileField(required=True)
    bic = fields.StringField()
    # Correction: Assurez-vous que total_debits existe si vous l'utilisez
    total_credits = fields.FloatField(default=0.0)
    total_debits = fields.FloatField(default=0.0) # Ajouté, car votre code l'attend
    
    # Champs optionnels
    iban = fields.StringField()
    numero = fields.StringField()
    periode = fields.StringField()
    date_debut = fields.DateTimeField(required=False) # Ajouté, car votre code l'attend
    date_fin = fields.DateTimeField(required=False)   # Ajouté, car votre code l'attend
    solde_initial = fields.FloatField()
    solde_final = fields.FloatField()
    
    # Attention ici: si 'montant' est le montant total de toutes les opérations,
    # son nom est ambigu car 'montant' existe aussi dans OperationBancaire.
    # Considérez de renommer ce champ si nécessaire (ex: 'total_montant_releve').
    # Si ce n'est pas un total, il pourrait être redondant avec solde_final/total_credits/debits.
    montant = fields.FloatField() 
    
    date_transaction = fields.DateTimeField(required=False) # Ou juste date_import si c'est la même chose
    
    # C'est ici que la liste des opérations est stockée
    operations = fields.ListField(fields.EmbeddedDocumentField(OperationBancaire))
    metadata = fields.DictField()
    extracted_data = DictField(default=dict) # Pour stocker les données structurées (banque, numero_compte, operations, etc.)
    full_text = StringField(default="")
    # Champs système
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    date_import = fields.DateTimeField(default=datetime.datetime.now)
    
    meta = {
        'collection': 'banques',
        'indexes': [
            'numero',
            'date_transaction',
            'numero_compte',
            {'fields': ['created_at'], 'expireAfterSeconds': 3600*24*365}
        ],
        'strict': False # Utile pendant le développement pour accepter des champs non définis
                        # mais à considérer de mettre à True en production pour la robustesse.
    }
    
    def clean(self):
        """Validation avant sauvegarde"""
        if self.solde_final and self.solde_initial:
            calculated_final = self.solde_initial + sum(
                op.montant if op.type_operation == 'credit' else -op.montant 
                for op in self.operations
            )
            if abs(self.solde_final - calculated_final) > 0.01:
                raise ValidationError("Le solde final ne correspond pas aux opérations")

    @property
    def fichier_url(self):
        return f'/api/banques/{self.id}/download/'
class Facture(Document):
    user = ReferenceField('CustomUser', required=False, sparse=True)
    numero = fields.StringField(required=False)
    montant_total = fields.FloatField()
    montant_ht = fields.FloatField()
    montant_tva = fields.FloatField()
    montant_ttc = fields.FloatField(required=False)
   
    net_a_payer = fields.FloatField(required=False)
   
    taux_tva = fields.FloatField(required=False)
    
    date_emission = fields.DateTimeField(required=False)
    date_echeance = fields.DateTimeField(required=False)
    date_import = fields.DateTimeField(default=timezone.now)
    client = StringField(max_length=255, null=True)
    emetteur = fields.StringField()
    ligne_details = fields.ListField(fields.DictField(), default=list)
    
    destinataire = fields.StringField()
    
    reference_paiement = StringField(max_length=255, null=True)
    devise = fields.StringField(default='TND')
    type = StringField(max_length=50, default='facture')
    confiance_extraction = FloatField(null=True)
    mode_reglement = fields.StringField(
    required=False,
    default='autre',
    help_text="Mode de paiement utilisé (ex: virement, cheque, espece, carte, mobile_money, etc.)"
)
    
    
      # Alternative si vous n'utilisez pas LigneFacture
    extracted_data = DictField(default=dict) # Pour stocker les données structurées (banque, numero_compte, operations, etc.)
    full_text = StringField(default="")
    fichier = fields.FileField()
    metadata = fields.DictField()
    rapport_id = fields.StringField(required=False)
    created_at = DateTimeField(default=datetime.datetime.now)
    meta = {
        'collection': 'factures',
        'indexes': [
            {'fields': ['numero', 'user'], 'unique': True, 'name': 'numero_user_index'},
            {'fields': ['emetteur'], 'name': 'emetteur_index'},
            {'fields': ['date_emission'], 'name': 'date_emission_index'},
            {'fields': ['montant_total'], 'name': 'montant_index'},
            {
                'fields': ['emetteur', 'date_emission'],
                'name': 'emetteur_date_compound_index'
            }
        ]
    }

    def clean(self):
        """Validation avant sauvegarde"""
        # Validation du montant TTC
        if self.montant_ht and self.montant_tva:
            calculated_ttc = self.montant_ht + self.montant_tva
            if abs(self.montant_total - calculated_ttc) > 0.01:
                raise ValidationError("Le montant total ne correspond pas à HT + TVA")
        
        # Validation des lignes de facture
        if self.ligne_details:
            total_lignes = sum(ligne.montant for ligne in self.ligne_details)
            if abs(self.montant_ht - total_lignes) > 0.01:
                raise ValidationError("Le montant HT ne correspond pas à la somme des lignes")

    @property
    def fichier_url(self):
        return f'/api/factures/{self.id}/download/'

    @property
    def filename(self):
        if self.fichier and hasattr(self.fichier, 'name'):
            return os.path.basename(str(self.fichier.name))
        return None
class Rapport(Document):
    """Modèle pour stocker les rapports de réconciliation générés"""
    user = ReferenceField('CustomUser', required=False) 
    # Références aux documents liés
    facture = ReferenceField('Facture', required=True)
    banque = ReferenceField('Banque', reverse_delete_rule=NULLIFY)
    
    
    # Métadonnées du rapport
    titre = StringField(required=True)
    date_generation = DateTimeField(default=datetime.datetime.now)
    date_creation = DateTimeField(default=datetime.datetime.now)  # Ajouté
    derniere_maj = DateTimeField(default=datetime.datetime.now)   # Ajouté
    statut = StringField(choices=['complet', 'incomplet', 'anomalie', 'Validé', 'Ajusté'], required=True)
    
    # Contenu du rapport
    resume_facture = DictField(required=True)
    resume_releve = DictField(required=True)
    resultat_verification = DictField(required=True)
    
    # Nouveaux champs pour correspondre à votre utilisation
    invoice_data = DictField()      # Ajouté
    statement_data = DictField()    # Ajouté
    verification_result = DictField()  # Ajouté
    
    anomalies = ListField(StringField(), default=list) # Changed from StringField to ListField of StringField
    recommendations = ListField(StringField())
    created_at = DateTimeField(default=datetime.datetime.now)
    analyse_texte = StringField()
    rapport_complet = DictField(required=True)
    
    meta = {
        'collection': 'rapport',
        'indexes': [
            'facture', 
            'banque', 
             
            'date_generation',
            'statut'
        ],
        'ordering': ['-date_generation']
    }
    
    def __str__(self):
        return f"Rapport {self.titre} - {self.date_generation.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        """Validation avant sauvegarde"""
        if not Facture.objects(id=self.facture.id).first():
            raise ValidationError("La facture référencée n'existe pas")
            
        
            
        if self.banque and not Banque.objects(id=self.banque.id).first():
            raise ValidationError("La banque référencée n'existe pas")
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