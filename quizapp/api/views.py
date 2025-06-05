from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from langchain_google_genai import ChatGoogleGenerativeAI
import uuid
import os
from django.conf import settings
from langchain_community.document_loaders import PyPDFLoader
from .serializers import (
    PDFUploadSerializer,
    PDFInputSerializer,
    QuizResponseSerializer, 
    FlashcardResponseSerializer,
    NotesResponseSerializer,
    QuizSerializer,
    QuizQuestionSerializer,
    FlashcardSerializer,
    ConciseNoteSerializer,
    PDFSerializer
)
from .models.chat_models import PDFDocument, ChatMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from langchain.schema.runnable import RunnableBranch, RunnablePassthrough
from dotenv import load_dotenv
import asyncio
import logging
import re
from rest_framework.permissions import IsAuthenticated
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import io
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from .models import Quiz, QuizQuestion, Flashcard, ConciseNote, PDF

load_dotenv()

logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(settings.BASE_DIR, 'uploads')
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Pydantic models and LangChain setup
class ConsiseNotes(BaseModel):
    notes: str = Field(description="the concise notes from the text")

class QuizQuestion(BaseModel):
    question: str = Field(description="The quiz question")
    options: list[str] = Field(description="List of 4 options for the question")
    correct_answer: str = Field(description="The correct answer for the question")

class Quiz(BaseModel):
    questions: list[QuizQuestion] = Field(description="List of quiz questions with their options and answers")

class FlashcardItem(BaseModel):
    question: str = Field(description="The flashcard question")
    answer: str = Field(description="The flashcard answer")

class Flashcard(BaseModel):
    flashcards: list[FlashcardItem] = Field(description="List of flashcards with questions and answers")

class PDFUploadView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=PDFUploadSerializer,
        responses={
            200: 'PDF uploaded successfully',
            400: 'Bad Request',
            500: 'Internal Server Error'
        }
    )
    def post(self, request):
        try:
            file = request.FILES['file']
            if not file.name.endswith('.pdf'):
                return Response(
                    {"error": "File must be a PDF"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate unique ID for the PDF
            pdf_id = str(uuid.uuid4())
            file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
            
            # Save the file
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            return Response({"pdf_id": pdf_id}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LearningAPIView(APIView):

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        # other params...
    )    # llm = ChatOpenAI(model="gpt-4", temperature=0)
    
    async def extract_text_from_pdf(self, pdf_id):
        file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
        if not os.path.exists(file_path):
            raise FileNotFoundError("PDF file not found")
        
        loader = PyPDFLoader(file_path)
        pages = []
        async for page in loader.alazy_load():
            pages.append(page)
        
        # Combine all page contents
        text = "\n".join(page.page_content for page in pages)
        return text
    
    def setup_chains(self):
        # Notes chain
        notes_parser = PydanticOutputParser(pydantic_object=ConsiseNotes)
        notes_prompt = PromptTemplate(
            template="takes the input text {text} and make the concise notes from the text {format_instructions}",
            input_variables=["text"],
            partial_variables={"format_instructions": notes_parser.get_format_instructions()}
        )
        
        # Quiz chain
        quiz_parser = PydanticOutputParser(pydantic_object=Quiz)
        quiz_prompt = PromptTemplate(
            template="""Create a quiz from the following text with {num_questions} multiple choice questions.
Your response should be a JSON object with a list of questions, where each question has:
- A question field with the question text
- An options field with an array of exactly 4 possible answers
- A correct_answer field with the correct answer

Make the questions {difficulty} difficulty level.

Text to create quiz from:
{text}

{format_instructions}""",
            input_variables=["text", "num_questions", "difficulty"],
            partial_variables={"format_instructions": quiz_parser.get_format_instructions()}
        )
        
        # Flashcard chain
        flashcard_parser = PydanticOutputParser(pydantic_object=Flashcard)
        flashcard_prompt = PromptTemplate(
            template="""Create {num_flashcards} flashcards from the following text.
Your response should be a JSON object with a list of flashcards, where each flashcard has:
- A question field with the question text
- An answer field with the answer text

Text to create flashcards from:
{text}

{format_instructions}""",
            input_variables=["text", "num_flashcards"],
            partial_variables={"format_instructions": flashcard_parser.get_format_instructions()}
        )
        
        def default_chain(x):
            return {"error": "Invalid mode. Please use 'notes', 'quizz', or 'flashcard'."}
        
        return RunnableBranch(
            (lambda x: x["mode"] == "notes", notes_prompt | self.llm | notes_parser),
            (lambda x: x["mode"] == "quizz", quiz_prompt | self.llm | quiz_parser),
            (lambda x: x["mode"] == "flashcard", flashcard_prompt | self.llm | flashcard_parser),
            default_chain
        )

    @swagger_auto_schema(
        request_body=PDFInputSerializer,
        responses={
            200: {
                'notes': NotesResponseSerializer,
                'quizz': QuizResponseSerializer,
                'flashcard': FlashcardResponseSerializer
            },
            400: 'Bad Request',
            500: 'Internal Server Error'
        }
    )
    async def post(self, request):
        serializer = PDFInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Extract text from PDF
            text = await self.extract_text_from_pdf(serializer.validated_data["pdf_id"])
            
            chain = self.setup_chains()
            input_data = {
                "mode": request.path.strip('/').split('/')[-1],  # Get mode from URL
                "text": text,
            }
            
            if input_data["mode"] == "quizz":
                input_data.update({
                    "num_questions": serializer.validated_data.get("num_items", 5),
                    "difficulty": serializer.validated_data.get("difficulty", "medium")
                })
            elif input_data["mode"] == "flashcard":
                input_data.update({
                    "num_flashcards": serializer.validated_data.get("num_items", 5)
                })
            
            result = chain.invoke(input_data)
            if isinstance(result, dict) and "error" in result:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            return Response(result.dict(), status=status.HTTP_200_OK)
            
        except FileNotFoundError:
            return Response(
                {"error": "PDF file not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatView(APIView):
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0.7,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )

    @swagger_auto_schema(
        request_body=PDFUploadSerializer,
        responses={
            200: 'Chat response',
            400: 'Bad Request',
            404: 'PDF not found',
            500: 'Internal Server Error'
        }
    )
    def post(self, request):
        try:
            message = request.data.get('message')
            pdf_id = request.data.get('pdf_id')
            
            if not message or not pdf_id:
                return Response(
                    {"error": "Both message and pdf_id are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the PDF document
            try:
                pdf_doc = PDFDocument.objects.get(id=pdf_id)
            except PDFDocument.DoesNotExist:
                return Response(
                    {"error": "PDF document not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Save user message
            ChatMessage.objects.create(
                pdf_document=pdf_doc,
                role='user',
                content=message
            )
            
            # Generate response using the LLM
            try:
                response = self.llm.invoke(message)
                assistant_message = response.content
            except Exception as e:
                return Response(
                    {"error": f"Error generating response: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Save assistant message
            ChatMessage.objects.create(
                pdf_document=pdf_doc,
                role='assistant',
                content=assistant_message
            )
            
            return Response({
                "response": assistant_message
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Quiz views
class QuizListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        quizzes = Quiz.objects.filter(user=request.user)
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk, user=request.user)
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)

class QuizCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QuizSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk, user=request.user)
        serializer = QuizSerializer(quiz, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk, user=request.user)
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Quiz Question views
class QuizQuestionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, pk=quiz_id, user=request.user)
        serializer = QuizQuestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(quiz=quiz)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizQuestionUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        question = get_object_or_404(QuizQuestion, pk=pk, quiz__user=request.user)
        serializer = QuizQuestionSerializer(question, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuizQuestionDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        question = get_object_or_404(QuizQuestion, pk=pk, quiz__user=request.user)
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Flashcard views
class FlashcardListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flashcards = Flashcard.objects.filter(user=request.user)
        serializer = FlashcardSerializer(flashcards, many=True)
        return Response(serializer.data)

class FlashcardCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FlashcardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FlashcardUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        flashcard = get_object_or_404(Flashcard, pk=pk, user=request.user)
        serializer = FlashcardSerializer(flashcard, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FlashcardDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        flashcard = get_object_or_404(Flashcard, pk=pk, user=request.user)
        flashcard.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Concise Note views
class ConciseNoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = ConciseNote.objects.filter(user=request.user)
        serializer = ConciseNoteSerializer(notes, many=True)
        return Response(serializer.data)

class ConciseNoteCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConciseNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConciseNoteUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        note = get_object_or_404(ConciseNote, pk=pk, user=request.user)
        serializer = ConciseNoteSerializer(note, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConciseNoteDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        note = get_object_or_404(ConciseNote, pk=pk, user=request.user)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# PDF views
class PDFListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pdfs = PDF.objects.filter(user=request.user)
        serializer = PDFSerializer(pdfs, many=True)
        return Response(serializer.data)

class PDFUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PDFSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PDFDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        pdf = get_object_or_404(PDF, pk=pk, user=request.user)
        pdf.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class PDFProcessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            pdf_id = request.data.get('pdf_id')
            pdf = get_object_or_404(PDF, pk=pdf_id, user=request.user)
            # Process PDF logic here
            return Response({'status': 'success'})
        except Exception as e:
            logger.error(f"Error in PDFProcessView: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PDFChatMessageView(APIView):
    permission_classes = [IsAuthenticated]
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )

    def post(self, request):
        try:
            pdf_id = request.data.get('pdf_id')
            message = request.data.get('message')
            
            if not pdf_id or not message:
                return Response(
                    {'error': 'Both pdf_id and message are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pdf = get_object_or_404(PDF, pk=pdf_id, user=request.user)
            
            # Get the PDF content
            file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
            if not os.path.exists(file_path):
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
            response = self.llm.invoke(prompt)
            
            return Response({
                'response': response.content
            })

        except Exception as e:
            logger.error(f"Error in PDFChatMessageView: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def pdf_history(request):
    # Get all PDF content for the current user
    content = PDF.objects.filter(user=request.user)
    serializer = PDFSerializer(content, many=True)
    return Response(serializer.data)
