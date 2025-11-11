---
# frontmatter
path: "/tutorial-python-langchain-pdf-chat-query"
# title and description do not need to be added to markdown, start with H2 (##)
title: Build PDF Chat App With Couchbase Python SDK, LangChain and Vector Search
short_title: Build PDF Chat App (Vector Search)
description:
  - Construct a PDF Chat App with LangChain, Couchbase Python SDK, Couchbase Vector Search (Query Service), and Streamlit.
  - Learn to upload PDFs into Couchbase Vector Store with LangChain using Query-based Vector Search.
  - Discover how to use RAG's for context-based Q&A's from PDFs with LLMs.
content_type: tutorial
filter: sdk
technology:
  - hyperscale vector index
  - composite vector index
  - kv
tags:
  - Streamlit
  - LangChain
  - OpenAI
  - Artificial Intelligence
sdk_language:
  - python
length: 45 Mins
---

## Introduction

Welcome to this comprehensive guide on constructing an AI-enhanced Chat Application using Couchbase Vector Search. We will create a dynamic chat interface capable of delving into PDF documents to extract and provide summaries, key facts, and answers to your queries. By the end of this tutorial, you'll have a powerful tool at your disposal, transforming the way you interact with and utilize the information contained within PDFs.

This tutorial will demonstrate how to -

- Utilize [Couchbase Vector Search](https://www.couchbase.com/products/vector-search/) with Query Service and Hyperscale/Composite Vector Indexes for doing Vector Search.
- Chunk PDFs into Vectors with [LangChain](https://langchain.com/) and use [Couchbase Query Vector Store](https://couchbase-ecosystem.github.io/langchain-couchbase/) to store the vectors into Couchbase.
- Query large language models via the [RAG framework](https://aws.amazon.com/what-is/retrieval-augmented-generation/) for contextual insights. We will use [OpenAI](https://openai.com) for generating Embeddings and LLM.
- Craft an elegant UI with Streamlit. All these components come together to create a seamless, AI-powered chat experience.

## Prerequisites

- [Python](https://www.python.org/downloads/) 3.10 or higher installed.
- Ensure that the Python version is [compatible](https://docs.couchbase.com/python-sdk/current/project-docs/compatibility.html#python-version-compat) with the Couchbase SDK.
- Couchbase Cluster (Self Managed or Capella) version 8.0+ with [Query Service](https://docs.couchbase.com/server/current/n1ql/n1ql-intro/index.html)

> Note that this tutorial is designed to work with the latest Python SDK version (4.2.0+) for Couchbase. It will not work with the older Python SDK versions.

> Couchbase Vector Search with Query Service is only supported at Couchbase Version 8.0+. 

## Quick Start Guide:

### Cloning Repo

```shell
git clone https://github.com/couchbase-examples/rag-demo.git
```

### Install Dependencies

Any dependencies should be installed through `pip`, the default package manager for Python. You may use [virtual environment](https://docs.python.org/3/tutorial/venv.html) as well.

```shell
python -m pip install -r requirements.txt
```

### Setup Database Configuration

#### Capella Setup

To know more about connecting to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access cluster via SDK
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

#### Self Managed Setup

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance.

### Create Bucket

- For the purpose of this tutorial, we will be using specific bucket, scope and collection. However, you may use any name of your choice but make sure to update names in all the steps.
- Create a bucket named `pdf-chat`. We will use the `_default` scope and `_default` collection of this bucket.

### Create Vector Index (Optional)

While the application works without creating indexes manually, you can optionally create a vector index for better performance after uploading PDFs.

#### Understanding Vector Index Types

Couchbase offers different types of vector indexes for Vector Search:

**Hyperscale Vector Indexes**
- Best for pure vector searches - content discovery, recommendations, semantic search
- High performance with low memory footprint - designed to scale to billions of vectors
- Optimized for concurrent operations - supports simultaneous searches and inserts
- Use when: You primarily perform vector-only queries without complex scalar filtering
- Ideal for: Large-scale semantic search, recommendation systems, content discovery

**Composite Vector Indexes**
- Best for filtered vector searches - combines vector search with scalar value filtering
- Efficient pre-filtering - scalar attributes reduce the vector comparison scope
- Use when: Your queries combine vector similarity with scalar filters that eliminate large portions of data
- Ideal for: Compliance-based filtering, user-specific searches, time-bounded queries

**Choosing the Right Index Type**
- Start with Hyperscale Vector Index for pure vector searches and large datasets
- Use Composite Vector Index when scalar filters significantly reduce your search space
- Consider your dataset size: Hyperscale scales to billions, Composite works well for tens of millions to billions

For more details, see the [Couchbase Vector Index documentation](https://docs.couchbase.com/server/current/vector-index/use-vector-indexes.html).

#### Creating Vector Index Programmatically

You can create the index programmatically after uploading your PDFs:

```python
from langchain_couchbase.vectorstores import IndexType

# Create a vector index on the collection
vector_store.create_index(
    index_name="idx_vector",
    dimension=1536,
    similarity="cosine",
    index_type=IndexType.BHIVE,  # or IndexType.COMPOSITE
    index_description="IVF,SQ8"
)
```

For more details on the `create_index()` method, see the [LangChain Couchbase API documentation](https://couchbase-ecosystem.github.io/langchain-couchbase/langchain_couchbase.html#langchain_couchbase.vectorstores.query_vector_store.CouchbaseQueryVectorStore.create_index).

**Understanding Index Configuration Parameters:**

The `index_description` parameter controls how Couchbase optimizes vector storage and search performance:

**Format:** `'IVF[<centroids>],{PQ|SQ}<settings>'`

**Centroids (IVF - Inverted File):**
- Controls how the dataset is subdivided for faster searches
- More centroids = faster search, slower training
- Fewer centroids = slower search, faster training
- If omitted (like `IVF,SQ8`), Couchbase auto-selects based on dataset size

**Quantization Options:**
- **SQ (Scalar Quantization)**: `SQ4`, `SQ6`, `SQ8` (4, 6, or 8 bits per dimension)
- **PQ (Product Quantization)**: `PQ<subquantizers>x<bits>` (e.g., `PQ32x8`)
- Higher values = better accuracy, larger index size

**Common Examples:**
- `IVF,SQ8` - Auto centroids, 8-bit scalar quantization (good default)
- `IVF1000,SQ6` - 1000 centroids, 6-bit scalar quantization
- `IVF,PQ32x8` - Auto centroids, 32 subquantizers with 8 bits

For detailed configuration options, see the [Quantization & Centroid Settings](https://docs.couchbase.com/server/current/vector-index/hyperscale-vector-index.html#algo_settings).

> **Note:** In Couchbase Vector Search, the distance represents the vector distance between the query and document embeddings. Lower distance indicates higher similarity, while higher distance indicates lower similarity. This demo uses cosine similarity for measuring document relevance.

### Setup Environment Config

Copy the `secrets.example.toml` file in `.streamlit` folder and rename it to secrets.toml and replace the placeholders with the actual values for your environment. All configuration for communication with the database is read from the environment variables.

```bash
OPENAI_API_KEY = "<open_ai_api_key>"
DB_CONN_STR = "<connection_string_for_couchbase_cluster>"
DB_USERNAME = "<username_for_couchbase_cluster>"
DB_PASSWORD = "<password_for_couchbase_cluster>"
DB_BUCKET = "<name_of_bucket_to_store_documents>"
DB_SCOPE = "<name_of_scope_to_store_documents>"
DB_COLLECTION = "<name_of_collection_to_store_documents>"
CACHE_COLLECTION = "<name_of_collection_to_cache_llm_responses>"
AUTH_ENABLED = "False"
LOGIN_PASSWORD = "<password to access the streamlit app>"
```

> [OpenAI](https://openai.com) API Key is required for usage in generating embedding and querying LLM.

> The [connection string](https://docs.couchbase.com/python-sdk/current/howtos/managing-connections.html#connection-strings) expects the `couchbases://` or `couchbase://` part.

> For this tutorial, `DB_BUCKET = pdf-chat`, `DB_SCOPE = _default`, `DB_COLLECTION = _default`.

> Note: Unlike the Search-based approach, this method does NOT require `INDEX_NAME` as vector indexes are optional and automatically used when available.

> Login_Password of Streamlit app is a basic password to access the app. You can set the password here and while using the app, password will be required to access the app.

### Running the Application

After starting Couchbase server and installing dependencies. Our Application is ready to run.

In the projects root directory, run the following command

```sh
streamlit run chat_with_pdf_query.py
```

The application will run on your local machine at http://localhost:8501.

### Using PDF Chat App

The page starts with a text box to enter your login password. This is the same password defined earlier in the [Setup Environment Config](#setup-environment-config) section. After submitting the password, the main application page will open.

On the left sidebar, you'll find an option to upload a PDF document you want to use with this PDF Chat App. Depending on the size of the PDF, the upload process may take some time.

![Main Screen Default View](main_screen_default_view_query.png)

In the main area, there's a chat screen where you can ask questions about the uploaded PDF document. You will receive two responses: one with context from the PDF (Couchbase Logo - <img src="image.ico" alt="couchbase" width="16" style="display: inline;" /> ) , and one without the PDF context (Bot Logo - 🤖). This demonstrates how the Retrieval Augmented Generation (RAG) model enhances the answers provided by the language model using the PDF content.

![Main Screen With Message View](main_screen_message_view_query.png)

## Concepts

The PDF Chat application leverages three powerful concepts: [Retrieval-Augmented Generation (RAG)](https://aws.amazon.com/what-is/retrieval-augmented-generation/), [Couchbase Vector Search](https://www.couchbase.com/products/vector-search/), and [LLM Response Caching](https://couchbase-ecosystem.github.io/langchain-couchbase/langchain_couchbase.html#module-langchain_couchbase.cache). Together, these techniques enable efficient and context-aware interactions with PDF documents.

### Retrieval-Augmented Generation (RAG)

RAG is like having two helpers:

- **Retriever**: This helper looks through all the PDF documents to find the most relevant information based on your question or prompt.
- **Generator**: This helper is like a large language model (e.g., GPT-4, Gemini) that can understand natural language and generate human-like responses.

Here's how RAG works:

- You ask a question or provide a prompt to the app.
- The Retriever helper goes through the PDF documents and finds the most relevant passages or sections related to your question using Vector Search.
- The Generator helper takes those relevant passages and your original question, and uses them to generate a clear and contextual answer.

This enhances the context from PDF and LLM is able to give relevant results from the PDF rather than giving generalized results.

### Vector Search with Couchbase Query Service

Couchbase is a NoSQL database that provides a powerful Vector Search capability using the Query Service. It allows you to store and search through high-dimensional vector representations (embeddings) of textual data, such as PDF content, using SQL++ queries.

The PDF Chat app uses LangChain to convert the text from the PDF documents into embeddings. These embeddings are then stored in a Couchbase bucket, along with the corresponding text.

When a user asks a question or provides a prompt:

- The app converts the user's query into an embedding using LangChain's embedding models (e.g., OpenAI's embeddings).
- [Couchbase's Vector Search](https://docs.couchbase.com/server/current/vector-index/use-vector-indexes.html) capability is utilized, which supports Hyperscale and Composite Vector Indexes built on the Global Secondary Index (GSI) infrastructure.
- The app performs a vector search using SQL++ queries with cosine similarity distance metric. This is done through the `CouchbaseQueryVectorStore` which leverages Couchbase's native query capabilities.
- The vector search calculates the [similarity](https://www.couchbase.com/blog/vector-similarity-search/) (cosine distance) between the query embedding and the indexed PDF embeddings, enabling fast retrieval of the nearest neighbor embeddings.
- The nearest neighbor embeddings represent the most semantically similar passages or sections from the PDF documents compared to the user's query.
- The app retrieves the text content associated with these nearest neighbor embeddings, providing the necessary context for generating a relevant response.
- Couchbase's Vector Search with Query Service offers several advantages:
  - **Hyperscale Vector Indexes (BHIVE)**: Optimized for pure vector searches with high performance and low memory footprint, designed to scale to billions of vectors
  - **Composite Vector Indexes**: Efficient for filtered vector searches combining vector similarity with scalar value filtering
  - **SQL++ Integration**: Seamlessly integrates vector search with traditional database queries
  - **Auto-scaling**: Automatically scales to handle large datasets without manual intervention
- The Query Service facilitates fast and accurate retrieval, enabling the app to provide context-aware and relevant responses to the user's queries, even when the phrasing or terminology differs from the PDF content.
- Couchbase's Vector Search integrates seamlessly with LangChain's [CouchbaseQueryVectorStore](https://couchbase-ecosystem.github.io/langchain-couchbase/langchain_couchbase.html#module-langchain_couchbase.vectorstores.query_vector_store) class, abstracting away the complexities of vector similarity calculations.

### LLM Response Caching with Couchbase

To optimize performance and reduce costs, the application implements LLM response caching using [CouchbaseCache](https://couchbase-ecosystem.github.io/langchain-couchbase/langchain_couchbase.html#module-langchain_couchbase.cache):

- **Automatic Caching**: All LLM responses are automatically cached in a designated Couchbase collection
- **Cost Savings**: Repeated identical queries retrieve results from the cache instead of making expensive API calls to the LLM provider
- **Time Efficiency**: Cached responses are returned instantly, significantly reducing response time for repeated queries
- **Seamless Integration**: LangChain's caching layer works transparently with the RAG chain

When a user asks a question:
1. The system first checks if an identical query has been asked before
2. If found in cache, the stored response is returned immediately
3. If not found, the LLM is queried, and the response is cached for future use
4. The cache persists across application restarts, providing long-term benefits

This caching mechanism is particularly valuable in production environments where:
- Users frequently ask similar questions
- Cost optimization is critical due to high API usage
- Low latency responses improve user experience

### LangChain

LangChain is a powerful library that simplifies the process of building applications with [large language models](https://en.wikipedia.org/wiki/Large_language_model) (LLMs) and vector stores like Couchbase.

In the PDF Chat app, LangChain is used for several tasks:

- **Loading and processing PDF documents**: LangChain's [_PDFLoader_](https://python.langchain.com/docs/modules/data_connection/document_loaders/pdf/) is used to load the PDF files and convert them into text documents.
- **Text splitting**: LangChain's [_RecursiveCharacterTextSplitter_](https://python.langchain.com/docs/modules/data_connection/document_transformers/recursive_text_splitter/) is used to split the text from the PDF documents into smaller chunks or passages, which are more suitable for embedding and retrieval.
- **Embedding generation**: LangChain integrates with [various embedding models](https://python.langchain.com/docs/modules/data_connection/text_embedding/), such as OpenAI's embeddings, to convert the text chunks into embeddings.
- **Vector store integration**: LangChain provides a [_CouchbaseQueryVectorStore_](https://couchbase-ecosystem.github.io/langchain-couchbase/langchain_couchbase.html#module-langchain_couchbase.vectorstores.query_vector_store) class that seamlessly integrates with Couchbase's Vector Search using Query Service, allowing the app to store and search through the embeddings and their corresponding text.
- **Chains**: LangChain provides various [chains](https://python.langchain.com/docs/modules/chains/) for different requirements. For using RAG concept, we require _Retrieval Chain_ for Retrieval and _Question Answering Chain_ for Generation part. We also add _Prompts_ that guide the language model's behavior and output. These all are combined to form a single chain which gives output from user questions.
- **Streaming Output**: LangChain supports [streaming](https://python.langchain.com/docs/expression_language/streaming/), allowing the app to stream the generated answer to the client in real-time.
- **Caching**: LangChain's [caching layer](https://python.langchain.com/docs/modules/model_io/llms/llm_caching/) integrates with Couchbase to cache LLM responses, reducing costs and improving response times.

By combining Vector Search with Couchbase Query Service, RAG, LLM Caching, and LangChain; the PDF Chat app can efficiently ingest PDF documents, convert their content into searchable embeddings, retrieve relevant information based on user queries and conversation context, cache LLM responses for repeated queries, and generate context-aware and informative responses using large language models. This approach provides users with a powerful and intuitive way to explore and interact with large PDF files.

## Let us Understand the Flow

To begin this tutorial, clone the repo and open it up in the IDE of your choice. Now you can learn how to create the PDF Chat App. The whole code is written in `chat_with_pdf_query.py` file.

### App Flow

The fundamental workflow of the application is as follows: The user initiates the process from the Main Page's sidebar by uploading a PDF. This action triggers the `save_to_vector_store` function, which subsequently uploads the PDF into the Couchbase vector store. Following this, the user can now chat with the LLM.

On the Chat Area, the user can pose questions. These inquiries are processed by the Chat API, which consults the LLM for responses, aided by the context provided by RAG. The assistant then delivers the answer, and the user has the option to ask additional questions.

![App Flow](python_app_flow.png)

## Connecting to Couchbase

The first step will be connecting to Couchbase. Couchbase Vector Search is required for PDF Upload as well as during chat (For Retrieval). We will use the Couchbase Python SDK to connect to the Couchbase cluster. The connection is established in the `connect_to_couchbase` function.

The connection string and credentials are read from the environment variables. We perform some basic required checks for the environment variable not being set in the `secrets.toml`, and then proceed to connect to the Couchbase cluster. We connect to the cluster using [connect](https://docs.couchbase.com/python-sdk/current/hello-world/start-using-sdk.html#connect) method.

```python
def connect_to_couchbase(connection_string, db_username, db_password):
    """Connect to Couchbase"""
    from couchbase.cluster import Cluster
    from couchbase.auth import PasswordAuthenticator
    from couchbase.options import ClusterOptions
    from datetime import timedelta

    auth = PasswordAuthenticator(db_username, db_password)
    options = ClusterOptions(auth)
    connect_string = connection_string
    cluster = Cluster(connect_string, options)

    # Wait until the cluster is ready for use.
    cluster.wait_until_ready(timedelta(seconds=5))

    return cluster
```

## Initialize OpenAI and Couchbase Vector Store

We will now initialize [OpenAI embeddings](https://python.langchain.com/docs/integrations/text_embedding/openai/) which will be used by CouchbaseQueryVectorStore for converting the split docs defined above to vectors (embeddings).

We will also initialize Couchbase vector store with Couchbase bucket info. Firstly we will connect to Couchbase cluster using [`connect_to_couchbase`](#connecting-to-couchbase) method.

We will define the bucket, scope, and collection names from [Environment Variables](#setup-environment-config).

```python
# Use OpenAI Embeddings
embedding = OpenAIEmbeddings()

# Connect to Couchbase Vector Store
cluster = connect_to_couchbase(DB_CONN_STR, DB_USERNAME, DB_PASSWORD)

vector_store = get_vector_store(
    cluster,
    DB_BUCKET,
    DB_SCOPE,
    DB_COLLECTION,
    embedding,
    distance_strategy=DistanceStrategy.COSINE,
)
```

We are using `get_vector_store` method which initializes LangChain's [CouchbaseQueryVectorStore](https://couchbase-ecosystem.github.io/langchain-couchbase/langchain_couchbase.html#module-langchain_couchbase.vectorstores.query_vector_store)

```python
def get_vector_store(
    _cluster,
    db_bucket,
    db_scope,
    db_collection,
    _embedding,
    distance_strategy: DistanceStrategy,
):
    """Return the Couchbase vector store"""
    vector_store = CouchbaseQueryVectorStore(
        cluster=_cluster,
        bucket_name=db_bucket,
        scope_name=db_scope,
        collection_name=db_collection,
        embedding=_embedding,
        distance_metric=distance_strategy,
    )
    return vector_store
```

## Uploading And Ingesting PDF

`save_to_vector_store` function takes care of uploading the PDF file in vector format to Couchbase Database using CouchbaseQueryVectorStore in LangChain. It splits text into small chunks, generate embeddings for those chunks, and ingest the chunks and their embeddings into a Couchbase vector store. Let's go step by step on how it does.

### Upload PDF

This part of code creates a file uploader on sidebar using Streamlit library. After PDF is uploaded, `save_to_vector_store` function is called to further process the PDF.

```python
with st.form("upload pdf"):
    uploaded_file = st.file_uploader(
        "Choose a PDF.",
        help="The document will be deleted after one hour of inactivity (TTL).",
        type="pdf",
    )
    submitted = st.form_submit_button("Upload")
    if submitted:
        # store the PDF in the vector store after chunking
        save_to_vector_store(uploaded_file, vector_store)
```

### Read and Load Uploaded PDF

This function ensures that the uploaded PDF file is properly handled, loaded, and prepared for storage or processing in the vector store. It first checks if file was actually uploaded. Then the uploaded file is saved to a temporary file in `binary` format.

From the temporary file, PDF is loaded in [PyPDFLoader](https://python.langchain.com/docs/modules/data_connection/document_loaders/pdf/) from the LangChain library which loads the PDF into [LangChain Document](https://python.langchain.com/docs/modules/data_connection/document_loaders/) Format

```python
def save_to_vector_store(uploaded_file, vector_store):
    """Chunk the PDF & store it in Couchbase Vector Store"""
    if uploaded_file is not None:
        temp_dir = tempfile.TemporaryDirectory()
        temp_file_path = os.path.join(temp_dir.name, uploaded_file.name)

        with open(temp_file_path, "wb") as f:
            f.write(uploaded_file.getvalue())
            loader = PyPDFLoader(temp_file_path)
            docs = loader.load()
```

### Split Documents

This LangChain document array will contain huge individual files which defeats the purpose while retrieval as we want to send more relevant context to LLM. So we will split it into smaller chunks or passages using LangChain's [_RecursiveCharacterTextSplitter_](https://python.langchain.com/docs/modules/data_connection/document_transformers/recursive_text_splitter/):

- chunk_size: 1500: This parameter specifies that each chunk should contain approximately 1500 characters.
- chunk_overlap: 150: This parameter ensures that there is an overlap of 150 characters between consecutive chunks. This overlap helps maintain context and prevent important information from being split across chunk boundaries.

At the end split_documents method splits the large document into smaller LangChain documents based on above defined parameters.

```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500, chunk_overlap=150
)

doc_pages = text_splitter.split_documents(docs)
```

### Add Documents to Vector Store

We will utilize the vector store created at [Initialize OpenAI and Couchbase Vector Store](#initialize-openai-and-couchbase-vector-store). In this we will add the documents using add_documents method of Couchbase vector store. This method will utilize the OpenAI embeddings to create embeddings(vectors) from text and add it to Couchbase documents in the specified collection.

```python
vector_store.add_documents(doc_pages)
```

The documents are stored in Couchbase with the following structure:
- `text`: The text content of the chunk
- `embedding`: The vector embedding of the text (1536 dimensions for OpenAI embeddings)
- `metadata`: Additional metadata from the PDF (page numbers, source file, etc.)

## Chat With PDF

After uploading the PDF into Couchbase, we are now ready to utilize the power of Couchbase Vector Search with Query Service, RAG and LLM to get context based answers to our questions. When the user asks a question. The assistant (LLM) is called here with RAG context, the response from the assistant is sent back to the user.

### LangChain Expression Language (LCEL)

We will now utilize the power of LangChain Chains using the [LangChain Expression Language](https://python.langchain.com/docs/expression_language/) (LCEL). LCEL makes it easy to build complex chains from basic components, and supports out of the box functionality such as streaming, parallelism, and logging.

LCEL is a domain-specific language that provides several key advantages when working with LangChain:

- Composability: It allows you to easily combine different LangChain components like retrievers, language models, and output parsers into complex workflows.
- Readability: The syntax is concise and expressive, making it easy to understand the flow of operations within a chain or sequence.
- Reusability: You can define reusable sub-chains or components that can be incorporated into larger chains, promoting code reuse and modularity.

In summary, LCEL streamlines the process of building sophisticated natural language processing applications by providing a composable, readable, reusable, extensible, type-safe, and abstracted way to define and orchestrate LangChain components into complex workflows.

We will be using LCEL chains in next few sections and will see how LCEL optimizes our whole workflow.

### Create Retriever Chain

We also create the [retriever](https://python.langchain.com/docs/modules/data_connection/retrievers/vectorstore) of the couchbase vector store. This retriever will be used to retrieve the previously added documents which are similar to current query.

```python
retriever = vector_store.as_retriever()
```

The retriever uses Couchbase's Vector Search with Query Service to perform similarity searches using SQL++ queries. It calculates the cosine distance between the query embedding and document embeddings to find the most relevant chunks.

### Prompt Chain

A prompt for a language model is a set of instructions or input provided by a user to guide the model's response, helping it understand the context and generate relevant and coherent language-based output, such as answering questions, completing sentences, or engaging in a conversation. We will use a template and create a [prompt chain](https://python.langchain.com/docs/modules/model_io/prompts/quick_start/) using [_ChatPromptTemplate_](https://python.langchain.com/docs/modules/model_io/prompts/quick_start/#chatprompttemplate) Class of LangChain

```python
template = """You are a helpful bot. If you cannot answer based on the context provided, respond with a generic answer. Answer the question as truthfully as possible using the context below:
{context}

Question: {question}"""

prompt = ChatPromptTemplate.from_template(template)
```

### LLM Chain

Large Language Models (LLMs) are a core component of LangChain. LangChain does not serve its own LLMs, but rather provides a standard interface for interacting with many LLMs. To be specific, this interface is one that takes as input a string and returns a string. We will use [ChatOpenAI](https://python.langchain.com/docs/integrations/chat/openai/) LLM Model. We can also set other parameters like model, API_KEY, temperature to be used for this model.

```python
# Use OpenAI GPT 4 as the LLM for the RAG
llm = ChatOpenAI(temperature=0, model="gpt-4-1106-preview", streaming=True)
```

### Combining to a single chain

We can combine these different modules to a single chain which will run synchronously. The pipe operator (|) is used to connect these components, forming a chain of operations.

The input dictionary with the "context" and "question" keys is passed through each component. The retriever component retrieves relevant information from the vector store using Couchbase Vector Search, which is then combined with the [question](https://python.langchain.com/docs/expression_language/primitives/passthrough/) to generate a prompt. This prompt is passed to the language model (llm), which generates a response based on both the question and the retrieved context. Finally, the output is parsed into a string by [StrOutputParser()](https://python.langchain.com/docs/modules/model_io/concepts/#stroutputparser).

```python
# RAG chain
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

### Chain without RAG

We will repeat the same process as above however this will not have the context from the vector store. Basically we will directly call LLM from the user question. Basically, every step is same just that we will not use retriever.

```python
template_without_rag = """You are a helpful bot. Answer the question as truthfully as possible.

Question: {question}"""

prompt_without_rag = ChatPromptTemplate.from_template(template_without_rag)

llm_without_rag = ChatOpenAI(model="gpt-4-1106-preview", streaming=True)

chain_without_rag = (
    {"question": RunnablePassthrough()}
    | prompt_without_rag
    | llm_without_rag
    | StrOutputParser()
)
```

### User Asks A Question

This section creates an interactive chat interface where users can ask questions based on the uploaded PDF. The key steps are:

1. Display a chat input box with the prompt "Ask a question based on the PDF".
   When the user submits a question:
2. Display the user's question in the chat interface
   - Add the user's question to the chat history.
   - Create a placeholder for streaming the assistant's response.
   - Use the chain.invoke(question) method to generate the response from the RAG chain.
   - The response is automatically cached by the CouchbaseCache layer.
   - [Stream](https://python.langchain.com/docs/use_cases/question_answering/streaming/) the response in real-time using the custom `stream_string` function.
   - Add the final assistant's response to the chat history.

This setup allows users to have a conversational experience, asking questions related to the uploaded PDF, with responses generated by the RAG chain and streamed in real-time. Both the user's questions and the assistant's responses are displayed in the chat interface, along with their respective roles and avatars.

```python
# React to user input
if question := st.chat_input("Ask a question based on the PDF"):
    # Display user message in chat message container
    st.chat_message("user").markdown(question)

    # Add user message to chat history
    st.session_state.messages.append(
        {"role": "user", "content": question, "avatar": "👤"}
    )

    # Add placeholder for streaming the response
    with st.chat_message("assistant", avatar=couchbase_logo):
        # Get the response from the RAG & stream it
        # In order to cache the response, we need to invoke the chain and cache the response locally
        # as OpenAI does not support streaming from cache yet
        # Ref: https://github.com/langchain-ai/langchain/issues/9762
        rag_response = chain.invoke(question)
        st.write_stream(stream_string(rag_response))

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": rag_response,
            "avatar": couchbase_logo,
        }
    )
```

Note that we use `chain.invoke()` instead of `chain.stream()` to enable caching. The custom `stream_string` function simulates streaming for a better user experience, even when the response is retrieved from the cache.

### Stream Answer without context

Similar to last section, we will get answer from LLM of the user question. Answers from here are also shown in the UI to showcase difference on how using RAG gives better and more context enabled results.

```python
# Get the response from the pure LLM & stream it
pure_llm_response = chain_without_rag.invoke(question)

# Add placeholder for streaming the response
with st.chat_message("ai", avatar="🤖"):
    st.write_stream(stream_string(pure_llm_response))

st.session_state.messages.append(
    {
        "role": "assistant",
        "content": pure_llm_response,
        "avatar": "🤖",
    }
)
```
