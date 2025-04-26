from rest_framework import serializers
from ..models import PDF

class PDFSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDF
        fields = ['id', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

class PDFUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

class PDFInputSerializer(serializers.Serializer):
    pdf_id = serializers.CharField(required=True)
    num_items = serializers.IntegerField(required=False, default=5)
    difficulty = serializers.ChoiceField(
        required=False,
        default="medium",
        choices=["easy", "medium", "hard"]
    ) 