# serializers.py
from rest_framework import serializers
from .models import CustomUser

class ProfilComptableSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    nom_complet = serializers.SerializerMethodField()
    telephone = serializers.CharField()
    matricule = serializers.CharField()
    departement = serializers.CharField()

    def get_nom_complet(self, obj):
        return f"{obj.prenom} {obj.nom}"
