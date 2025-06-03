from django.contrib import admin

# Register your models here.
from api.models.quiz_models import Quiz, QuizQuestion, Flashcard, ConciseNote
from api.models import YouTubeContent
admin.site.register(Quiz)
admin.site.register(QuizQuestion)   
admin.site.register(Flashcard)
admin.site.register(ConciseNote)
admin.site.register(YouTubeContent)
