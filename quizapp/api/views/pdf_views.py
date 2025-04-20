from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
import uuid
import os
from django.conf import settings
from ..serializers import PDFUploadSerializer
from .models.chat_models import PDFDocument

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(settings.BASE_DIR, 'uploads')
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class PDFView(APIView):
    @swagger_auto_schema(
        responses={
            200: 'List of PDFs',
            500: 'Internal Server Error'
        }
    )
    def get(self, request):
        try:
            pdfs = PDFDocument.objects.all().order_by('-created_at')
            pdf_list = [
                {
                    'id': str(pdf.id),
                    'name': pdf.file_name,
                    'created_at': pdf.created_at.isoformat()
                }
                for pdf in pdfs
            ]
            return Response(pdf_list, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        request_body=PDFUploadSerializer,
        responses={
            200: 'PDF uploaded successfully',
            400: 'Bad Request',
            500: 'Internal Server Error'
        }
    )
    def post(self, request):
        try:
            file = request.FILES['file']
            if not file.name.endswith('.pdf'):
                return Response(
                    {"error": "File must be a PDF"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create PDF document record
            pdf_doc = PDFDocument.objects.create(
                file_name=file.name,
                file_path=os.path.join(settings.UPLOAD_DIR, file.name)
            )
            
            # Save the file
            with open(pdf_doc.file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            return Response({
                'id': str(pdf_doc.id),
                'name': pdf_doc.file_name,
                'created_at': pdf_doc.created_at.isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFDetailView(APIView):
    @swagger_auto_schema(
        responses={
            200: 'PDF deleted successfully',
            404: 'PDF not found',
            500: 'Internal Server Error'
        }
    )
    def delete(self, request, pdf_id):
        try:
            pdf_doc = PDFDocument.objects.get(id=pdf_id)
            
            # Delete the file from storage
            if pdf_doc.file_path and os.path.exists(pdf_doc.file_path):
                os.remove(pdf_doc.file_path)
            
            # Delete the database record
            pdf_doc.delete()
            
            return Response(
                {'message': 'PDF deleted successfully'},
                status=status.HTTP_200_OK
            )
        except PDFDocument.DoesNotExist:
            return Response(
                {'error': 'PDF not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 