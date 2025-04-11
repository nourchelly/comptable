from api.permissions import RolePermission

class IsComptable(RolePermission):
    """Accès réservé aux comptables"""
    allowed_roles = ['comptable']
    message = "Réservé aux comptables"