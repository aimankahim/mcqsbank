import os
import logging
import uuid
from functools import lru_cache
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core.cache import cache
from django.http import FileResponse
from ..models.chat_models import PDFDocument, ChatMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Get API key from environment
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY not found in environment variables")

# Configure Google API
genai.configure(api_key=GOOGLE_API_KEY)

# Cache for vector stores and conversation chains
VECTOR_STORE_CACHE = {}
CONVERSATION_CHAIN_CACHE = {}

@lru_cache(maxsize=10)
def get_llm():
    """Cache the LLM instance"""
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0,
        google_api_key=GOOGLE_API_KEY,
        convert_system_message_to_human=True
    )

@lru_cache(maxsize=1)
def get_embeddings():
    """Cache the embeddings instance"""
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=GOOGLE_API_KEY
    )

class PDFListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pdfs = PDFDocument.objects.filter(user=request.user, processed=True).order_by('-uploaded_at')
            data = [{
                'id': str(pdf.id),
                'title': pdf.title,
                'uploaded_at': pdf.uploaded_at
            } for pdf in pdfs]
            return Response(data)
        except Exception as e:
            logger.error(f"Error listing PDFs: {str(e)}")
            return Response(
                {'error': 'Failed to list PDFs'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id, user=request.user, processed=True)
            data = {
                'id': str(pdf.id),
                'title': pdf.title,
                'uploaded_at': pdf.uploaded_at
            }
            return Response(data)
        except PDFDocument.DoesNotExist:
            return Response(
                {'error': 'PDF not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting PDF: {str(e)}")
            return Response(
                {'error': 'Failed to get PDF'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFDownloadView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id, user=request.user, processed=True)
            file_path = pdf.get_file_path()
            
            if not file_path or not os.path.exists(file_path):
                logger.error(f"PDF file not found at path: {file_path}")
                return Response(
                    {'error': f'PDF file not found at path: {file_path}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                as_attachment=True,
                filename=pdf.title
            )
            return response
            
        except PDFDocument.DoesNotExist:
            logger.error(f"PDF document not found with ID: {pdf_id}")
            return Response(
                {'error': 'PDF not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error downloading PDF: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to download PDF'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFDeleteView(views.APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pdf_id):
        try:
            pdf = PDFDocument.objects.get(id=pdf_id, user=request.user)
            pdf.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PDFDocument.DoesNotExist:
            return Response(
                {'error': 'PDF not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error deleting PDF: {str(e)}")
            return Response(
                {'error': 'Failed to delete PDF'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFUploadView(views.APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info("Received PDF upload request")
        
        if not GOOGLE_API_KEY:
            logger.error("Google API key not configured")
            return Response(
                {'error': 'Google API key not configured'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            if 'file' not in request.FILES:
                logger.error("No PDF file in request")
                return Response(
                    {'error': 'No PDF file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            pdf_file = request.FILES['file']
            logger.info(f"Processing PDF file: {pdf_file.name}")
            
            # Validate file type
            if not pdf_file.name.lower().endswith('.pdf'):
                logger.error(f"Invalid file type: {pdf_file.name}")
                return Response(
                    {'error': 'File must be a PDF'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create upload directory if it doesn't exist
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'pdfs')
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate a unique filename
            unique_filename = f"{uuid.uuid4()}_{pdf_file.name}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save the file
            with open(file_path, 'wb+') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)
            
            # Create PDF document record
            pdf_doc = PDFDocument.objects.create(
                title=pdf_file.name,
                file=pdf_file,  # Pass the file object directly
                user=request.user  # Associate with current user
            )
            
            return Response({
                'id': str(pdf_doc.id),
                'title': pdf_doc.title,
                'message': 'PDF uploaded successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error uploading PDF: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to upload PDF'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatView(views.APIView):
    parser_classes = (JSONParser,)
    permission_classes = [IsAuthenticated]

    def get_conversation_chain(self, vectorstore):
        """Get or create a conversation chain"""
        llm = get_llm()  # Use cached LLM
        return ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(
                search_kwargs={"k": 3}  # Limit the number of retrieved documents
            ),
            return_source_documents=True
        )

    def post(self, request):
        logger.info("Received chat request")
        
        if not GOOGLE_API_KEY:
            logger.error("Google API key not configured")
            return Response(
                {'error': 'Google API key not configured'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        message = request.data.get('message')
        pdf_id = request.data.get('pdf_id')
        
        if not message or not pdf_id:
            return Response(
                {'error': 'Message and PDF ID are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Clean the PDF ID string and try to convert to UUID
            pdf_id = pdf_id.strip().replace('"', '').replace("'", '')
            try:
                pdf_uuid = uuid.UUID(pdf_id)
            except ValueError:
                return Response(
                    {'error': 'Invalid PDF ID format'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the specified PDF document
            try:
                pdf_doc = PDFDocument.objects.get(id=pdf_uuid, user=request.user, processed=True)
            except PDFDocument.DoesNotExist:
                return Response(
                    {'error': 'PDF document not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Try to get vectorstore from cache first
            vectorstore = VECTOR_STORE_CACHE.get(str(pdf_doc.id))
            
            if vectorstore is None:
                # Load from disk if not in cache
                store_path = pdf_doc.embedding_store
                if not os.path.exists(store_path):
                    return Response(
                        {'error': 'Vector store not found for this PDF'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                embeddings = get_embeddings()
                vectorstore = FAISS.load_local(store_path, embeddings, allow_dangerous_deserialization=True)
                VECTOR_STORE_CACHE[str(pdf_doc.id)] = vectorstore

            # Get or create conversation chain
            conversation_chain = CONVERSATION_CHAIN_CACHE.get(str(pdf_doc.id))
            if conversation_chain is None:
                conversation_chain = self.get_conversation_chain(vectorstore)
                CONVERSATION_CHAIN_CACHE[str(pdf_doc.id)] = conversation_chain

            # Get chat history from cache or create new
            chat_history_key = f'chat_history_{pdf_doc.id}'
            chat_history = cache.get(chat_history_key) or []

            # Get response from the model
            result = conversation_chain.invoke({
                "question": message,
                "chat_history": chat_history[-5:]  # Only use last 5 messages for context
            })

            # Update chat history in cache
            chat_history.append((message, result['answer']))
            cache.set(chat_history_key, chat_history, timeout=3600)  # Cache for 1 hour

            # Save the conversation
            ChatMessage.objects.create(
                pdf_document=pdf_doc,
                role='user',
                content=message
            )
            ChatMessage.objects.create(
                pdf_document=pdf_doc,
                role='assistant',
                content=result['answer']
            )

            return Response({
                'response': result['answer']
            })

        except Exception as e:
            logger.error(f"Error in chat: {str(e)}", exc_info=True)
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 

class PDFChatMessageView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser,)

    def post(self, request):
        try:
            pdf_id = request.data.get('pdf_id')
            message = request.data.get('message')
            
            if not pdf_id or not message:
                return Response(
                    {'error': 'Both pdf_id and message are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pdf = PDFDocument.objects.get(id=pdf_id, user=request.user)
            
            # Get the PDF content
            file_path = pdf.get_file_path()
            if not file_path or not os.path.exists(file_path):
                return Response(
                    {'error': 'PDF file not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Load and process the PDF
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            text = "\n".join(page.page_content for page in pages)

            # Create a prompt for the chat
            prompt = f"""You are a helpful assistant that answers questions about the following text. 
            Please provide a clear and concise answer based only on the information in the text.
            
            Text:
            {text}
            
            Question: {message}
            
            Answer:"""

            # Get response from the LLM
            llm = get_llm()
            response = llm.invoke(prompt)
            
            return Response({
                'response': response.content
            })

        except PDFDocument.DoesNotExist:
            return Response(
                {'error': 'PDF not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in PDFChatMessageView: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

