from rest_framework import serializers

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