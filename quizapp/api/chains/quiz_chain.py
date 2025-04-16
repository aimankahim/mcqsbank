from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from ..models.pydantic_models import Quiz
from .base import BaseChain

class QuizChain(BaseChain):
    @classmethod
    def create(cls):
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
        return quiz_prompt | cls.get_llm() | quiz_parser 