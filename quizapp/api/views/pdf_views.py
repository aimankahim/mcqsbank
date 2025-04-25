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
from .tasks import process_pdf

# Set up logging
logger = logging.getLogger(__name__)

class PDFUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

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
            if 'file' not in request.FILES:
                return Response(
                    {"error": "No file provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = request.FILES['file']
            if not file.name.endswith('.pdf'):
                return Response(
                    {"error": "Only PDF files are allowed"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create PDFDocument instance
            pdf = PDFDocument.objects.create(
                user=request.user,
                title=file.name,
                file=file,
                processed=False
            )

            # Start processing the PDF in the background
            process_pdf.delay(pdf.id)

            return Response({
                "id": str(pdf.id),
                "name": pdf.title,
                "uploaded_at": pdf.uploaded_at.timestamp(),
                "processed": pdf.processed
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error uploading PDF: {str(e)}")
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
                'uploaded_at': pdf.uploaded_at.timestamp(),
                'processed': pdf.processed
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