from rest_framework import serializers
from ..models.chat_models import PDFDocument

class PDFSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField()
    
    class Meta:
        model = PDFDocument
        fields = ['id', 'title', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class PDFUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

class PDFInputSerializer(serializers.Serializer):
    pdf_id = serializers.UUIDField(required=True)
    num_items = serializers.IntegerField(required=False, default=5)
    difficulty = serializers.ChoiceField(
        required=False,
        default="medium",
        choices=["easy", "medium", "hard"]
    ) 