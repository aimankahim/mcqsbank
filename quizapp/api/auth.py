from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from django.core.cache import cache
from django.contrib.auth.hashers import make_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
        return value

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.data.get('username', '')
    exists = User.objects.filter(username=username).exists()
    return Response({'exists': exists})

@api_view(['POST'])
@permission_classes([AllowAny])
def get_username_by_email(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        return Response({'username': user.username})
    except User.DoesNotExist:
        return Response(
            {'detail': 'No user found with this email'},
            status=status.HTTP_404_NOT_FOUND
        )

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)
    
    # Generate OTP
    otp = generate_otp()
    
    # Store OTP in cache with 10 minutes expiration
    cache.set(f'reset_otp_{email}', otp, 600)
    
    # Send email with OTP
    send_mail(
        'Password Reset OTP',
        f'Your OTP for password reset is: {otp}\nThis OTP will expire in 10 minutes.',
        settings.EMAIL_HOST_USER,
        [email],
        fail_silently=False,
    )
    
    return Response({'message': 'OTP sent to your email'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    cached_otp = cache.get(f'reset_otp_{email}')
    
    if not cached_otp:
        return Response({'error': 'OTP expired or not found'}, status=status.HTTP_400_BAD_REQUEST)
    
    if cached_otp != otp:
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate a temporary token for password reset
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    cache.set(f'reset_token_{email}', reset_token, 600)
    
    return Response({'token': reset_token}, status=status.HTTP_200_OK)

@api_view(['POST'])
def reset_password(request):
    email = request.data.get('email')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([email, token, new_password]):
        return Response({'error': 'Email, token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    cached_token = cache.get(f'reset_token_{email}')
    
    if not cached_token or cached_token != token:
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        user.password = make_password(new_password)
        user.save()
        
        # Clear the tokens
        cache.delete(f'reset_token_{email}')
        cache.delete(f'reset_otp_{email}')
        
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND) 