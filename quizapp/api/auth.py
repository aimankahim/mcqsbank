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
    
    try:
        user = User.objects.get(email=email)
        # Verify the token is valid
        refresh = RefreshToken(token)
        if refresh['user_id'] != user.id:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Clear the OTP from cache
        cache.delete(f'otp_{email}')
        
        return Response({'message': 'Password reset successfully'})
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        ) 
