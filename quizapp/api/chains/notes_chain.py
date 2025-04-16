from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from ..models.pydantic_models import ConsiseNotes
from .base import BaseChain

class NotesChain(BaseChain):
    @classmethod
    def create(cls):
        notes_parser = PydanticOutputParser(pydantic_object=ConsiseNotes)
        notes_prompt = PromptTemplate(
            template="takes the input text {text} and make the concise notes from the text {format_instructions}",
            input_variables=["text"],
            partial_variables={"format_instructions": notes_parser.get_format_instructions()}
        )
        return notes_prompt | cls.get_llm() | notes_parser 