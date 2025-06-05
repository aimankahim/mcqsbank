from rest_framework import serializers
from api.models.quiz_models import QuizModel, QuizQuestion, Flashcard, ConciseNote
import logging

logger = logging.getLogger(__name__)

class PDFInputSerializer(serializers.Serializer):
    pdf_id = serializers.CharField(required=True)
    num_items = serializers.IntegerField(required=False, default=5)
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'],
        required=False,
        default='medium'
    )
    language = serializers.CharField(
        required=False,
        default='English',
        help_text="The language for the quiz content (e.g., 'Spanish', 'French', etc.)"
    )
    quiz_type = serializers.ChoiceField(
        choices=['multiple_choice', 'true_false', 'fill_in_blank', 'matching', 'mixed'],
        required=False,
        default='multiple_choice'
    )
    content = serializers.DictField(required=False)

    def validate_language(self, value):
        if not value:
            return "English"
        # Convert to title case for consistency
        return value.title()

    def validate(self, data):
        # Ensure language is included in validated data
        if 'language' not in data:
            data['language'] = 'English'
        # Ensure content is included if present in initial data
        if 'content' in self.initial_data:
            data['content'] = self.initial_data['content']
        return data

    def to_internal_value(self, data):
        # Ensure language is preserved
        internal_value = super().to_internal_value(data)
        if 'language' in data:
            internal_value['language'] = data['language']
        return internal_value

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'correct_answer', 'options', 'created_at']
        read_only_fields = ['id', 'created_at']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizModel
        fields = [
            'id', 'title', 'description', 'questions',
            'difficulty', 'language', 'quiz_type',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        logger.info(f"Creating quiz with data: {validated_data}")
        validated_data['user'] = self.context['request'].user
        quiz = super().create(validated_data)
        logger.info(f"Created quiz with ID: {quiz.id}")
        return quiz

    def to_representation(self, instance):
        logger.info(f"Serializing quiz: {instance.id}")
        data = super().to_representation(instance)
        
        # Ensure all required fields are present
        if 'description' not in data or not data['description']:
            data['description'] = ''
        if 'difficulty' not in data or not data['difficulty']:
            data['difficulty'] = 'medium'
        if 'language' not in data or not data['language']:
            data['language'] = 'English'
        if 'quiz_type' not in data or not data['quiz_type']:
            data['quiz_type'] = 'multiple_choice'
            
        # Get questions for this quiz
        questions = QuizQuestion.objects.filter(quiz=instance)
        question_serializer = QuizQuestionSerializer(questions, many=True)
        data['questions'] = question_serializer.data
        
        logger.info(f"Serialized quiz data: {data}")
        return data

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ['id', 'title', 'front_content', 'back_content', 'created_at', 'updated_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        user = self.context['request'].user
        flashcard = Flashcard.objects.create(user=user, **validated_data)
        return flashcard

class ConciseNoteSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ConciseNote
        fields = ['id', 'title', 'content', 'source_text', 'user', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 