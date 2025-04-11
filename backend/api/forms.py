from allauth.account.forms import SignupForm
from django import forms
from api.models import CustomUser  # ou l'endroit où votre CustomUser est défini

class CustomSignupForm(SignupForm):
    role = forms.ChoiceField(
        choices=CustomUser.ROLE_CHOICES,
        widget=forms.RadioSelect,
        label="Votre rôle"
    )

    def save(self, request):
        user = super().save(request)
        user.role = self.cleaned_data['role']
        user.save()
        return user