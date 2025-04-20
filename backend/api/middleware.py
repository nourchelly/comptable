from django.http import JsonResponse
import jwt
from django.conf import settings

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            token = request.headers.get('Authorization', '').split(' ')[-1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                request.user_id = payload['user_id']
            except Exception as e:
                return JsonResponse({'error': 'Token invalide'}, status=401)
        
        return self.get_response(request)