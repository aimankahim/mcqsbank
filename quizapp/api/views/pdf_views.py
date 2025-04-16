from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
import uuid
import os
from django.conf import settings
from ..serializers import PDFUploadSerializer

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(settings.BASE_DIR, 'uploads')
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