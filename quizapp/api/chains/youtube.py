# To run this code you need to install the following dependencies:
# pip install google-generativeai youtube-transcript-api langchain langchain-google-genai faiss-cpu

import os
import logging.handlers
import json
from typing import Dict, List, Any
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types
import numpy as np
import faiss
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Create a formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Set up file handler for general logs
file_handler = logging.handlers.RotatingFileHandler(
    'youtubeupdate.log',
    maxBytes=1024*1024,  # 1MB
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

# Set up file handler for chat logs
chat_handler = logging.handlers.RotatingFileHandler(
    'chat.log',
    maxBytes=1024*1024,  # 1MB
    backupCount=5
)
chat_handler.setLevel(logging.DEBUG)
chat_handler.setFormatter(formatter)

# Set up console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

# Configure root logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.addHandler(file_handler)
logger.addHandler(chat_handler)
logger.addHandler(console_handler)

# Log the start of the application
logger.info("YouTube Content Generator application started")

class YouTubeContentGenerator:
    def __init__(self):
        """Initialize the YouTube Content Generator."""
        try:
            load_dotenv()
            logger.info("Environment variables loaded")
            
            # Configure API key
            self.google_api_key = "AIzaSyBejKrB21e59Ii_NlUr08qSo580z4bclZs"
            if not self.google_api_key:
                logger.error("GOOGLE_API_KEY not found in environment variables")
                raise Exception("GOOGLE_API_KEY not found in environment variables")
            
            # Initialize Gemini client
            self.client = genai.Client(api_key=self.google_api_key)
            self.model = "gemini-2.5-flash-preview-04-17"
            
            # Initialize Langchain components
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=self.google_api_key
            )
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
                separators=["\n\n", "\n", " ", ""]
            )
            
            # Initialize FAISS index
            self.dimension = 768  # dimension of Google's embedding
            self.index = faiss.IndexFlatL2(self.dimension)
            
            # Initialize session state
            self._session_state = {}
            self._video_summaries = {}  # Store video summaries
            self._video_chunks = {}     # Store video content chunks
            
            logger.info("YouTube Content Generator initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize YouTube Content Generator: {str(e)}", exc_info=True)
            raise

    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for a text using Langchain's Google embeddings."""
        try:
            if not text or not isinstance(text, str):
                raise ValueError("Invalid text input for embedding")

            embedding = self.embeddings.embed_query(text)
            if embedding is None or len(embedding) == 0:
                raise ValueError("Empty embedding generated")

            return np.array(embedding)
        except ValueError as ve:
            logger.error(f"Validation error in _get_embedding: {str(ve)}")
            raise
        except Exception as e:
            logger.error(f"Error getting embedding: {str(e)}", exc_info=True)
            raise

    def _store_video_content(self, video_id: str, summary: str):
        """Store video content in FAISS index and cache."""
        try:
            # Split summary into chunks using Langchain
            chunks = self.text_splitter.split_text(summary)
            self._video_chunks[video_id] = chunks
            
            # Get embeddings for chunks
            embeddings = []
            for chunk in chunks:
                embedding = self._get_embedding(chunk)
                embeddings.append(embedding)
            
            # Add to FAISS index
            embeddings_array = np.array(embeddings).astype('float32')
            self.index.add(embeddings_array)
            
            # Store summary
            self._video_summaries[video_id] = summary
            
            logger.info(f"Stored video content for {video_id} in vector database")
            
        except Exception as e:
            logger.error(f"Error storing video content: {str(e)}")
            raise

    def _find_relevant_chunks(self, query: str, video_id: str, k: int = 3) -> List[str]:
        """Find most relevant chunks for a query."""
        try:
            # Input validation
            if not query or not isinstance(query, str):
                raise ValueError("Invalid query format")
            if not video_id or not isinstance(video_id, str):
                raise ValueError("Invalid video ID format")

            # Get query embedding
            query_embedding = self._get_embedding(query)
            if query_embedding is None or len(query_embedding) == 0:
                raise ValueError("Failed to generate query embedding")

            # Search in FAISS index
            distances, indices = self.index.search(
                np.array([query_embedding]).astype('float32'), 
                k
            )
            
            # Get relevant chunks
            chunks = self._video_chunks.get(video_id, [])
            if not chunks:
                logger.warning(f"No chunks found for video {video_id}")
                return []

            relevant_chunks = []
            for idx in indices[0]:
                if idx < len(chunks):
                    relevant_chunks.append(chunks[idx])
            
            logger.debug(f"Found {len(relevant_chunks)} relevant chunks")
            return relevant_chunks
            
        except ValueError as ve:
            logger.error(f"Validation error in _find_relevant_chunks: {str(ve)}")
            return []
        except Exception as e:
            logger.error(f"Error finding relevant chunks: {str(e)}", exc_info=True)
            return []

    def _get_session_key(self, video_id: str, content_type: str) -> str:
        """Generate a unique session key for a video and content type."""
        return f"{video_id}_{content_type}"

    def _get_cached_content(self, video_id: str, content_type: str) -> Dict:
        """Get cached content for a video and content type."""
        session_key = self._get_session_key(video_id, content_type)
        return self._session_state.get(session_key)

    def _cache_content(self, video_id: str, content_type: str, content: Dict):
        """Cache content for a video and content type."""
        session_key = self._get_session_key(video_id, content_type)
        self._session_state[session_key] = content

    def process_video(self, video_id: str, content_type: str) -> Dict[str, Any]:
        """Process a YouTube video and generate content based on type."""
        try:
            logger.info(f"Processing video {video_id} for {content_type}")
            
            # Initialize response
            response = ""
            
            # Get video content
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part(
                            file_data=types.FileData(
                                file_uri=f"https://youtu.be/{video_id}",
                                mime_type="video/*",
                            )
                        ),
                        types.Part.from_text(text=self._get_prompt_for_content_type(content_type)),
                    ],
                ),
            ]
            
            # Generate content
            for chunk in self.client.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type="text/plain"),
            ):
                if chunk and hasattr(chunk, 'text') and chunk.text is not None:
                    response += chunk.text
                else:
                    logger.warning(f"Received empty or invalid chunk: {chunk}")
            
            if not response:
                logger.error("No content generated from video")
                return {
                    'title': 'Error',
                    'content': 'Failed to process video content. Please try again.'
                }
            
            # Parse response based on content type
            if content_type == "quiz":
                return self._parse_quiz_response(response)
            elif content_type == "flashcards":
                return self._parse_flashcards_response(response)
            elif content_type == "notes":
                return self._parse_notes_response(response)
            elif content_type == "chat":
                return {
                    'title': 'Video Chat',
                    'content': response
                }
            else:
                logger.error(f"Invalid content type: {content_type}")
                return {
                    'title': 'Error',
                    'content': f'Invalid content type: {content_type}'
                }
                
        except Exception as e:
            logger.error(f"Error in video processing: {str(e)}", exc_info=True)
            return {
                'title': 'Error',
                'content': f'Failed to process video: {str(e)}'
            }

    def process_video_for_chat(self, video_id: str) -> str:
        """Process video for chat and store content in vector database."""
        try:
            # Check if content is already cached
            if video_id in self._video_summaries:
                logger.info(f"Using cached content for video {video_id}")
                return "Hello! I'm ready to help you understand this video. What would you like to know?"

            # Process the video to get summary
            result = self.process_video(video_id, "chat")
            summary = result['content']
            
            # Store content in vector database
            self._store_video_content(video_id, summary)
            
            return "Hello! I'm ready to help you understand this video. What would you like to know?"
            
        except Exception as e:
            logger.error(f"Error processing video for chat: {str(e)}")
            raise

    def handle_chat_message(self, message: str, video_id: str) -> str:
        """Handle a chat message using vector similarity search."""
        try:
            # Input validation
            if not message or not isinstance(message, str):
                raise ValueError("Invalid message format")
            if not video_id or not isinstance(video_id, str):
                raise ValueError("Invalid video ID format")

            # Check if video content is available
            if video_id not in self._video_summaries:
                logger.warning(f"No content found for video {video_id}")
                return "I'm sorry, but I don't have the video content available. Please process the video first."

            # Find relevant chunks
            relevant_chunks = self._find_relevant_chunks(message, video_id)
            if not relevant_chunks:
                logger.warning(f"No relevant chunks found for query: {message}")
                return "I'm sorry, I couldn't find relevant information in the video to answer your question."

            # Create context from relevant chunks
            context = "\n".join(relevant_chunks)
            logger.debug(f"Found {len(relevant_chunks)} relevant chunks for query")

            # Create prompt with context
            prompt = f"""Based on the following context from the video:

{context}

Please answer this question: {message}

If the question cannot be answered using the provided context, please say so."""

            # Generate response using Gemini
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            ]

            response = ""
            for chunk in self.client.models.generate_content_stream(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type="text/plain"),
            ):
                response += chunk.text

            if not response:
                logger.warning("Empty response from Gemini")
                return "I'm sorry, I couldn't generate a response. Please try again."

            return response.strip()
            
        except ValueError as ve:
            logger.error(f"Validation error in handle_chat_message: {str(ve)}")
            return str(ve)
        except Exception as e:
            logger.error(f"Error handling chat message: {str(e)}", exc_info=True)
            return "I'm sorry, I encountered an error while processing your question. Please try again."

    def _get_prompt_for_content_type(self, content_type: str) -> str:
        """Get the appropriate prompt for the content type."""
        prompts = {
            'quiz': f"""Based on this video, generate a quiz with 5 multiple choice questions.
            Each question should:
            - Test understanding of key concepts from the video
            - Have exactly 4 options
            - Have one correct answer
            - Have plausible but clearly incorrect options

            Format the response as JSON:
            {{
                "questions": [
                    {{
                        "question": "Question text",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Correct option"
                    }}
                ]
            }}""",

            'flashcards': """Based on this video, generate flashcards covering key concepts.
            Each flashcard should:
            - Have a clear, concise front side (question/term)
            - Have a detailed, informative back side (answer/definition)
            - Focus on important concepts and key information
            - Be educational and accurate

            Format the response as JSON:
            {
                "cards": [
                    {
                        "front": "Question or term",
                        "back": "Answer or definition"
                    }
                ]
            }""",

            'notes': """Based on this video, create structured notes.
            Organize the notes into clear sections with titles and content.
            Focus on key concepts, important information, and main points.

            Format the response as JSON:
            {
                "sections": [
                    {
                        "title": "Section Title",
                        "content": "Section Content"
                    }
                ]
            }""",

            'chat': """Based on this video, provide a comprehensive summary.
            Include:
            - Main topics and key points
            - Important concepts and their explanations
            - Any notable examples or demonstrations
            - Key takeaways

            Format the response as a clear, structured text summary. Focus on being informative and educational."""
        }
        
        return prompts.get(content_type, "Provide a summary of this video.")

    def _parse_quiz_response(self, response: str) -> Dict:
        """Parse quiz response into structured format."""
        try:
            # Clean the response to ensure it's valid JSON
            cleaned_response = response.strip()
            if not cleaned_response.startswith('{'):
                start_idx = cleaned_response.find('{')
                if start_idx != -1:
                    cleaned_response = cleaned_response[start_idx:]
            
            if not cleaned_response.endswith('}'):
                end_idx = cleaned_response.rfind('}')
                if end_idx != -1:
                    cleaned_response = cleaned_response[:end_idx + 1]
            
            content_data = json.loads(cleaned_response)
            
            # Validate and format quiz data
            if not isinstance(content_data, dict) or 'questions' not in content_data:
                # Extract questions from raw response if JSON parsing fails
                import re
                questions = re.findall(r'Question[^?]*\?', response)
                options = re.findall(r'[A-D]\)[^A-D\n]*', response)
                answers = re.findall(r'Answer:[^A-D]*([A-D])', response)
                
                if questions and len(options) >= 4:
                    content_data = {
                        'questions': [{
                            'question': questions[0].strip(),
                            'options': [opt.strip()[2:].strip() for opt in options[:4]],
                            'correct_answer': answers[0] if answers else 'A'
                        }]
                    }
                else:
                    content_data = {
                        'questions': [{
                            'question': 'Failed to parse questions',
                            'options': ['A', 'B', 'C', 'D'],
                            'correct_answer': 'A'
                        }]
                    }
            
            return {
                'title': 'Video Quiz',
                'content': content_data
            }
            
        except Exception as e:
            logger.error(f"Error parsing quiz response: {str(e)}", exc_info=True)
            return {
                'title': 'Error',
                'content': {
                    'questions': [{
                        'question': 'Failed to generate quiz',
                        'options': ['A', 'B', 'C', 'D'],
                        'correct_answer': 'A'
                    }]
                }
            }

    def _parse_flashcards_response(self, response: str) -> Dict:
        """Parse flashcards response into structured format."""
        try:
            # Clean and parse JSON response
            cleaned_response = response.strip()
            if not cleaned_response.startswith('{'):
                start_idx = cleaned_response.find('{')
                if start_idx != -1:
                    cleaned_response = cleaned_response[start_idx:]
            
            if not cleaned_response.endswith('}'):
                end_idx = cleaned_response.rfind('}')
                if end_idx != -1:
                    cleaned_response = cleaned_response[:end_idx + 1]
            
            content_data = json.loads(cleaned_response)
            
            # Validate and format flashcard data
            if not isinstance(content_data, dict) or 'cards' not in content_data:
                # Extract cards from raw response if JSON parsing fails
                import re
                cards = re.findall(r'Front:[^B]*Back:[^F]*', response)
                if cards:
                    content_data = {
                        'cards': [{
                            'front': card.split('Back:')[0].replace('Front:', '').strip(),
                            'back': card.split('Back:')[1].strip()
                        } for card in cards]
                    }
                else:
                    content_data = {'cards': []}
            
            return {
                'title': 'Video Flashcards',
                'content': content_data
            }
            
        except Exception as e:
            logger.error(f"Error parsing flashcards response: {str(e)}", exc_info=True)
            return {
                'title': 'Error',
                'content': {'cards': []}
            }

    def _parse_notes_response(self, response: str) -> Dict:
        """Parse notes response into structured format."""
        try:
            # Clean and parse JSON response
            cleaned_response = response.strip()
            if not cleaned_response.startswith('{'):
                start_idx = cleaned_response.find('{')
                if start_idx != -1:
                    cleaned_response = cleaned_response[start_idx:]
            
            if not cleaned_response.endswith('}'):
                end_idx = cleaned_response.rfind('}')
                if end_idx != -1:
                    cleaned_response = cleaned_response[:end_idx + 1]
            
            content_data = json.loads(cleaned_response)
            
            # Validate and format notes data
            if not isinstance(content_data, dict) or 'sections' not in content_data:
                # Extract sections from raw response if JSON parsing fails
                import re
                sections = re.findall(r'Section:[^S]*', response)
                if sections:
                    content_data = {
                        'sections': [{
                            'title': section.split('\n')[0].replace('Section:', '').strip(),
                            'content': '\n'.join(section.split('\n')[1:]).strip()
                        } for section in sections]
                    }
                else:
                    content_data = {'sections': []}
            
            return {
                'title': 'Video Notes',
                'content': content_data
            }
            
        except Exception as e:
            logger.error(f"Error parsing notes response: {str(e)}", exc_info=True)
            return {
                'title': 'Error',
                'content': {'sections': []}
            }

def generate(video_id: str, content_type: str, num_questions: int = 5, num_flashcards: int = 5):
    """Generate content based on video ID and content type."""
    try:
        logger.info(f"Generating content for video {video_id} with type {content_type}")
        generator = YouTubeContentGenerator()
        
        if content_type == "quiz":
            return generator.process_video(video_id, "quiz")
        elif content_type == "flashcards":
            return generator.process_video(video_id, "flashcards")
        elif content_type == "notes":
            return generator.process_video(video_id, "notes")
        elif content_type == "chat":
            return generator.process_video(video_id, "chat")
        else:
            logger.error(f"Unsupported content type: {content_type}")
            raise ValueError(f"Unsupported content type: {content_type}")
            
    except Exception as e:
        logger.error(f"Error in generate: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }

if __name__ == "__main__":
    # Example usage
    result = generate("Gfr50f6ZBvo", "quiz")
    print(json.dumps(result, indent=2))
