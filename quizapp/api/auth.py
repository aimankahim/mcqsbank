from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache

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
    # Check if username already exists
    username = request.data.get('username')
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': f'Username "{username}" is already taken. Please choose a different username.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if email already exists
    email = request.data.get('email')
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': f'Email "{email}" is already registered. Please use a different email.'},
            status=status.HTTP_400_BAD_REQUEST
        )

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
    
    # Return validation errors
    return Response(
        {'error': 'Invalid data provided', 'details': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.data.get('username', '')
    if not username:
        return Response(
            {'error': 'Username is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exists = User.objects.filter(username=username).exists()
    return Response({
        'exists': exists,
        'message': f'Username "{username}" is already taken' if exists else f'Username "{username}" is available'
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def get_username_by_email(request):
    email = request.data.get('email')
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        return Response({'username': user.username})
    except User.DoesNotExist:
        return Response(
            {'error': 'No account found with this email address. Please check your email or sign up.'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        # Generate 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        # Store OTP in cache with 5-minute expiry
        cache.set(f'otp_{email}', otp, 300)
        
        # Send OTP via email
        send_mail(
            'Password Reset OTP',
            f'Your OTP for password reset is: {otp}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return Response({'message': 'OTP sent successfully'})
    except User.DoesNotExist:
        return Response(
            {'error': 'No user found with this email'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    cached_otp = cache.get(f'otp_{email}')
    if not cached_otp:
        return Response(
            {'error': 'OTP expired or not found'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if cached_otp != otp:
        return Response(
            {'error': 'Invalid OTP'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate a temporary token for password reset
    user = User.objects.get(email=email)
    refresh = RefreshToken.for_user(user)
    return Response({
        'token': str(refresh.access_token)
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    if not all([email, token, new_password]):
        return Response(
            {'error': 'Missing required fields'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        # Verify the token is valid
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            if access_token['user_id'] != user.id:
                return Response(
                    {'error': 'Invalid token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': 'Invalid token format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        try:
            validate_password(new_password)
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password reset successfully'})
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        ) 
