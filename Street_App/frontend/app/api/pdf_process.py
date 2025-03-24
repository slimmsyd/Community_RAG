from http.server import BaseHTTPRequestHandler
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import json
import uuid
import re
import tempfile

# Serverless-friendly imports (avoid large dependencies if possible)
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Define our LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=OPENAI_API_KEY)

# Serverless function for processing PDF
@app.post("/api/upload")
async def process_pdf(file: UploadFile = File(...)):
    """
    Process a PDF file and create embeddings (serverless version)
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a PDF.")
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
        # Read the file content
        content = await file.read()
        
        # Write to the temporary file
        temp.write(content)
        temp_path = temp.name
    
    try:
        # Process the PDF
        loader = PyPDFLoader(temp_path)
        documents = loader.load()
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)
        
        # Extract text for summary (first 8000 chars)
        document_content = " ".join([doc.page_content for doc in documents])[:8000]
        
        # Generate summary
        summary_prompt = ChatPromptTemplate.from_template(
            "Provide a concise summary of this document, including its main topics, purpose, and key points:\n\n{text}"
        )
        summary_chain = summary_prompt | llm
        summary = summary_chain.invoke({"text": document_content})
        
        # Return the response
        return {
            "session_id": session_id,
            "summary": summary.content,
            "message": "PDF processed successfully",
            "chunks": [{"text": doc.page_content, "metadata": doc.metadata} for doc in chunks]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.unlink(temp_path)

@app.post("/api/query")
async def query_pdf(request: dict):
    """
    Query using provided chunks and question (serverless version)
    """
    chunks = request.get("chunks", [])
    question = request.get("question")
    
    if not chunks:
        raise HTTPException(status_code=400, detail="No document chunks provided")
    
    if not question:
        raise HTTPException(status_code=400, detail="No question provided")
    
    try:
        # Create retrieval prompt
        template = """
        You are an assistant for question-answering tasks. Use the following pieces of context to answer the question. 
        If you don't know the answer, just say that you don't know.

        Context:
        {context}

        Question:
        {question}

        Answer the question with a detailed response based only on the provided context.
        """
        prompt = ChatPromptTemplate.from_template(template)
        
        # Format chunks into context
        context = "\n\n".join([chunk["text"] for chunk in chunks])
        
        # Create response
        chain = prompt | llm
        response = chain.invoke({"context": context, "question": question})
        
        return {
            "answer": response.content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# This handler allows us to use FastAPI with Vercel
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write('FastAPI PDF Processing API'.encode())
        
handler = Handler 