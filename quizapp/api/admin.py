from django.contrib import admin
from api.models import QuizModel, QuizQuestion, Flashcard, ConciseNote, PDF

# Register your models here.
admin.site.register(QuizModel)
admin.site.register(QuizQuestion)
admin.site.register(Flashcard)
admin.site.register(ConciseNote)
admin.site.register(PDF)
