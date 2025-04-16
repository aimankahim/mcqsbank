from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from ..models.pydantic_models import Flashcard
from .base import BaseChain

class FlashcardChain(BaseChain):
    @classmethod
    def create(cls):
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
        return flashcard_prompt | cls.get_llm() | flashcard_parser 