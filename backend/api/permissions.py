from rest_framework import permissions

class RolePermission(permissions.BasePermission):
    """Permission générique pour les rôles"""
    allowed_roles = []
    message = "Accès refusé : rôle non autorisé"

    def has_permission(self, request, view):
        # Vérifie que l'utilisateur est authentifié et que son rôle est autorisé
        if not request.user.is_authenticated:
            return False
        return request.user.role in self.allowed_roles


# Permission pour Comptable
class IsComptable(RolePermission):
    allowed_roles = ['comptable']
    message = "Réservé aux comptables"

# Permission pour Admin
class IsAdminUser(RolePermission):
    allowed_roles = ['admin']
    message = "Réservé aux administrateurs"

# Permission pour Directeur
class IsDirecteur(RolePermission):
    allowed_roles = ['directeur']
    message = "Réservé aux directeurs"



