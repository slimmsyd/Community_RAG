import os
from dotenv import load_dotenv
# Updated imports for LangChain
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.evaluation import load_evaluator

# Updated Pydantic imports
from pydantic import BaseModel, Field
import pandas as pd
import uuid
import re
import tempfile


load_dotenv()

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Get Langbase API key from environment variables
LANGBASE_API_KEY = os.getenv('LANGBASE_API_KEY')
mainPDF = os.path.join(os.path.dirname(__file__), "data", "chatGPTMil.pdf")
approachPDF = os.path.join(os.path.dirname(__file__), "data", "approach.pdf")

# Define our LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=OPENAI_API_KEY)

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is not set")




class AnswerWithSources(BaseModel):
    """An answer to the question, with sources and reasoning."""
    answer: str = Field(description="Answer to question")
    sources: str = Field(description="Full direct text chunk from the context used to answer the question")
    reasoning: str = Field(description="Explain the reasoning of the answer based on the sources")


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







# Function to load and process PDF
#Proces the PDF Document
def process_pdf(pdf_path):
    # Load PDF
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200, length_function=len, separators=[
        "\n\n",
        "\n",
        " ",
        ".",
        ",",
        "\u200b",  # Zero-width space
        "\uff0c",  # Fullwidth comma
        "\u3001",  # Ideographic comma
        "\uff0e",  # Fullwidth full stop
        "\u3002",  # Ideographic full stop
        "",
    ],
    )
    chunks = text_splitter.split_documents(documents)
    
    # Get embedding function
    embedding_function = get_embedding_function(OPENAI_API_KEY)
    
    # Create vector store using the separate function
    vectorstore = create_vectorstore(chunks, embedding_function)
    
    return vectorstore


def create_vectorstore(chunks, embedding_function, persist_dir="vectorstore"):
    
    
    """
    Create a vector store from a list of text chunks.

    :param chunks: A list of generic text chunks
    :param embedding_function: A function that takes a string and returns a vector
    :param file_name: The name of the file to associate with the vector store
    :param vector_store_path: The directory to store the vector store

    :return: A Chroma vector store object
    """
    
    #Create a list of unqiue IDS for each doc based on contnet
    ids = [str(uuid.uuid5(uuid.NAMESPACE_DNS, doc.page_content)) for doc in chunks]
    
    unique_ids = set()
    unique_chunks = []
    
    unique_chunks = []
    
    for chunk, id in zip(chunks, ids):
        if id not in unique_ids:
            unique_ids.add(id)
            unique_chunks.append(chunk)
    
    #Create a vector store from the unique chunks and ids
    vectorstore = Chroma.from_documents(documents=unique_chunks, embedding=embedding_function, ids=ids, persist_directory=persist_dir)
    
    #Persist the vector store
    vectorstore.persist()
    
    return vectorstore
    
    
    
    
def load_vectorstore(persist_dir="vectorstore"):
    """
    Load a vector store from a directory.

    :param persist_dir: The directory to load the vector store from
    :return: A Chroma vector store object
    """
    
    vectorstore = Chroma(
        embedding_function=get_embedding_function(OPENAI_API_KEY),
        persist_directory=persist_dir
    )
    
    retriver = vectorstore.as_retriever(search_type = "similarity")
    #Prompt TEMPLATE
    PROMPT_TEMPLATE ="""
        You are an assistant for question-answering tasks.
        Use the following pieces of retrieved context to answer
        the question. If you don't know the answer, say that you
        don't know. DON'T MAKE UP ANYTHING.

        {context}

        ---

        Answer the question based on the above context: {question}
        """
        
        
        
        
            
def format_docs(docs):
    """
    Format a list of Document objects into a single string.

    :param docs: A list of Document objects

    :return: A string containing the text of all the documents joined by two newlines
    """
    return "\n\n".join(doc.page_content for doc in docs)



def query_document(vectorstore, query, api_key):

    """
    Query a vector store with a question and return a structured response.

    :param vectorstore: A Chroma vector store object
    :param query: The question to ask the vector store
    :param api_key: The OpenAI API key to use when calling the OpenAI Embeddings API

    :return: A pandas DataFrame with three rows: 'answer', 'source', and 'reasoning'
    """
    llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key)

    retriever=vectorstore.as_retriever(search_type="similarity")

    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

    rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt_template
            | llm.with_structured_output(ExtractedInfoWithSources, strict=True)
        )

    structured_response = rag_chain.invoke(query)
    df = pd.DataFrame([structured_response.dict()])

    # Transforming into a table with two rows: 'answer' and 'source'
    answer_row = []
    source_row = []
    reasoning_row = []

    for col in df.columns:
        answer_row.append(df[col][0]['answer'])
        source_row.append(df[col][0]['sources'])
        reasoning_row.append(df[col][0]['reasoning'])

    # Create new dataframe with two rows: 'answer' and 'source'
    structured_response_df = pd.DataFrame([answer_row, source_row, reasoning_row], columns=df.columns, index=['answer', 'source', 'reasoning'])
  
    return structured_response_df.T

   
    
def query_document(vectorstore, query, api_key):

    """
    Query a vector store with a question and return a structured response.

    :param vectorstore: A Chroma vector store object
    :param query: The question to ask the vector store
    :param api_key: The OpenAI API key to use when calling the OpenAI Embeddings API

    :return: A pandas DataFrame with three rows: 'answer', 'source', and 'reasoning'
    """
    llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key)

    retriever=vectorstore.as_retriever(search_type="similarity")

    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)

    rag_chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt_template
            | llm.with_structured_output(ExtractedInfoWithSources, strict=True)
        )

    structured_response = rag_chain.invoke(query)
    df = pd.DataFrame([structured_response.dict()])

    # Transforming into a table with two rows: 'answer' and 'source'
    answer_row = []
    source_row = []
    reasoning_row = []

    for col in df.columns:
        answer_row.append(df[col][0]['answer'])
        source_row.append(df[col][0]['sources'])
        reasoning_row.append(df[col][0]['reasoning'])

    # Create new dataframe with two rows: 'answer' and 'source'
    structured_response_df = pd.DataFrame([answer_row, source_row, reasoning_row], columns=df.columns, index=['answer', 'source', 'reasoning'])
  
    return structured_response_df.T
    
    

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
# Lets create Text Embeddings




# Load an evaluator with a specific type
# eval = load_evaluator(eval)  # This was incorrect - passing the built-in eval function
evaluator = load_evaluator("qa")  # Using "qa" as the evaluator type


# Create a retrieval chain
def create_retrieval_chain(vectorstore):
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

if __name__ == "__main__":
    # Simple test of the LLM
    vectorstore = process_pdf(approachPDF)
    chain = create_retrieval_chain(vectorstore)
    response = chain.invoke("Give me hte title, summary, and publication date of this")
    print(response)    # Example of how to use the PDF processing functions
    # pdf_path = "path/to/your/document.pdf"
    # vectorstore = process_pdf(pdf_path)
    # chain = create_retrieval_chain(vectorstore)
    # response = chain.invoke("What is this document about?")
    # print(response)
