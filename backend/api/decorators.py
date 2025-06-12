# decorators.py
from django.http import JsonResponse
from functools import wraps

def comptable_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if 'user_role' not in request.session or request.session['user_role'] != 'comptable':
            return JsonResponse({'error': 'Accès non autorisé'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view