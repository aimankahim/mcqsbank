from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.settings import api_settings

class AsyncJWTAuthentication(JWTAuthentication):
    async def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except InvalidToken:
            raise AuthenticationFailed('Invalid token')

        try:
            user = await self.get_user_async(validated_token)
        except:
            raise AuthenticationFailed('No user found for token')

        return (user, validated_token)

    @sync_to_async
    def get_user_async(self, validated_token):
        """
        Async wrapper for getting user from the database
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
            user = get_user_model().objects.get(**{api_settings.USER_ID_FIELD: user_id})
            return user
        except:
            raise AuthenticationFailed('User not found') 