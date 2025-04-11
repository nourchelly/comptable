from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from api.permissions import IsDirecteur  # Import simple

class DirecteurDashboard(APIView):
    permission_classes = [IsDirecteur]  # Une seule ligne à ajouter !

    def get(self, request):
        return Response({"message": "Bienvenue Directeur !"})