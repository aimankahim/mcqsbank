from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class YouTubeContent(models.Model):
    CONTENT_TYPES = (
        ('quiz', 'Quiz'),
        ('flashcards', 'Flashcards'),
        ('notes', 'Notes'),
    )

    title = models.CharField(max_length=255)
    video_url = models.URLField()
    thumbnail_url = models.URLField(null=True, blank=True)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    content_data = models.JSONField()  # Store the actual content (questions, cards, or notes)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='youtube_content')

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'video_url': self.video_url,
            'thumbnail_url': self.thumbnail_url,
            'content_type': self.content_type,
            'created_at': self.created_at.isoformat(),
            'user_id': self.user_id
        }
