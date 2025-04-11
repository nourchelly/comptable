from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from comptable.models import Comptable
import jwt

SECRET_KEY = 'django-insecure-s%c^c5j4rj=xfoy_zl@^sozn6ttd^-i-*icwuwz0@34=xlfy1i'  # idéalement, mets ça dans settings.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profil_comptable(request):
    try:
        # Récupération du token JWT
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return Response({'error': 'Token manquant'}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')

        # Récupérer l'utilisateur avec le bon rôle
        comptable = Comptable.objects.get(id=user_id, role="comptable")

        return Response({
            'id': str(comptable.id),
            'username': comptable.username,
            'email': comptable.email,
            'role': comptable.role,
            'nom_complet': comptable.nom_complet,
            'telephone': comptable.telephone,
            'matricule': comptable.matricule,
            'departement': comptable.departement,
        })
    
    except Comptable.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé ou rôle invalide'}, status=status.HTTP_404_NOT_FOUND)
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token expiré'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.DecodeError:
        return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
