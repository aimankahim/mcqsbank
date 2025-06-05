from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuizViewSet,
    QuizQuestionViewSet,
    FlashcardViewSet,
    ConciseNoteViewSet,
    PDFListView,
    PDFUploadView,
    PDFDeleteView,
    PDFDownloadView,
    LearningAPIView,
    PDFChatMessageView
)
from .views.learning_views import (
    get_learning_activity,
    get_recent_quizzes,
    get_recent_flashcards,
    get_total_counts,
    get_quiz_detail,
    get_flashcard_detail
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'quiz-questions', QuizQuestionViewSet, basename='quiz-question')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')
router.register(r'notes', ConciseNoteViewSet, basename='note')

urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
    
    # PDF endpoints
    path('pdfs/', PDFListView.as_view(), name='pdf-list'),
    path('pdfs/upload/', PDFUploadView.as_view(), name='pdf-upload'),
    path('pdfs/<uuid:pdf_id>/delete/', PDFDeleteView.as_view(), name='pdf-delete'),
    path('pdfs/<uuid:pdf_id>/download/', PDFDownloadView.as_view(), name='pdf-download'),
    
    # Chat endpoints
    path('chat/', PDFChatMessageView.as_view(), name='chat'),
    
    # Learning endpoints
    path('learning/', LearningAPIView.as_view(), name='learning'),
    path('learning/activity/', get_learning_activity, name='learning-activity'),
    path('learning/recent-quizzes/', get_recent_quizzes, name='recent-quizzes'),
    path('learning/recent-flashcards/', get_recent_flashcards, name='recent-flashcards'),
    path('learning/total-counts/', get_total_counts, name='total-counts'),
    path('learning/quizzes/<int:quiz_id>/', get_quiz_detail, name='quiz-detail'),
    path('learning/flashcards/<int:flashcard_id>/', get_flashcard_detail, name='flashcard-detail'),
] 