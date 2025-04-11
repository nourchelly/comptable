from django.urls import path
from .views import AdminDashboardView
app_name = 'admin_app'
urlpatterns = [
     path('dashboard/', AdminDashboardView.as_view(), name='dashboard'),
]