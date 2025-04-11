from rest_framework import permissions

class IsAuthenticated(permissions.BasePermission):
    """Vérifie que l'utilisateur est connecté"""
    def has_permission(self, request, view):
        return request.user.is_authenticated

class RolePermission(permissions.BasePermission):
    """Permission générique pour les rôles"""
    allowed_roles = []
    message = "Accès refusé : rôle non autorisé"

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in self.allowed_roles
        )

# Permission pour Comptable
class IsComptable(RolePermission):
    allowed_roles = ['comptable']
    message = "Réservé aux comptables"

# Permission pour Admin
class IsAdmin(RolePermission):
    allowed_roles = ['admin']
    message = "Réservé aux administrateurs"

# Permission pour Directeur
class IsDirecteur(RolePermission):
    allowed_roles = ['directeur'] 
    message = "Réservé aux directeurs"