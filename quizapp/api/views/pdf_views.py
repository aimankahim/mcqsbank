from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
import uuid
import os
import logging
from django.conf import settings
from django.http import FileResponse, HttpResponse
from ..serializers import PDFUploadSerializer
from ..models.chat_models import PDFDocument
import io

# Set up logging
logger = logging.getLogger(__name__)

class PDFUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

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
            logger.info("Starting PDF upload process")
            
            serializer = PDFUploadSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid serializer data: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = serializer.validated_data['file']
            if not file.name.endswith('.pdf'):
                logger.error(f"Invalid file type: {file.name}")
                return Response(
                    {"error": "File must be a PDF"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Read file content
            file_content = file.read()
            
            # Create PDFDocument instance
            pdf_doc = PDFDocument.objects.create(
                title=file.name,
                content=file_content,
                user=request.user
            )
            
            logger.info(f"PDF saved to database with ID: {pdf_doc.id}")
            
            return Response({"pdf_id": str(pdf_doc.id)}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error uploading PDF: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pdfs = PDFDocument.objects.filter(user=request.user)
            pdf_list = [{
                'id': str(pdf.id),
                'name': pdf.title,
                'uploaded_at': pdf.uploaded_at.timestamp()
            } for pdf in pdfs]
            
            logger.info(f"Found {len(pdf_list)} PDFs")
            return Response(pdf_list, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error listing PDFs: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id, user=request.user)
            pdf.delete()
            logger.info(f"PDF deleted successfully: {pdf_id}")
            return Response(
                {"message": "PDF deleted successfully"},
                status=status.HTTP_200_OK
            )
        except PDFDocument.DoesNotExist:
            logger.error(f"PDF not found: {pdf_id}")
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting PDF: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id, user=request.user)
            
            # Create a response with PDF content
            response = HttpResponse(pdf.content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{pdf.title}"'
            
            logger.info(f"PDF downloaded successfully: {pdf_id}")
            return response
            
        except PDFDocument.DoesNotExist:
            logger.error(f"PDF not found for download: {pdf_id}")
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error downloading PDF: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 