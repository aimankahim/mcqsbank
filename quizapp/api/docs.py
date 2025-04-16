"""
API Documentation

Endpoints:
1. /api/upload-pdf/
   - Method: POST
   - Description: Upload a PDF file for processing
   - Content-Type: multipart/form-data

2. /api/chat/upload-pdf/
   - Method: POST
   - Description: Upload a PDF file for chat processing
   - Content-Type: multipart/form-data

3. /api/chat/
   - Method: POST
   - Description: Chat with the AI about the uploaded PDF
   - Content-Type: application/json

4. /api/generate-notes/
   - Method: POST
   - Description: Generate concise notes from the PDF
   - Content-Type: application/json

5. /api/generate-quiz/
   - Method: POST
   - Description: Generate a quiz from the PDF
   - Content-Type: application/json

6. /api/generate-flashcards/
   - Method: POST
   - Description: Generate flashcards from the PDF
   - Content-Type: application/json

7. /api/quizzes/
   - Method: GET, POST
   - Description: List and create quizzes

8. /api/questions/
   - Method: GET, POST
   - Description: List and create questions

9. /api/flashcards/
   - Method: GET, POST
   - Description: List and create flashcards

10. /api/notes/
    - Method: GET, POST
    - Description: List and create notes
""" 