from api.permissions import RolePermission

class IsAdmin(RolePermission):
    """Accès réservé aux administrateurs"""
    allowed_roles = ['admin']
    message = "Réservé aux administrateurs"