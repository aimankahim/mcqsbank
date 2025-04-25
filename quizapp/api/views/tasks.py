import logging
from celery import shared_task
from ..models.chat_models import PDFDocument
from ..utils.pdf_processor import process_pdf_content

logger = logging.getLogger(__name__)

@shared_task
def process_pdf(pdf_id):
    """
    Process a PDF document in the background.
    This task extracts text content from the PDF and updates the document status.
    """
    try:
        pdf = PDFDocument.objects.get(id=pdf_id)
        if pdf.processed:
            logger.info(f"PDF {pdf_id} is already processed")
            return

        # Process the PDF content
        content = process_pdf_content(pdf.file)
        
        # Update the PDF document
        pdf.content = content
        pdf.processed = True
        pdf.save()
        
        logger.info(f"Successfully processed PDF {pdf_id}")
        
    except PDFDocument.DoesNotExist:
        logger.error(f"PDF document {pdf_id} not found")
    except Exception as e:
        logger.error(f"Error processing PDF {pdf_id}: {str(e)}")
        # Update the document to indicate processing failure
        pdf.processed = False
        pdf.save() 