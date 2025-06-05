from django.db import models
from django.contrib.auth.models import User

class QuizType(models.TextChoices):
    MULTIPLE_CHOICE = 'multiple_choice', 'Multiple Choice'
    TRUE_FALSE = 'true_false', 'True/False'
    FILL_IN_BLANK = 'fill_in_blank', 'Fill in the Blank'
    MATCHING = 'matching', 'Matching'
    MIXED = 'mixed', 'Mixed'

class DifficultyLevel(models.TextChoices):
    EASY = 'easy', 'Easy'
    MEDIUM = 'medium', 'Medium'
    HARD = 'hard', 'Hard'

class QuizModel(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quiz_type = models.CharField(
        max_length=20,
        choices=QuizType.choices,
        default=QuizType.MULTIPLE_CHOICE
    )
    difficulty = models.CharField(
        max_length=10,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.MEDIUM
    )
    language = models.CharField(
        max_length=50,
        default='English'
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(QuizModel, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    correct_answer = models.TextField()
    options = models.JSONField()  # Store options as a JSON array
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quiz.title} - {self.question[:50]}"

class Flashcard(models.Model):
    title = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcards')
    front_content = models.TextField()
    back_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ConciseNote(models.Model):
    title = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='concise_notes')
    content = models.TextField()
    source_text = models.TextField(blank=True)  # Original text that was summarized
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class PDF(models.Model):
    title = models.CharField(max_length=200)
    file = models.BinaryField()  # Store PDF as binary data
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pdfs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at'] 