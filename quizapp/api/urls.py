from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.learning_views import LearningAPIView
from .views.pdf_views import PDFUploadView, PDFListView, PDFDeleteView, PDFDownloadView
from .views.quiz_views import QuizViewSet, QuizQuestionViewSet, FlashcardViewSet, ConciseNoteViewSet
from .views.chat_views import (
    ChatView, 
    PDFUploadView as ChatPDFUploadView,
    PDFListView as ChatPDFListView,
    PDFDetailView as ChatPDFDetailView,
    PDFDownloadView as ChatPDFDownloadView,
    PDFDeleteView as ChatPDFDeleteView
)
from .views.youtube_views import (
    YouTubeProcessView, 
    YouTubeNotesDownloadView, 
    YouTubeChatMessageView,
    youtube_history
)
from . import views

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'questions', QuizQuestionViewSet, basename='question')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')
router.register(r'notes', ConciseNoteViewSet, basename='note')

urlpatterns = [
    # PDF endpoints
    path('pdfs/upload/', PDFUploadView.as_view(), name='pdf-upload'),
    path('pdfs/', PDFListView.as_view(), name='pdf-list'),
    path('pdfs/<int:pdf_id>/', PDFDeleteView.as_view(), name='pdf-delete'),
    path('pdfs/<int:pdf_id>/download/', PDFDownloadView.as_view(), name='pdf-download'),
    
    # Chat endpoints
    path('chat/upload-pdf/', ChatPDFUploadView.as_view(), name='chat-upload-pdf'),
    path('chat/pdfs/', ChatPDFListView.as_view(), name='chat-pdf-list'),
    path('chat/pdf/<uuid:pdf_id>/', ChatPDFDetailView.as_view(), name='chat-pdf-detail'),
    path('chat/pdf/<uuid:pdf_id>/download/', ChatPDFDownloadView.as_view(), name='chat-pdf-download'),
    path('chat/pdf/<uuid:pdf_id>/delete/', ChatPDFDeleteView.as_view(), name='chat-pdf-delete'),
    path('chat/', ChatView.as_view(), name='chat'),
    
    # YouTube endpoints
    path('youtube/quiz/', YouTubeProcessView.as_view(), name='youtube-quiz'),
    path('youtube/flashcards/', YouTubeProcessView.as_view(), name='youtube-flashcards'),
    path('youtube/notes/', YouTubeProcessView.as_view(), name='youtube-notes'),
    path('youtube/chat/', YouTubeProcessView.as_view(), name='youtube-chat'),
    path('youtube/chat/message/', YouTubeChatMessageView.as_view(), name='youtube-chat-message'),
    path('youtube/notes/download/', YouTubeNotesDownloadView.as_view(), name='youtube-notes-download'),
    path('youtube/history/', youtube_history, name='youtube_history'),
    
    # Learning endpoints
    path('learning/generate-notes/', LearningAPIView.as_view(), name='generate-notes'),
    path('learning/generate-quiz/', LearningAPIView.as_view(), name='generate-quiz'),
    path('learning/generate-flashcards/', LearningAPIView.as_view(), name='generate-flashcards'),
    path('learning/', LearningAPIView.as_view(), name='learning'),
    
    # Router URLs
    path('', include(router.urls)),
] 