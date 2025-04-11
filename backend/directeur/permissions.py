from api.permissions import RolePermission

class IsDirecteur(RolePermission):
    """Accès réservé aux directeurs financiers"""
    allowed_roles = ['directeur']
    message = "Réservé aux directeurs financiers"