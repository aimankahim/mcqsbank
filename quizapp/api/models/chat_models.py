from django.db import models
from django.contrib.auth.models import User
import uuid
import os
from django.conf import settings

def pdf_upload_path(instance, filename):
    # Generate a unique filename using UUID
    ext = filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}_{filename}"
    # Ensure the path is relative to MEDIA_ROOT
    return os.path.join('pdfs', unique_filename)

class PDFDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=pdf_upload_path)  # Use custom upload path
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    embedding_store = models.CharField(max_length=255, blank=True, null=True)  # Path to the vector store
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pdf_documents')  # Make user field required

    def __str__(self):
        return self.title

    def get_file_path(self):
        """Get the absolute file path"""
        if self.file:
            return os.path.join(settings.MEDIA_ROOT, self.file.name)
        return None

    def delete(self, *args, **kwargs):
        """Override delete to also remove the file"""
        if self.file:
            file_path = self.get_file_path()
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        super().delete(*args, **kwargs)

    class Meta:
        ordering = ['-uploaded_at']

class ChatMessage(models.Model):
    pdf_document = models.ForeignKey(PDFDocument, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..." 