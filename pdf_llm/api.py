from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from dotenv import load_dotenv
# Updated imports for LangChain
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Updated Pydantic imports
from pydantic import BaseModel, Field
import pandas as pd
import uuid
import re
import json
from werkzeug.utils import secure_filename

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load environment variables
load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Define our LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=OPENAI_API_KEY)

# Configuration
UPLOAD_FOLDER = 'uploads'
VECTOR_STORE_DIR = 'vectorstores'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(VECTOR_STORE_DIR, exist_ok=True)

# Define response models
class AnswerWithSources(BaseModel):
    """An answer to the question, with sources and reasoning."""
    answer: str = Field(description="Answer to question")
    sources: str = Field(description="Full direct text chunk from the context used to answer the question")
    reasoning: str = Field(description="Explain the reasoning of the answer based on the sources")

class ExtractedInfoWithSources(BaseModel):
    """Extracted information about the research article"""
    paper_title: AnswerWithSources
    paper_summary: AnswerWithSources
    publication_year: AnswerWithSources
    paper_authors: AnswerWithSources

# Define prompt template for QA
PROMPT_TEMPLATE = """
    You are an assistant for question-answering tasks.
    Use the following pieces of retrieved context to answer
    the question. If you don't know the answer, say that you
    don't know. DON'T MAKE UP ANYTHING.

    {context}

    ---

    Answer the question based on the above context: {question}
    """

# Helper functions from app.py
def get_embedding_function(api_key):
    """
    Return an OpenAIEmbeddings object, which is used to create vector embeddings from text.
    The embeddings model used is "text-embedding-ada-002" and the OpenAI API key is provided
    as an argument to the function.

    Parameters:
        api_key (str): The OpenAI API key to use when calling the OpenAI Embeddings API.

    Returns:
        OpenAIEmbeddings: An OpenAIEmbeddings object, which can be used to create vector embeddings from text.
    """
    embeddings = OpenAIEmbeddings(
        model="text-embedding-ada-002", openai_api_key=api_key
    )
    return embeddings

def process_pdf(pdf_path, session_id):
    """Process a PDF file and create a vector store"""
    # Load PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500, 
        chunk_overlap=200, 
        length_function=len, 
        separators=[
            "\n\n", "\n", " ", ".", ",", "\u200b", "\uff0c", 
            "\u3001", "\uff0e", "\u3002", "",
        ]
    )
    chunks = text_splitter.split_documents(documents)
    
    # Get embedding function
    embedding_function = get_embedding_function(OPENAI_API_KEY)
    
    # Create vector store using the separate function
    persist_dir = os.path.join(VECTOR_STORE_DIR, session_id)
    vectorstore = create_vectorstore(chunks, embedding_function, persist_dir)
    
    # Generate PDF summary
    summary = generate_pdf_summary(vectorstore)
    
    return persist_dir, summary

def generate_pdf_summary(vectorstore):
    """Generate a summary of the PDF content"""
    try:
        # Create a retrieval chain
        chain = create_retrieval_chain(vectorstore)
        
        # Ask for a summary
        summary_prompt = "Please provide a concise summary of this document, including its main topics, purpose, and key points."
        response = chain.invoke(summary_prompt)
        
        return response.content
    except Exception as e:
        print(f"Error generating summary: {e}")
        return "Unable to generate summary. The document has been processed and you can ask specific questions about it."

def create_vectorstore(chunks, embedding_function, persist_dir):
    """
    Create a vector store from a list of text chunks.
    """
    # Create a list of unique IDs for each doc based on content
    ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]
    
    unique_ids = set()
    unique_chunks = []
    
    for chunk, id in zip(chunks, ids):
        if id not in unique_ids:
            unique_ids.add(id)
            unique_chunks.append(chunk)
    
    # Create a vector store from the unique chunks and ids
    vectorstore = Chroma.from_documents(
        documents=unique_chunks, 
        embedding=embedding_function, 
        ids=list(unique_ids), 
        persist_directory=persist_dir
    )
    
    return vectorstore

def load_vectorstore(persist_dir):
    """
    Load a vector store from a directory.
    """
    vectorstore = Chroma(
        embedding_function=get_embedding_function(OPENAI_API_KEY),
        persist_directory=persist_dir
    )
    return vectorstore

def format_docs(docs):
    """
    Format a list of Document objects into a single string.
    """
    return "\n\n".join(doc.page_content for doc in docs)

def create_retrieval_chain(vectorstore):
    """Create a retrieval chain from a vector store"""
    # Create a retriever
    retriever = vectorstore.as_retriever()
    
    # Define a prompt template
    template = """Answer the question based only on the following context:
    {context}
    
    Question: {question}
    """
    prompt = ChatPromptTemplate.from_template(template)
    
    # Create the chain
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
    )
    
    return chain

def query_document(vectorstore, query):
    """
    Query a vector store with a question and return a structured response.
    """
    retriever = vectorstore.as_retriever(search_type="similarity")
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt_template
        | llm.with_structured_output(ExtractedInfoWithSources)
    )

    structured_response = rag_chain.invoke(query)
    
    # Convert to dictionary for easier JSON serialization
    return structured_response.dict()

# API Routes
@app.route('/upload', methods=['POST'])
def upload_pdf():
    """Upload a PDF file and process it"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.pdf'):
        # Generate a session ID
        session_id = str(uuid.uuid4())
        
        # Save the file temporarily
        temp_dir = tempfile.mkdtemp()
        pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
        file.save(pdf_path)
        
        try:
            # Process the PDF and get summary
            vector_store_path, summary = process_pdf(pdf_path, session_id)
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'summary': summary,
                'message': 'PDF processed successfully'
            }), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
        finally:
            # Clean up the temporary file
            os.remove(pdf_path)
            os.rmdir(temp_dir)
    
    return jsonify({'error': 'Invalid file format. Please upload a PDF.'}), 400

@app.route('/query', methods=['POST'])
def query():
    """Query a processed PDF"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    session_id = data.get('session_id')
    question = data.get('question')
    
    if not session_id:
        return jsonify({'error': 'No session ID provided'}), 400
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    vector_store_path = os.path.join(VECTOR_STORE_DIR, session_id)
    
    if not os.path.exists(vector_store_path):
        return jsonify({'error': 'Session not found'}), 404
    
    try:
        # Load the vector store
        vectorstore = load_vectorstore(vector_store_path)
        
        # Create a retrieval chain
        if data.get('structured', False):
            # Return structured info
            result = query_document(vectorstore, question)
            return jsonify(result), 200
        else:
            # Return simple answer
            chain = create_retrieval_chain(vectorstore)
            response = chain.invoke(question)
            return jsonify({'answer': response.content}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'version': '1.0.0'}), 200

# Run the Flask app
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=False) 