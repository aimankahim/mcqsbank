from .quiz_views import (
    QuizViewSet,
    QuizQuestionViewSet,
    FlashcardViewSet,
    ConciseNoteViewSet
)
from .pdf_views import (
    PDFListView,
    PDFUploadView,
    PDFDeleteView,
    PDFDownloadView
)
from .learning_views import LearningAPIView
from .chat_views import PDFChatMessageView

__all__ = [
    'QuizViewSet',
    'QuizQuestionViewSet',
    'FlashcardViewSet',
    'ConciseNoteViewSet',
    'PDFListView',
    'PDFUploadView',
    'PDFDeleteView',
    'PDFDownloadView',
    'LearningAPIView',
    'PDFChatMessageView'
] 

# http://127.0.0.1:8000
# https://django-based-mcq-app.onrender.com