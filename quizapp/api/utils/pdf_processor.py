import io
import logging
from pypdf import PdfReader

logger = logging.getLogger(__name__)

def process_pdf_content(pdf_file):
    """
    Extract text content from a PDF file.
    
    Args:
        pdf_file: The PDF file object
        
    Returns:
        str: Extracted text content from the PDF
    """
    try:
        # Read the PDF file
        pdf_reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        text_content = []
        for page in pdf_reader.pages:
            text_content.append(page.extract_text())
            
        # Join all text content
        full_text = "\n".join(text_content)
        
        logger.info(f"Successfully extracted text from PDF")
        return full_text
        
    except Exception as e:
        logger.error(f"Error processing PDF content: {str(e)}")
        raise 