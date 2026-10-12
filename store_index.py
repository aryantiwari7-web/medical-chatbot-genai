from langchain_pinecone import PineconeVectorStore
from pinecone import ServerlessSpec
from pinecone import Pinecone
from src.helper import load_pdf_file,filter_to_minimal_docs,convert_into_embadding,text_split
from dotenv import load_dotenv
import os

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY missing in .env")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

os.environ["PINECONE_API_KEY"]=PINECONE_API_KEY
os.environ["OPENAI_API_KEY"]=OPENAI_API_KEY


pc=Pinecone(api_key=PINECONE_API_KEY)


index_name = "medical-chatbot-genai"

if not pc.has_index(index_name):
    pc.create_index(
        name=index_name,
        dimension=384,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws",region="us-east-1")
    )

index=pc.Index(index_name)

extracted_data=load_pdf_file("./data")
minimzied_pdf=filter_to_minimal_docs(extracted_data)
splitted_pdf=text_split(minimzied_pdf)
embedding=convert_into_embadding()



docsearch = PineconeVectorStore.from_documents(
    documents=splitted_pdf,
    embedding=embedding,
    index_name=index_name
)