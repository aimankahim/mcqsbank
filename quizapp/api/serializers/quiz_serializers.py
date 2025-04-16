from rest_framework import serializers
from api.models.quiz_models import Quiz, QuizQuestion, Flashcard, ConciseNote

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'correct_answer', 'options', 'created_at']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'questions', 'created_at', 'updated_at']
        read_only_fields = ['user']

    def create(self, validated_data):
        user = self.context['request'].user
        quiz = Quiz.objects.create(user=user, **validated_data)
        return quiz

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