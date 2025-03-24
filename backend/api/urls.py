from django.urls import path
from .views import home, LoginView, RegisterView,forgot_password, LogoutView

app_name = 'api'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
     path('signup/', RegisterView.as_view(), name='Signup'),
    path('home/', home, name='home'),
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
