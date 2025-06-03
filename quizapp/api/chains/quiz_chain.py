from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from ..models.pydantic_models import Quiz
from .base import BaseChain

class QuizChain(BaseChain):
    @classmethod
    def create(cls):
        quiz_parser = PydanticOutputParser(pydantic_object=Quiz)
        
        # Different prompts for different quiz types
        prompts = {
            'multiple_choice': """Create a multiple choice quiz from the following text with {num_questions} questions.
Your response should be a JSON object with a list of questions, where each question has:
- A question field with the question text
- An options field with an array of exactly 4 possible answers
- A correct_answer field with the correct answer

Make the questions {difficulty} difficulty level.
Use {language} language.

Text to create quiz from:
{text}

{format_instructions}""",

            'true_false': """Create a true/false quiz from the following text with {num_questions} questions.
Your response MUST be a JSON object with a list of questions, where each question MUST follow this EXACT format:
{
  "questions": [
    {
      "question": "Hamza is an AI engineer?",  // MUST be a simple statement ending with a question mark
      "options": ["true", "false"],  // MUST be exactly these two options in lowercase
      "correct_answer": "true"  // MUST be either "true" or "false" in lowercase
    }
  ]
}

CRITICAL RULES:
1. ALWAYS end each question with a question mark
2. ALWAYS use lowercase "true" and "false" as options
3. ALWAYS use lowercase "true" or "false" as correct_answer
4. Keep questions short and direct
5. Make questions clear and unambiguous
6. NEVER use multiple choice format
7. NEVER include "Which of the following" or similar phrases
8. NEVER include more than two options
9. NEVER use uppercase for true/false options
10. NEVER use multiple choice questions
11. NEVER use "best describes" or similar phrases
12. NEVER use "focusing on" or similar phrases
13. NEVER use "primarily" or similar phrases
14. NEVER use "specializing in" or similar phrases
15. NEVER use "area of expertise" or similar phrases
16. NEVER use "Which of the following" or similar phrases
17. NEVER use "What is" or similar phrases
18. NEVER use "How does" or similar phrases
19. NEVER use "What are" or similar phrases
20. NEVER use "What do" or similar phrases

FORMAT RULES:
- Question must be a simple statement that can be answered with true/false
- Question must end with a question mark
- Options must be exactly ["true", "false"] in lowercase
- Correct answer must be either "true" or "false" in lowercase
- Question must be a direct statement, not a multiple choice question
- Question must start with a subject (person, thing, or concept)
- Question must be a complete statement that can be answered with true/false
- Question must be about a specific fact or claim
- Question must be a simple "is" or "are" statement
- Question must be a single sentence
- Question must be a direct claim that can be verified

GOOD EXAMPLES (use these as templates):
- "Hamza is an AI engineer?"
- "The project uses Python for development?"
- "The team has 5 members?"
- "The application uses React for the frontend?"
- "The database is built with PostgreSQL?"

BAD EXAMPLES (NEVER use these):
- "Which of the following best describes Hamza's expertise?" (WRONG - multiple choice format)
- "Hamza's expertise includes:" (WRONG - no question mark)
- "What is Hamza's main focus?" (WRONG - question format)
- "Hamza might be an AI engineer" (WRONG - no question mark)
- "Hamza is either a frontend or backend developer" (WRONG - too complex)
- "Hamza specializes in AI Engineering with a focus on Machine Learning?" (WRONG - too long)
- "Focusing solely on traditional Machine Learning algorithms?" (WRONG - starts with verb)
- "Which of the following is true about Hamza?" (WRONG - multiple choice format)
- "Hamza's area of AI expertise is Machine Learning?" (WRONG - too complex)
- "Hamza primarily works on frontend development?" (WRONG - uses "primarily")
- "Hamza specializes in backend development?" (WRONG - uses "specializes in")
- "What is Hamza's role in the project?" (WRONG - question format)
- "How does Hamza contribute to the team?" (WRONG - question format)
- "What are Hamza's main responsibilities?" (WRONG - question format)

VALIDATION CHECKLIST:
1. Does the question end with a question mark?
2. Are the options exactly ["true", "false"] in lowercase?
3. Is the correct_answer either "true" or "false" in lowercase?
4. Is the question clear and unambiguous?
5. Can it be definitively proven true or false?
6. Is it a simple statement, not a multiple choice question?
7. Does it avoid phrases like "Which of the following"?
8. Is it short and direct?
9. Does it start with a subject, not a verb?
10. Is it a complete statement that can be answered with true/false?
11. Does it avoid phrases like "best describes", "focusing on", "primarily", "specializing in"?
12. Is it about a specific fact or claim?
13. Is it a simple "is" or "are" statement?
14. Is it a single sentence?
15. Is it a direct claim that can be verified?

Make the questions {difficulty} difficulty level.
Use {language} language.

Text to create quiz from:
{text}

{format_instructions}""",

            'fill_in_blank': """Create a fill-in-the-blank quiz from the following text with {num_questions} questions.
Your response should be a JSON object with a list of questions, where each question has:
- A question field with the text containing a blank (represented by _____)
- An options field with an array of possible answers (including the correct one)
- A correct_answer field with the correct answer

Make the questions {difficulty} difficulty level.
Use {language} language.

Text to create quiz from:
{text}

{format_instructions}""",

            'matching': """Create a matching quiz from the following text with {num_questions} questions.
Your response should be a JSON object with a list of questions, where each question has:
- A question field with the term to match
- An options field with an array of possible matches
- A correct_answer field with the correct match

Make the questions {difficulty} difficulty level.
Use {language} language.

Text to create quiz from:
{text}

{format_instructions}""",

            'mixed': """Create a mixed quiz from the following text with {num_questions} questions.
Your response should be a JSON object with a list of questions, where each question has:
- A question field with the question text
- An options field with an array of possible answers
- A correct_answer field with the correct answer
- A type field indicating the question type (multiple_choice, true_false, fill_in_blank, or matching)

Distribute the questions evenly among different types.
Make the questions {difficulty} difficulty level.
Use {language} language.

Text to create quiz from:
{text}

{format_instructions}"""
        }

        def get_chain(quiz_type='multiple_choice'):
            prompt = PromptTemplate(
                template=prompts.get(quiz_type, prompts['multiple_choice']),
                input_variables=["text", "num_questions", "difficulty", "language"],
                partial_variables={"format_instructions": quiz_parser.get_format_instructions()}
            )
            return prompt | cls.get_llm() | quiz_parser

        return get_chain 