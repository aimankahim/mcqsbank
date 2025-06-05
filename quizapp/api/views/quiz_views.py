from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models.quiz_models import QuizModel, QuizQuestion, Flashcard, ConciseNote
from api.serializers.quiz_serializers import QuizSerializer, QuizQuestionSerializer, FlashcardSerializer, ConciseNoteSerializer
import logging

logger = logging.getLogger(__name__)

class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        logger.info(f"Getting quizzes for user: {self.request.user}")
        queryset = QuizModel.objects.filter(user=self.request.user).order_by('-created_at')
        logger.info(f"Found {queryset.count()} quizzes")
        return queryset

    def retrieve(self, request, *args, **kwargs):
        logger.info(f"Retrieving quiz with ID: {kwargs.get('pk')}")
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        logger.info(f"Quiz data: {serializer.data}")
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        logger.info("Fetching recent quizzes")
        try:
            # Get the 4 most recent quizzes for the user
            recent_quizzes = QuizModel.objects.filter(
                user=request.user
            ).order_by('-created_at')[:4]
            
            logger.info(f"Found {recent_quizzes.count()} recent quizzes")
            
            # Serialize the quizzes
            serializer = QuizSerializer(recent_quizzes, many=True)
            logger.info(f"Serialized quizzes: {serializer.data}")
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching recent quizzes: {str(e)}")
            return Response([], status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        quiz = self.get_object()
        serializer = QuizQuestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(quiz=quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuizQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return QuizQuestion.objects.filter(quiz__user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        quiz_id = self.request.data.get('quiz')
        quiz = QuizModel.objects.get(id=quiz_id, user=self.request.user)
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