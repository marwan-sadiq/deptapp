from django.utils import timezone
from django.core.cache import cache
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    """Custom token authentication with expiration"""
    
    def authenticate_credentials(self, key):
        """Authenticate token and check expiration"""
        try:
            token = self.get_model().objects.select_related('user').get(key=key)
        except self.get_model().DoesNotExist:
            raise AuthenticationFailed('Invalid token')
        
        if not token.user.is_active:
            raise AuthenticationFailed('User inactive or deleted')
        
        # No token expiration check - tokens are permanent
        # token_expiry = cache.get(f"token_expiry_{key}")
        # if token_expiry and timezone.now() > token_expiry:
        #     # Token expired, delete it
        #     token.delete()
        #     cache.delete(f"token_expiry_{key}")
        #     raise AuthenticationFailed('Token has expired')
        
        return (token.user, token)
