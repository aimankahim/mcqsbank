from pydantic import BaseModel, Field

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