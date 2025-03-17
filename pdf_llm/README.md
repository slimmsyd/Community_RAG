# PDF Processing API

This Flask-based API allows you to upload PDF documents, process them using LangChain and OpenAI embeddings, and query them using natural language.

## Features

- PDF document upload and processing
- Automatic document summarization
- Retrieval Augmented Generation (RAG) for answering questions about documents
- Session-based document management
- Vector database storage using Chroma

## Prerequisites

- Python 3.9+
- OpenAI API key
- Flask and its dependencies

## Installation

1. Clone the repository
2. Set up a virtual environment:
```bash
python -m venv myenv
source myenv/bin/activate  # On Windows: myenv\Scripts\activate
```

3. Install the required packages:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the API Server

To start the API server locally:

```bash
./run_api.sh
```

Or manually:

```bash
export FLASK_APP=api.py
export FLASK_ENV=development
export PORT=5002
python api.py
```

The server will start on port 5002 by default.

## API Endpoints

### Upload a PDF Document

**Endpoint:** `POST /upload`

**Request:**
- `file`: PDF file to be uploaded (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "session_id": "unique-session-id",
  "summary": "Automatic summary of the document...",
  "message": "PDF processed successfully"
}
```

### Query a Document

**Endpoint:** `POST /query`

**Request:**
```json
{
  "session_id": "unique-session-id",
  "question": "Your question about the document?",
  "structured": false
}
```

**Response (Simple):**
```json
{
  "answer": "Answer to your question based on the document content..."
}
```

**Response (Structured, when structured=true):**
```json
{
  "paper_title": {
    "answer": "The title of the paper",
    "sources": "Source text from the document",
    "reasoning": "Reasoning for the answer"
  },
  "paper_summary": {
    "answer": "Summary of the paper",
    "sources": "Source text from the document",
    "reasoning": "Reasoning for the answer"
  },
  ...
}
```

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

## Integration with Frontend

The API is designed to work with the React/Next.js frontend located in `Street_App/frontend/app/app/readPDF/`. 

To configure the frontend to connect to this API:

1. Set the `NEXT_PUBLIC_API_URL` environment variable in your frontend's `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:5002
```

2. Ensure `react-markdown` is installed in your frontend:
```bash
npm install react-markdown
```

## Deployment

For deploying to a production environment, consider:

1. Using a production WSGI server like Gunicorn
2. Setting up proper CORS configuration
3. Implementing authentication
4. Using a cloud hosting provider (Heroku, AWS, Google Cloud, etc.)

## License

[Your License Information] 