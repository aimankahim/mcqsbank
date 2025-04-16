from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models.quiz_models import Quiz, QuizQuestion, Flashcard, ConciseNote
from api.serializers.quiz_serializers import QuizSerializer, QuizQuestionSerializer, FlashcardSerializer, ConciseNoteSerializer

class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quiz.objects.filter(user=self.request.user).order_by('-created_at')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        # Include questions in the response
        questions = QuizQuestion.objects.filter(quiz=instance)
        question_serializer = QuizQuestionSerializer(questions, many=True)
        data['questions'] = question_serializer.data
        return Response(data)

    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        quiz = self.get_object()
        serializer = QuizQuestionSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(quiz=quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        recent_quizzes = self.get_queryset()[:5]
        serializer = self.get_serializer(recent_quizzes, many=True)
        data = serializer.data
        # Include questions for each quiz
        for quiz_data in data:
            questions = QuizQuestion.objects.filter(quiz_id=quiz_data['id'])
            question_serializer = QuizQuestionSerializer(questions, many=True)
            quiz_data['questions'] = question_serializer.data
        return Response(data)

class QuizQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizQuestion.objects.filter(quiz__user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        quiz_id = self.request.data.get('quiz')
        quiz = Quiz.objects.get(id=quiz_id, user=self.request.user)
        serializer.save(quiz=quiz)

class FlashcardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Flashcard.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'])
    def recent(self, request):
        recent_flashcards = self.get_queryset()[:5]
        serializer = self.get_serializer(recent_flashcards, many=True)
        return Response(serializer.data)

class ConciseNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ConciseNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ConciseNote.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['GET'])
    def recent(self, request):
        recent_notes = self.get_queryset().order_by('-created_at')[:5]
        serializer = self.get_serializer(recent_notes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'])
    def generate(self, request, pk=None):
        note = self.get_object()
        # Add your note generation logic here
        # For example, using OpenAI or other summarization service
        generated_content = "Generated concise notes will go here"
        note.content = generated_content
        note.save()
        serializer = self.get_serializer(note)
        return Response(serializer.data) 