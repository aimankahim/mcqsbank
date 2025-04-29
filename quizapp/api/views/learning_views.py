from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
import os
from django.conf import settings
from langchain_community.document_loaders import PyPDFLoader
from ..serializers import (
    PDFInputSerializer,
    QuizResponseSerializer, 
    FlashcardResponseSerializer,
    NotesResponseSerializer
)
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from langchain.schema.runnable import RunnableBranch, RunnablePassthrough
from dotenv import load_dotenv
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
import google.generativeai as genai
from api.models.quiz_models import Quiz as QuizModel, QuizQuestion as QuizQuestionModel, Flashcard as FlashcardModel, ConciseNote
from django.utils import timezone

load_dotenv()

# Configure Google Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set")

genai.configure(api_key=GOOGLE_API_KEY)

# Use the same UPLOAD_DIR as pdf_views
UPLOAD_DIR = os.path.join(settings.BASE_DIR, 'uploads')

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

class LearningAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",  # Using gemini-2.0-flash model
                temperature=0,
                google_api_key=GOOGLE_API_KEY,
                convert_system_message_to_human=True
            )
        except Exception as e:
            print(f"Error initializing Gemini: {str(e)}")
            raise
    
    def validate_request(self, request_data):
        serializer = PDFInputSerializer(data=request_data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data
    
    def extract_text_from_pdf(self, pdf_id):
        file_path = os.path.join(UPLOAD_DIR, f"{pdf_id}.pdf")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at path: {file_path}")
        
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            
            # Combine all page contents
            text = "\n".join(page.page_content for page in pages)
            if not text.strip():
                raise ValueError("PDF appears to be empty or contains no extractable text")
            return text
        except Exception as e:
            print(f"Error extracting PDF text: {str(e)}")
            raise
    
    def setup_chain_for_mode(self, mode):
        try:
            if mode == "generate-notes":
                notes_parser = PydanticOutputParser(pydantic_object=ConsiseNotes)
                notes_prompt = PromptTemplate(
                    template="Create concise and well-organized notes from the following text. Focus on key concepts and important details:\n\n{text}\n\n{format_instructions}",
                    input_variables=["text"],
                    partial_variables={"format_instructions": notes_parser.get_format_instructions()}
                )
                return notes_prompt | self.llm | notes_parser
                
            elif mode == "generate-quiz":
                quiz_parser = PydanticOutputParser(pydantic_object=Quiz)
                quiz_prompt = PromptTemplate(
                    template="""Create a quiz from the following text with {num_questions} multiple choice questions.
Each question should test understanding of key concepts from the text.

Requirements:
- Each question should be clear and focused
- Provide exactly 4 options per question
- One option must be the correct answer
- Other options should be plausible but clearly incorrect
- Make the questions {difficulty} difficulty level

Text to create quiz from:
{text}

{format_instructions}""",
                    input_variables=["text", "num_questions", "difficulty"],
                    partial_variables={"format_instructions": quiz_parser.get_format_instructions()}
                )
                return quiz_prompt | self.llm | quiz_parser
                
            elif mode == "generate-flashcards":
                flashcard_parser = PydanticOutputParser(pydantic_object=Flashcard)
                flashcard_prompt = PromptTemplate(
                    template="""Create {num_flashcards} flashcards from the following text.
Each flashcard should:
- Focus on a key concept or important detail
- Have a clear, specific question
- Have a concise but complete answer
- Help test and reinforce understanding

Text to create flashcards from:
{text}

{format_instructions}""",
                    input_variables=["text", "num_flashcards"],
                    partial_variables={"format_instructions": flashcard_parser.get_format_instructions()}
                )
                return flashcard_prompt | self.llm | flashcard_parser
            
            else:
                raise ValueError(f"Invalid mode: {mode}")
                
        except Exception as e:
            print(f"Error setting up chain: {str(e)}")
            raise

    def run_chain(self, chain, input_data):
        try:
            return chain.invoke(input_data)
        except Exception as e:
            print(f"Error running chain: {str(e)}")
            raise

    def save_quiz(self, quiz_data, user):
        try:
            # Create the quiz
            quiz = QuizModel.objects.create(
                title=f"Quiz generated from PDF",
                description="Automatically generated quiz",
                user=user
            )
            
            # Create questions
            for q_data in quiz_data.questions:
                QuizQuestionModel.objects.create(
                    quiz=quiz,
                    question=q_data.question,
                    correct_answer=q_data.correct_answer,
                    options=q_data.options
                )
            return quiz
        except Exception as e:
            print(f"Error saving quiz: {str(e)}")
            raise

    def save_flashcards(self, flashcard_data, user):
        try:
            saved_flashcards = []
            for fc_data in flashcard_data.flashcards:
                flashcard = FlashcardModel.objects.create(
                    title=f"Flashcard: {fc_data.question[:30]}...",
                    front_content=fc_data.question,
                    back_content=fc_data.answer,
                    user=user
                )
                saved_flashcards.append(flashcard)
            return saved_flashcards
        except Exception as e:
            print(f"Error saving flashcards: {str(e)}")
            raise

    def save_notes(self, notes_data, user):
        try:
            note = ConciseNote.objects.create(
                title=f"Notes generated on {timezone.now().strftime('%Y-%m-%d %H:%M')}",
                content=notes_data.notes,
                user=user
            )
            return note
        except Exception as e:
            print(f"Error saving notes: {str(e)}")
            raise

    @swagger_auto_schema(
        request_body=PDFInputSerializer,
        responses={
            200: {
                'notes': NotesResponseSerializer,
                'quiz': QuizResponseSerializer,
                'flashcard': FlashcardResponseSerializer
            },
            400: 'Bad Request',
            500: 'Internal Server Error'
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            print(f"Received request data: {request.data}")
            
            # Validate request data
            validated_data = self.validate_request(request.data)
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(validated_data["pdf_id"])
            print(f"Successfully extracted text from PDF, length: {len(text)}")
            
            # Get mode from URL path and validate it
            path_parts = request.path.strip('/').split('/')
            mode = path_parts[-1] if path_parts else ''
            if not mode:
                raise ValueError("Mode not specified in URL")
            print(f"Processing mode: {mode}")
            
            # Set up input data based on mode
            input_data = {"text": text}
            
            if mode == "generate-quiz":
                input_data.update({
                    "num_questions": validated_data.get("num_items", 5),
                    "difficulty": validated_data.get("difficulty", "medium")
                })
            elif mode == "generate-flashcards":
                input_data.update({
                    "num_flashcards": validated_data.get("num_items", 5)
                })
            
            # Get the appropriate chain for the mode
            chain = self.setup_chain_for_mode(mode)
            
            print(f"Invoking chain with input data: {input_data}")
            result = self.run_chain(chain, input_data)
            print(f"Chain result: {result}")
            
            # Save the generated content to the database
            if mode == "generate-quiz":
                saved_quiz = self.save_quiz(result, request.user)
                result_dict = result.dict()
                result_dict['id'] = saved_quiz.id
                return Response(result_dict, status=status.HTTP_200_OK)
            elif mode == "generate-flashcards":
                saved_flashcards = self.save_flashcards(result, request.user)
                result_dict = result.dict()
                result_dict['ids'] = [fc.id for fc in saved_flashcards]
                return Response(result_dict, status=status.HTTP_200_OK)
            elif mode == "generate-notes":
                saved_note = self.save_notes(result, request.user)
                result_dict = result.dict()
                result_dict['id'] = saved_note.id
                return Response(result_dict, status=status.HTTP_200_OK)
            
            if isinstance(result, dict) and "error" in result:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
            if hasattr(result, 'dict'):
                return Response(result.dict(), status=status.HTTP_200_OK)
            return Response(result, status=status.HTTP_200_OK)
            
        except FileNotFoundError as e:
            print(f"FileNotFoundError: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            print(f"ValueError: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            print(f"Error processing request: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 