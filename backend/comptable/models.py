from mongoengine import Document, StringField, BooleanField,ReferenceField

# Vous pouvez adapter ce modèle à la structure exacte de vos documents dans MongoDB
class Comptable(Document):
    
    
    username = StringField(required=True)
    email = StringField(required=True)
    password = StringField(required=True)
    role = StringField(default="comptable")
    nom_complet = StringField()
    telephone = StringField()
    matricule = StringField()
    departement = StringField()
    is_active = BooleanField(default=True)
    meta = {'collection': 'custom_user'}


   