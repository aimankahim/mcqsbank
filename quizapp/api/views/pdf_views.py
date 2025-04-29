from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from ..models.chat_models import PDFDocument
from ..serializers import PDFUploadSerializer, PDFSerializer
import base64
from django.http import HttpResponse, FileResponse

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
            
            # Create PDF record in database
            pdf = PDFDocument.objects.create(
                title=file.name,
                file=file,
                processed=False
            )
            
            return Response({"pdf_id": str(pdf.id)}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pdfs = PDFDocument.objects.filter(processed=True).order_by('-uploaded_at')
        data = [{
            'id': str(pdf.id),
            'title': pdf.title,
            'uploaded_at': pdf.uploaded_at
        } for pdf in pdfs]
        return Response(data)

class PDFDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id)
            pdf.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PDFDocument.DoesNotExist:
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class PDFDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id)
            response = FileResponse(pdf.file, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{pdf.title}"'
            return response
        except PDFDocument.DoesNotExist:
            return Response(
                {"error": "PDF not found"},
                status=status.HTTP_404_NOT_FOUND
            ) 