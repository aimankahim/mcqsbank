from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from ..models import PDF
from ..serializers import PDFUploadSerializer, PDFSerializer
import base64

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
            
            # Read the file content
            file_content = file.read()
            
            # Create PDF record in database
            pdf = PDF.objects.create(
                title=file.name,
                file=file_content,
                user=request.user
            )
            
            return Response({"pdf_id": pdf.id}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pdfs = PDF.objects.filter(user=request.user)
        serializer = PDFSerializer(pdfs, many=True)
        return Response(serializer.data)

class PDFDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pdf_id):
        try:
            pdf = PDF.objects.get(id=pdf_id, user=request.user)
            pdf.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PDF.DoesNotExist:
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            ) 