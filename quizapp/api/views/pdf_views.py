from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
import uuid
import os
from django.conf import settings
from django.http import FileResponse
from ..serializers import PDFUploadSerializer

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'pdfs')
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class PDFUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

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
            serializer = PDFUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = serializer.validated_data['file']
            if not file.name.endswith('.pdf'):
                return Response(
                    {"error": "File must be a PDF"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate unique ID for the PDF
            pdf_id = str(uuid.uuid4())
            file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
            
            # Save the file
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            return Response({"pdf_id": pdf_id}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFListView(APIView):
    def get(self, request):
        try:
            pdfs = []
            for filename in os.listdir(UPLOAD_DIR):
                if filename.endswith('.pdf'):
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    pdfs.append({
                        'id': filename.replace('.pdf', ''),
                        'name': filename,
                        'size': os.path.getsize(file_path),
                        'uploaded_at': os.path.getctime(file_path)
                    })
            return Response(pdfs, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pdf_id):
        try:
            file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
            if os.path.exists(file_path):
                os.remove(file_path)
                return Response(
                    {"message": "PDF deleted successfully"},
                    status=status.HTTP_200_OK
                )
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFDownloadView(APIView):
    def get(self, request, pdf_id):
        try:
            file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{pdf_id}.pdf"'
                return response
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 