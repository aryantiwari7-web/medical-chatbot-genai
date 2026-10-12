from langchain_huggingface import HuggingFaceEmbeddings
from langchain.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
from langchain.schema import Document

def load_pdf_file(folder_path):
    loader=DirectoryLoader(
        folder_path,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )
    document = loader.load()

    return document


def filter_to_minimal_docs(docs:List[Document]) -> List[Document]:
    """
        Given a list of Document objects, return a new list of Document objects
        containing only 'source' in metadata and the original page_content.
    """

    minimal_docs:List[Document]=[]

    for doc in docs:
        src=doc.metadata.get("source")
        page_content = doc.page_content
        minimal_docs.append(
            Document(
                page_content=page_content,
                metadata={"source":src}
            )
        )

    return minimal_docs

def text_split(minimzied_pdf):
    text_splitter=RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=20
    )

    splitted_pdf=text_splitter.split_documents(minimzied_pdf)
    return splitted_pdf


def convert_into_embadding():
    """
        Download and return huggingface embedding model
    """

    model_name="sentence-transformers/all-MiniLM-L6-v2"
    embedding = HuggingFaceEmbeddings(
        model_name=model_name
    )

    return embedding