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
from api.models.quiz_models import QuizModel, QuizQuestion as QuizQuestionModel, Flashcard as FlashcardModel, ConciseNote
from api.models.chat_models import PDFDocument
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from datetime import timedelta

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
                temperature=0.7,  # Increased temperature for better language adaptation
                google_api_key=GOOGLE_API_KEY,
                convert_system_message_to_human=True,
                max_output_tokens=2048,  # Increased token limit for longer responses
                top_p=0.95,  # Increased top_p for more diverse language generation
                top_k=40  # Increased top_k for better language selection
            )
        except Exception as e:
            print(f"Error initializing Gemini: {str(e)}")
            raise
    
    def validate_request(self, request_data):
        serializer = PDFInputSerializer(data=request_data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data
    
    def extract_text_from_pdf(self, pdf_id):
        try:
            # Get the PDF document from the database, ensuring it belongs to the current user
            pdf = PDFDocument.objects.get(id=pdf_id, user=self.request.user)
            if not pdf.file:
                raise FileNotFoundError("PDF file not found in database")
            
            # Get the absolute path of the file
            file_path = pdf.get_file_path()
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
        except PDFDocument.DoesNotExist:
            raise FileNotFoundError(f"PDF document with ID {pdf_id} not found or you don't have permission to access it")
        except Exception as e:
            print(f"Error in extract_text_from_pdf: {str(e)}")
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
                
                # Different prompts for different quiz types
                prompts = {
                    'multiple_choice': """You are a professional translator and quiz creator. Your task is to create a multiple choice quiz in {language} language from the following text.

IMPORTANT: You MUST create the ENTIRE quiz (questions, options, and answers) in {language} language ONLY.

Requirements:
- Create exactly {num_questions} questions
- Each question must be in {language} language
- Each question should test understanding of key concepts
- Provide exactly 4 options per question in {language} language
- One option must be the correct answer
- Other options should be plausible but clearly incorrect
- Make the questions {difficulty} difficulty level
- ALL content MUST be in {language} language
- Ensure proper grammar and natural language flow in {language}
- If {language} is not English, provide culturally appropriate examples

Text to create quiz from:
{text}

{format_instructions}""",

                    'true_false': """You are a professional translator and quiz creator. Your task is to create a true/false quiz in {language} language from the following text.

IMPORTANT: You MUST create the ENTIRE quiz (questions, options, and answers) in {language} language ONLY.

Requirements:
- Create exactly {num_questions} questions
- Each statement must be in {language} language
- Each statement should be clear and unambiguous
- The statement should be either definitely true or definitely false
- Make the questions {difficulty} difficulty level
- Options should be exactly ["True", "False"] in {language} language
- ALL content must be in {language} language

Text to create quiz from:
{text}

{format_instructions}""",

                    'fill_in_blank': """You are a professional translator and quiz creator. Your task is to create a fill-in-the-blank quiz in {language} language from the following text.

IMPORTANT: You MUST create the ENTIRE quiz (questions, options, and answers) in {language} language ONLY.

Requirements:
- Create exactly {num_questions} questions
- Each question must be in {language} language
- Each question should have a blank space (_____) for the answer
- The blank should be for a specific, important term or concept
- Provide possible answers including the correct one in {language} language
- Make the questions {difficulty} difficulty level
- ALL content must be in {language} language

Text to create quiz from:
{text}

{format_instructions}""",

                    'matching': """You are a professional translator and quiz creator. Your task is to create a matching quiz in {language} language from the following text.

IMPORTANT: You MUST create the ENTIRE quiz (questions, options, and answers) in {language} language ONLY.

Requirements:
- Create exactly {num_questions} questions
- Each term and definition must be in {language} language
- Each term should be clear and specific
- Provide a list of possible matches in {language} language
- One match should be the correct answer
- Make the questions {difficulty} difficulty level
- ALL content must be in {language} language

Text to create quiz from:
{text}

{format_instructions}""",

                    'mixed': """You are a professional translator and quiz creator. Your task is to create a mixed quiz in {language} language from the following text.

IMPORTANT: You MUST create the ENTIRE quiz (questions, options, and answers) in {language} language ONLY.

Requirements:
- Create exactly {num_questions} questions
- Distribute questions evenly among different types
- Each question must be in {language} language
- Each question should be clear and focused
- Make the questions {difficulty} difficulty level
- ALL content must be in {language} language
- Include a 'type' field for each question indicating its format

Text to create quiz from:
{text}

{format_instructions}"""
                }

                def get_quiz_prompt(quiz_type='multiple_choice'):
                    return PromptTemplate(
                        template=prompts.get(quiz_type, prompts['multiple_choice']),
                        input_variables=["text", "num_questions", "difficulty", "language"],
                        partial_variables={"format_instructions": quiz_parser.get_format_instructions()}
                    )

                return get_quiz_prompt
                
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
            print(f"Quiz data type: {type(quiz_data)}")
            print(f"Quiz data: {quiz_data}")
            
            # Create the quiz with all required fields
            quiz = QuizModel.objects.create(
                title=f"Quiz generated from PDF",
                description="Automatically generated quiz",
                user=user,
                quiz_type="multiple_choice",
                difficulty="medium",
                language="English"
            )
            
            # Create questions using the Pydantic model's questions attribute
            for q_data in quiz_data.questions:
                print(f"Creating question: {q_data}")
                question = QuizQuestionModel.objects.create(
                    quiz=quiz,
                    question=q_data.question,
                    correct_answer=q_data.correct_answer,
                    options=q_data.options
                )
                print(f"Created question with ID: {question.id}")
            
            return quiz
        except Exception as e:
            print(f"Error saving quiz: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            # If quiz was created but questions failed, delete the quiz
            if 'quiz' in locals():
                quiz.delete()
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

    def translate_quiz_content(self, quiz_data, target_language):
        try:
            print(f"Starting translation to {target_language}")
            print(f"Original quiz data: {quiz_data.dict()}")
            
            translation_prompt = PromptTemplate(
                template="""You are a professional translator. Your task is to translate the following quiz content to {target_language}.
The input is a JSON object containing quiz questions, options, and answers. Translate ONLY the text content while keeping the JSON structure intact.

Original quiz content:
{quiz_content}

Requirements:
- Translate ALL text content to {target_language}
- Keep the JSON structure and format exactly the same
- Translate questions, options, and answers
- Ensure natural language flow in {target_language}
- Do not modify any JSON keys or structure
- Preserve the exact same number of questions and options

Example format to maintain:
{
    "questions": [
        {
            "question": "Translated question here",
            "options": ["Translated option 1", "Translated option 2", "Translated option 3", "Translated option 4"],
            "correct_answer": "Translated correct answer"
        }
    ]
}

{format_instructions}""",
                input_variables=["quiz_content", "target_language"],
                partial_variables={"format_instructions": PydanticOutputParser(pydantic_object=Quiz).get_format_instructions()}
            )
            
            translation_chain = translation_prompt | self.llm | PydanticOutputParser(pydantic_object=Quiz)
            translated_quiz = translation_chain.invoke({
                "quiz_content": quiz_data.dict(),
                "target_language": target_language
            })
            
            print(f"Translated quiz data: {translated_quiz.dict()}")
            return translated_quiz
        except Exception as e:
            print(f"Error in translation: {str(e)}")
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
            # Get the mode from request data
            mode = request.data.get('mode')
            print(f"Processing request for mode: {mode}")
            print(f"Request data: {request.data}")
            
            # Get language directly from request data first
            target_language = request.data.get('language', 'English')
            print(f"Language from request data: {target_language}")
            
            # Validate the request data
            serializer = PDFInputSerializer(data=request.data)
            if not serializer.is_valid():
                print(f"Invalid request data: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = serializer.validated_data
            print(f"Validated data: {validated_data}")
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(validated_data["pdf_id"])
            if not text:
                return Response(
                    {"error": "Could not extract text from PDF"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Setup the appropriate chain based on mode
            chain = self.setup_chain_for_mode(mode)
            if not chain:
                return Response(
                    {"error": f"Invalid mode: {mode}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Prepare input data based on mode
            if mode == "generate-flashcards":
                input_data = {
                    "text": text,
                    "num_flashcards": validated_data.get("num_items", 5)
                }
                result = self.run_chain(chain, input_data)
                saved_flashcards = self.save_flashcards(result, request.user)
                result_dict = result.dict()
                result_dict['ids'] = [fc.id for fc in saved_flashcards]
                return Response(result_dict, status=status.HTTP_200_OK)
            elif mode == "generate-quiz":
                quiz_type = validated_data.get("quiz_type", "multiple_choice")
                
                # Use the language from request data
                print(f"Using target language: {target_language}")
                
                # Get the appropriate prompt for the quiz type
                prompt = chain(quiz_type)
                chain = prompt | self.llm | PydanticOutputParser(pydantic_object=Quiz)
                
                # Prepare input data with the target language
                input_data = {
                    "text": text,
                    "num_questions": validated_data.get("num_items", 5),
                    "difficulty": validated_data.get("difficulty", "medium"),
                    "language": target_language
                }
                
                print(f"Input data for quiz generation: {input_data}")
                
                # Generate quiz in requested language
                result = self.run_chain(chain, input_data)
                print(f"Generated quiz in {target_language}: {result.dict()}")
                
                # Save the quiz with the correct language
                saved_quiz = self.save_quiz(result, request.user)
                result_dict = result.dict()
                result_dict['id'] = saved_quiz.id
                result_dict['content'] = {
                    'questions': result_dict['questions'],
                    'quiz_type': quiz_type,
                    'language': target_language
                }
                return Response(result_dict, status=status.HTTP_200_OK)
            elif mode == "generate-notes":
                input_data = {
                    "text": text
                }
                result = self.run_chain(chain, input_data)
                saved_note = self.save_notes(result, request.user)
                result_dict = result.dict()
                result_dict['id'] = saved_note.id
                return Response(result_dict, status=status.HTTP_200_OK)
            
            return Response(
                {"error": f"Invalid mode: {mode}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            print(f"Error in post: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_learning_activity(request):
    user = request.user
    today = timezone.now().date()
    data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        pdfs_count = PDFDocument.objects.filter(user=user, uploaded_at__date=day).count()
        flashcards_count = FlashcardModel.objects.filter(user=user, created_at__date=day).count()
        quizzes_count = QuizModel.objects.filter(user=user, created_at__date=day).count()
        data.append({
            'date': day.strftime('%b %d'),
            'pdfs': pdfs_count,
            'flashcards': flashcards_count,
            'quizzes': quizzes_count
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_quizzes(request):
    try:
        # Get the 5 most recent quizzes for the user
        recent_quizzes = QuizModel.objects.filter(
            user=request.user
        ).order_by('-created_at')[:5]
        
        # Prepare the response data
        quiz_data = []
        for quiz in recent_quizzes:
            # Get the questions for this quiz
            questions = QuizQuestionModel.objects.filter(quiz=quiz)
            question_data = []
            for question in questions:
                question_data.append({
                    'id': question.id,
                    'question': question.question,
                    'options': question.options,
                    'correct_answer': question.correct_answer
                })
            
            quiz_data.append({
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'quiz_type': quiz.quiz_type,
                'difficulty': quiz.difficulty,
                'language': quiz.language,
                'created_at': quiz.created_at,
                'content': {
                    'questions': question_data,
                    'quiz_type': quiz.quiz_type,
                    'difficulty': quiz.difficulty,
                    'language': quiz.language
                }
            })
        
        return Response(quiz_data)
    except Exception as e:
        print(f"Error in get_recent_quizzes: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_flashcards(request):
    try:
        # Get the 5 most recent flashcards for the user
        recent_flashcards = FlashcardModel.objects.filter(
            user=request.user
        ).order_by('-created_at')[:5]
        
        serializer = FlashcardResponseSerializer(recent_flashcards, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_total_counts(request):
    try:
        total_quizzes = QuizModel.objects.filter(user=request.user).count()
        total_flashcards = FlashcardModel.objects.filter(user=request.user).count()
        
        return Response({
            'total_quizzes': total_quizzes,
            'total_flashcards': total_flashcards
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_detail(request, quiz_id):
    try:
        # Get the quiz and ensure it belongs to the current user
        quiz = QuizModel.objects.get(id=quiz_id, user=request.user)
        
        # Get the questions for this quiz
        questions = QuizQuestionModel.objects.filter(quiz=quiz)
        question_data = []
        for question in questions:
            question_data.append({
                'id': question.id,
                'question': question.question,
                'options': question.options,
                'correct_answer': question.correct_answer
            })
        
        # Prepare the response data
        quiz_data = {
            'id': quiz.id,
            'title': quiz.title,
            'description': quiz.description,
            'quiz_type': quiz.quiz_type,
            'difficulty': quiz.difficulty,
            'language': quiz.language,
            'created_at': quiz.created_at,
            'questions': question_data
        }
        
        return Response(quiz_data)
    except QuizModel.DoesNotExist:
        return Response(
            {"error": "Quiz not found or you don't have permission to access it"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error in get_quiz_detail: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_flashcard_detail(request, flashcard_id):
    try:
        # Get the 5 most recent flashcards for the user
        recent_flashcards = FlashcardModel.objects.filter(
            user=request.user
        ).order_by('-created_at')[:5]
        
        # Prepare the response data
        flashcard_data = {
            'flashcards': [
                {
                    'id': flashcard.id,
                    'title': flashcard.title,
                    'front_content': flashcard.front_content,
                    'back_content': flashcard.back_content,
                    'created_at': flashcard.created_at
                }
                for flashcard in recent_flashcards
            ]
        }
        
        return Response(flashcard_data)
    except Exception as e:
        print(f"Error in get_flashcard_detail: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 