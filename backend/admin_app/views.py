from django.shortcuts import render
from rest_framework.response import Response
# Create your views here.
from rest_framework.views import APIView
from .permissions import IsAdmin

class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]  # <-- Utilisation ici

    def get(self, request):
        return Response({"message": "Bienvenue dans l'espace admin"})
