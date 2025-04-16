from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.learning_views import LearningAPIView
from .views.pdf_views import PDFUploadView
from .views.quiz_views import QuizViewSet, QuizQuestionViewSet, FlashcardViewSet, ConciseNoteViewSet
from .views.chat_views import ChatView, PDFUploadView as ChatPDFUploadView

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'questions', QuizQuestionViewSet, basename='question')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')
router.register(r'notes', ConciseNoteViewSet, basename='note')

urlpatterns = [
    path('upload-pdf/', PDFUploadView.as_view(), name='upload-pdf'),
    path('chat/upload-pdf/', ChatPDFUploadView.as_view(), name='chat-upload-pdf'),
    path('chat/', ChatView.as_view(), name='chat'),
    path('generate-notes/', LearningAPIView.as_view(), name='generate-notes'),
    path('generate-quiz/', LearningAPIView.as_view(), name='generate-quiz'),
    path('generate-flashcards/', LearningAPIView.as_view(), name='generate-flashcards'),
    
    path('', include(router.urls)),
] 