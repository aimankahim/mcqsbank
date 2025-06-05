from django.core.management.base import BaseCommand
from api.models.chat_models import PDFDocument

class Command(BaseCommand):
    help = 'Delete all PDFDocument objects.'

    def handle(self, *args, **options):
        count = PDFDocument.objects.count()
        PDFDocument.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {count} PDFDocument(s).')) 