import os
import json
import base64
import tempfile
import uuid
from dotenv import load_dotenv
# Updated imports for LangChain
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.evaluation import load_evaluator

# S3 imports
import boto3
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Define our LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=OPENAI_API_KEY)

# Configuration for S3
S3_BUCKET = os.getenv('S3_BUCKET', 'pdf-llm-storage')
s3_client = boto3.client('s3')

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

def get_embedding_function(api_key):
    """
    Return an OpenAIEmbeddings object for creating vector embeddings.
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
    
    # Create vector store and save to S3
    vectorstore = create_vectorstore(chunks, embedding_function, session_id)
    
    # Generate PDF summary
    summary = generate_pdf_summary(vectorstore)
    
    return session_id, summary

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

def create_vectorstore(chunks, embedding_function, session_id):
    """
    Create a vector store from a list of text chunks and save to S3.
    """
    # Create a list of unique IDs for each doc based on content
    ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]
    
    unique_ids = set()
    unique_chunks = []
    
    for chunk, id in zip(chunks, ids):
        if id not in unique_ids:
            unique_ids.add(id)
            unique_chunks.append(chunk)
    
    # Create a vector store using a temporary directory
    with tempfile.TemporaryDirectory() as tmpdir:
        persist_dir = os.path.join(tmpdir, "chroma")
        vectorstore = Chroma.from_documents(
            documents=unique_chunks, 
            embedding=embedding_function, 
            ids=list(unique_ids), 
            persist_directory=persist_dir
        )
        
        # Save the vectorstore files to S3
        for root, _, files in os.walk(persist_dir):
            for file in files:
                local_path = os.path.join(root, file)
                s3_path = f"vectorstores/{session_id}/{os.path.relpath(local_path, tmpdir)}"
                s3_client.upload_file(local_path, S3_BUCKET, s3_path)
        
        return vectorstore

def load_vectorstore(session_id):
    """
    Load a vector store from S3.
    """
    # Download vectorstore files from S3 to a temporary directory
    with tempfile.TemporaryDirectory() as tmpdir:
        persist_dir = os.path.join(tmpdir, "chroma")
        os.makedirs(persist_dir, exist_ok=True)
        
        # List objects in the S3 vectorstore directory
        prefix = f"vectorstores/{session_id}/"
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        
        if 'Contents' not in response:
            raise ValueError(f"No vectorstore found for session ID: {session_id}")
        
        # Download each file
        for obj in response['Contents']:
            key = obj['Key']
            local_path = os.path.join(tmpdir, os.path.relpath(key, prefix.rstrip("/")))
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            s3_client.download_file(S3_BUCKET, key, local_path)
        
        # Load the vectorstore
        vectorstore = Chroma(
            embedding_function=get_embedding_function(OPENAI_API_KEY),
            persist_directory=persist_dir
        )
        
        return vectorstore

def format_docs(docs):
    """Format a list of Document objects into a single string."""
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
    """Query a vector store with a question and return a response."""
    try:
        # Create a retrieval chain
        chain = create_retrieval_chain(vectorstore)
        
        # Query the chain
        response = chain.invoke(query)
        
        return response.content
    except Exception as e:
        print(f"Error querying document: {e}")
        return f"Error processing query: {str(e)}"

def lambda_handler(event, context):
    """AWS Lambda handler function"""
    print(f"Received event: {json.dumps(event)}")
    
    # Check if this is an API Gateway request
    if 'httpMethod' not in event:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Not an API Gateway request'})
        }
    
    http_method = event['httpMethod']
    path = event.get('path', '')
    
    # Health check endpoint
    if http_method == 'GET' and path.endswith('/health'):
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'version': '1.0.0'
            })
        }
    
    # Upload PDF endpoint
    if http_method == 'POST' and path.endswith('/upload'):
        try:
            # Check if the request includes a file
            if 'body' not in event or not event['body']:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'No file data provided'})
                }
            
            # API Gateway sends the file as a base64-encoded string
            content_type = event.get('headers', {}).get('content-type', '')
            
            if 'multipart/form-data' not in content_type:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Content type must be multipart/form-data'})
                }
            
            # Parse multipart form data
            body = event['body']
            if event.get('isBase64Encoded', False):
                body = base64.b64decode(body)
            
            # Extract boundary
            boundary = content_type.split('boundary=')[1].strip()
            
            # Parse form data (simplified approach)
            # In production, use a proper multipart parser
            parts = body.split(f'--{boundary}'.encode())
            file_part = None
            
            for part in parts:
                if b'Content-Disposition: form-data; name="file"' in part:
                    file_part = part
                    break
            
            if not file_part:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'No file found in request'})
                }
            
            # Extract filename
            filename_match = file_part.decode().split('\r\n')[1].split('filename="')
            if len(filename_match) < 2:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Filename not found'})
                }
            
            filename = filename_match[1].split('"')[0]
            
            if not filename.endswith('.pdf'):
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'File must be a PDF'})
                }
            
            # Extract file content
            file_content_parts = file_part.split(b'\r\n\r\n', 1)
            if len(file_content_parts) < 2:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'File content not found'})
                }
            
            file_content = file_content_parts[1].split(b'\r\n--', 1)[0]
            
            # Generate a session ID
            session_id = str(uuid.uuid4())
            
            # Save the file to S3
            safe_filename = secure_filename(filename)
            s3_path = f"uploads/{session_id}/{safe_filename}"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_path,
                Body=file_content
            )
            
            # Download the file to process it
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                s3_client.download_file(S3_BUCKET, s3_path, tmp.name)
                
                try:
                    # Process the PDF
                    session_id, summary = process_pdf(tmp.name, session_id)
                    
                    return {
                        'statusCode': 200,
                        'body': json.dumps({
                            'success': True,
                            'session_id': session_id,
                            'summary': summary,
                            'message': 'PDF processed successfully'
                        })
                    }
                finally:
                    # Clean up
                    os.unlink(tmp.name)
                    
        except Exception as e:
            print(f"Error processing PDF: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
    
    # Query endpoint
    if http_method == 'POST' and path.endswith('/query'):
        try:
            # Parse request body
            body = json.loads(event['body'])
            
            session_id = body.get('session_id')
            question = body.get('question')
            
            if not session_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'No session ID provided'})
                }
            
            if not question:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'No question provided'})
                }
            
            # Load the vector store
            try:
                vectorstore = load_vectorstore(session_id)
            except Exception as e:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': f'Session not found: {str(e)}'})
                }
            
            # Query the document
            answer = query_document(vectorstore, question)
            
            return {
                'statusCode': 200,
                'body': json.dumps({'answer': answer})
            }
            
        except Exception as e:
            print(f"Error querying document: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e)})
            }
    
    # If no matching route
    return {
        'statusCode': 404,
        'body': json.dumps({'error': 'Not found'})
    } 