from rest_framework import serializers

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