from rest_framework import serializers
from .models import Quiz, QuizQuestion, Flashcard, ConciseNote, PDF

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
    language = serializers.ChoiceField(
        required=False,
        default="English",
        choices=["English", "Spanish", "French", "German", "Italian", "Portuguese", "Chinese", "Japanese", "Korean", "Russian", "Arabic", "Hindi"]
    )
    quiz_type = serializers.ChoiceField(
        required=False,
        default="multiple_choice",
        choices=["multiple_choice", "true_false", "fill_in_blank", "matching", "mixed"]
    )
    content = serializers.JSONField(required=False, allow_null=True)

    def validate(self, data):
        # Ensure language is properly handled
        if 'language' in self.initial_data:
            data['language'] = self.initial_data['language']
        return data

class TextInputSerializer(serializers.Serializer):
    text = serializers.CharField(required=True)
    mode = serializers.ChoiceField(choices=['notes', 'quizz', 'flashcard'])
    num_questions = serializers.IntegerField(required=False, default=5)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'], required=False, default='medium')
    num_flashcards = serializers.IntegerField(required=False, default=5)

class QuizQuestionSerializer(serializers.Serializer):
    question = serializers.CharField()
    options = serializers.ListField(child=serializers.CharField())
    correct_answer = serializers.CharField()

class QuizResponseSerializer(serializers.Serializer):
    questions = serializers.ListField(child=QuizQuestionSerializer())

class FlashcardItemSerializer(serializers.Serializer):
    question = serializers.CharField()
    answer = serializers.CharField()

class FlashcardResponseSerializer(serializers.Serializer):
    flashcards = serializers.ListField(child=FlashcardItemSerializer())

class NotesResponseSerializer(serializers.Serializer):
    notes = serializers.CharField() 