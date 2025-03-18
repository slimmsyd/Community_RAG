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

### Local Deployment

For local deployment, you can use the Flask development server:

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

### AWS Lambda Deployment

This project includes files for deploying the API to AWS Lambda with API Gateway:

1. **Prerequisites**:
   - AWS CLI installed and configured with appropriate permissions
   - Python 3.9 or newer
   - An AWS account

2. **Deployment Steps**:
   
   ```bash
   # Set your environment variables
   export AWS_REGION=us-east-1  # Or your preferred region
   export S3_BUCKET=pdf-llm-storage-youruniquename  # Must be globally unique
   
   # Run the deployment script
   ./deploy_lambda.sh
   ```

3. **What the Deployment Script Does**:
   - Creates an S3 bucket for storing PDFs and vector databases
   - Packages the Lambda function and dependencies
   - Creates a Lambda function with the appropriate permissions
   - Sets up an API Gateway with endpoints for /upload, /query, and /health
   - Configures CORS for frontend integration
   - Outputs the API URLs for use in your frontend

4. **After Deployment**:
   Update your frontend `.env.local` file with the generated API URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod/pdf
   ```

5. **Serverless Benefits**:
   - Automatic scaling based on demand
   - Pay only for what you use
   - No server management
   - High availability

### Other Deployment Options

For other production environments, consider:

1. Using a production WSGI server like Gunicorn
2. Setting up proper CORS configuration
3. Implementing authentication
4. Using other cloud hosting providers (Heroku, Google Cloud, etc.)

## License

[Your License Information] 