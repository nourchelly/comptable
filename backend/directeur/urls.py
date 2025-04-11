from django.urls import path
from .views import DirecteurDashboard

urlpatterns = [
    path('dashboarddirecteur/', DirecteurDashboard.as_view()),
]