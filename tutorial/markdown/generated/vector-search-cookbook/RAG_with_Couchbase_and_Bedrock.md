---
# frontmatter
path: "/tutorial-aws-bedrock-couchbase-rag"
title: Retrieval-Augmented Generation (RAG) with Couchbase and Amazon Bedrock
short_title: RAG with Couchbase and Amazon Bedrock
description:
  - Learn how to build a semantic search engine using Couchbase and Amazon Bedrock.
  - This tutorial demonstrates how to integrate Couchbase's vector search capabilities with Amazon Bedrock's Titan embeddings and Claude language model.
  - You'll understand how to perform Retrieval-Augmented Generation (RAG) using LangChain and Couchbase.
content_type: tutorial
filter: sdk
technology:
  - vector search
tags:
  - Artificial Intelligence
  - LangChain
  - Amazon Bedrock
sdk_language:
  - python
length: 60 Mins
---


<!--- *** WARNING ***: Autogenerated markdown file from jupyter notebook. ***DO NOT EDIT THIS FILE***. Changes should be made to the original notebook file. See commit message for source repo. -->


[View Source](https://github.com/couchbase-examples/vector-search-cookbook/tree/main/awsbedrock/RAG_with_Couchbase_and_Bedrock.ipynb)

# Introduction

In this guide, we will walk you through building a powerful semantic search engine using Couchbase as the backend database and [Amazon Bedrock](https://aws.amazon.com/bedrock/) as both the embedding and language model provider. Semantic search goes beyond simple keyword matching by understanding the context and meaning behind the words in a query, making it an essential tool for applications that require intelligent information retrieval. This tutorial is designed to be beginner-friendly, with clear, step-by-step instructions that will equip you with the knowledge to create a fully functional semantic search system from scratch.

# How to run this tutorial

This tutorial is available as a Jupyter Notebook (`.ipynb` file) that you can run interactively. You can access the original notebook [here](https://github.com/couchbase-examples/vector-search-cookbook/blob/main/awsbedrock/RAG_with_Couchbase_and_Bedrock.ipynb).

You can either download the notebook file and run it on [Google Colab](https://colab.research.google.com/) or run it on your system by setting up the Python environment.

# Before you start

## Get Credentials for AWS Bedrock
* Please follow the [instructions](https://docs.aws.amazon.com/bedrock/latest/userguide/getting-started.html) to set up AWS Bedrock and generate credentials.
* Ensure you have the necessary IAM permissions to access Bedrock services.

## Create and Deploy Your Free Tier Operational cluster on Capella

To get started with Couchbase Capella, create an account and use it to deploy a forever free tier operational cluster. This account provides you with an environment where you can explore and learn about Capella with no time constraint.

To know more, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/create-account.html).

### Couchbase Capella Configuration

When running Couchbase using [Capella](https://cloud.couchbase.com/sign-in), the following prerequisites need to be met.

* Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
* [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

# Setting the Stage: Installing Necessary Libraries

To build our semantic search engine, we need a robust set of tools. The libraries we install handle everything from connecting to databases to performing complex machine learning tasks.


```python
%pip install --quiet datasets langchain-couchbase langchain-aws boto3 python-dotenv
```

    Note: you may need to restart the kernel to use updated packages.


# Importing Necessary Libraries

The script starts by importing a series of libraries required for various tasks, including handling JSON, logging, time tracking, Couchbase connections, embedding generation, and dataset loading.


```python
import json
import logging
import time
import boto3
import os
from datetime import timedelta
from dotenv import load_dotenv

from couchbase.auth import PasswordAuthenticator
from couchbase.cluster import Cluster
from couchbase.exceptions import CouchbaseException, InternalServerFailureException, QueryIndexAlreadyExistsException
from couchbase.management.search import SearchIndex
from couchbase.options import ClusterOptions
from datasets import load_dataset
from langchain_aws import BedrockEmbeddings
from langchain_aws import ChatBedrock
from langchain_core.globals import set_llm_cache
from langchain_core.prompts.chat import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_couchbase.cache import CouchbaseCache
from langchain_couchbase.vectorstores import CouchbaseVectorStore
from tqdm import tqdm
```

# Setup Logging

Logging is configured to track the progress of the script and capture any errors or warnings.


```python
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', force=True)
```

# Loading Sensitive Informnation
In this section, we prompt the user to input essential configuration settings needed. These settings include sensitive information like AWS credentials, database credentials, and specific configuration names. Instead of hardcoding these details into the script, we request the user to provide them at runtime, ensuring flexibility and security.

The script also validates that all required inputs are provided, raising an error if any crucial information is missing. This approach ensures that your integration is both secure and correctly configured without hardcoding sensitive information, enhancing the overall security and maintainability of your code.


```python
import getpass

# Load environment variables from .env file if it exists
load_dotenv()

# AWS Credentials
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID') or input('Enter your AWS Access Key ID: ')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY') or getpass.getpass('Enter your AWS Secret Access Key: ')
AWS_REGION = os.getenv('AWS_REGION') or input('Enter your AWS region (default: us-east-1): ') or 'us-east-1'

# Couchbase Settings
CB_HOST = os.getenv('CB_HOST') or input('Enter your Couchbase host (default: couchbase://localhost): ') or 'couchbase://localhost'
CB_USERNAME = os.getenv('CB_USERNAME') or input('Enter your Couchbase username (default: Administrator): ') or 'Administrator'
CB_PASSWORD = os.getenv('CB_PASSWORD') or getpass.getpass('Enter your Couchbase password (default: password): ') or 'password'
CB_BUCKET_NAME = os.getenv('CB_BUCKET_NAME') or input('Enter your Couchbase bucket name (default: vector-search-testing): ') or 'vector-search-testing'
INDEX_NAME = os.getenv('INDEX_NAME') or input('Enter your index name (default: vector_search_bedrock): ') or 'vector_search_bedrock'
SCOPE_NAME = os.getenv('SCOPE_NAME') or input('Enter your scope name (default: shared): ') or 'shared'
COLLECTION_NAME = os.getenv('COLLECTION_NAME') or input('Enter your collection name (default: bedrock): ') or 'bedrock'
CACHE_COLLECTION = os.getenv('CACHE_COLLECTION') or input('Enter your cache collection name (default: cache): ') or 'cache'

# Check if required credentials are set
for cred_name, cred_value in {
    'AWS_ACCESS_KEY_ID': AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': AWS_SECRET_ACCESS_KEY, 
    'CB_HOST': CB_HOST,
    'CB_USERNAME': CB_USERNAME,
    'CB_PASSWORD': CB_PASSWORD,
    'CB_BUCKET_NAME': CB_BUCKET_NAME
}.items():
    if not cred_value:
        raise ValueError(f"{cred_name} is not set")
```

# Connecting to the Couchbase Cluster
Connecting to a Couchbase cluster is the foundation of our project. Couchbase will serve as our primary data store, handling all the storage and retrieval operations required for our semantic search engine. By establishing this connection, we enable our application to interact with the database, allowing us to perform operations such as storing embeddings, querying data, and managing collections. This connection is the gateway through which all data will flow, so ensuring it's set up correctly is paramount.




```python
try:
    auth = PasswordAuthenticator(CB_USERNAME, CB_PASSWORD)
    options = ClusterOptions(auth)
    cluster = Cluster(CB_HOST, options)
    cluster.wait_until_ready(timedelta(seconds=5))
    logging.info("Successfully connected to Couchbase")
except Exception as e:
    raise ConnectionError(f"Failed to connect to Couchbase: {str(e)}")
```

    2024-12-12 03:10:13,958 - INFO - Successfully connected to Couchbase


# Setting Up Collections in Couchbase
In Couchbase, data is organized in buckets, which can be further divided into scopes and collections. Think of a collection as a table in a traditional SQL database. Before we can store any data, we need to ensure that our collections exist. If they don't, we must create them. This step is important because it prepares the database to handle the specific types of data our application will process. By setting up collections, we define the structure of our data storage, which is essential for efficient data retrieval and management.

Moreover, setting up collections allows us to isolate different types of data within the same bucket, providing a more organized and scalable data structure. This is particularly useful when dealing with large datasets, as it ensures that related data is stored together, making it easier to manage and query.


```python
def setup_collection(cluster, bucket_name, scope_name, collection_name):
    try:
        bucket = cluster.bucket(bucket_name)
        bucket_manager = bucket.collections()

        # Check if collection exists, create if it doesn't
        collections = bucket_manager.get_all_scopes()
        collection_exists = any(
            scope.name == scope_name and collection_name in [col.name for col in scope.collections]
            for scope in collections
        )

        if not collection_exists:
            logging.info(f"Collection '{collection_name}' does not exist. Creating it...")
            bucket_manager.create_collection(scope_name, collection_name)
            logging.info(f"Collection '{collection_name}' created successfully.")
        else:
            logging.info(f"Collection '{collection_name}' already exists. Skipping creation.")

        collection = bucket.scope(scope_name).collection(collection_name)

        # Ensure primary index exists
        try:
            cluster.query(f"CREATE PRIMARY INDEX IF NOT EXISTS ON `{bucket_name}`.`{scope_name}`.`{collection_name}`").execute()
            logging.info("Primary index present or created successfully.")
        except Exception as e:
            logging.warning(f"Error creating primary index: {str(e)}")

        # Clear all documents in the collection
        try:
            query = f"DELETE FROM `{bucket_name}`.`{scope_name}`.`{collection_name}`"
            cluster.query(query).execute()
            logging.info("All documents cleared from the collection.")
        except Exception as e:
            logging.warning(f"Error while clearing documents: {str(e)}. The collection might be empty.")

        return collection
    except Exception as e:
        raise RuntimeError(f"Error setting up collection: {str(e)}")

setup_collection(cluster, CB_BUCKET_NAME, SCOPE_NAME, COLLECTION_NAME)
setup_collection(cluster, CB_BUCKET_NAME, SCOPE_NAME, CACHE_COLLECTION)
```

    2024-12-12 03:10:16,318 - INFO - Collection 'bedrock' already exists. Skipping creation.
    2024-12-12 03:10:17,611 - INFO - Primary index present or created successfully.
    2024-12-12 03:10:18,661 - INFO - All documents cleared from the collection.
    2024-12-12 03:10:20,076 - INFO - Collection 'cache' already exists. Skipping creation.
    2024-12-12 03:10:21,386 - INFO - Primary index present or created successfully.
    2024-12-12 03:10:21,666 - INFO - All documents cleared from the collection.





    <couchbase.collection.Collection at 0x13f9dd890>



# Loading Couchbase Vector Search Index

Semantic search requires an efficient way to retrieve relevant documents based on a user's query. This is where the Couchbase **Vector Search Index** comes into play. In this step, we load the Vector Search Index definition from a JSON file, which specifies how the index should be structured. This includes the fields to be indexed, the dimensions of the vectors, and other parameters that determine how the search engine processes queries based on vector similarity.

This AWS Bedrock vector search index configuration requires specific default settings to function properly. This tutorial uses the bucket named `vector-search-testing` with the scope `shared` and collection `bedrock`. The configuration is set up for vectors with exactly 1024 dimensions, using dot product similarity and optimized for recall. If you want to use a different bucket, scope, or collection, you will need to modify the index configuration accordingly.

For more information on creating a vector search index, please follow the [instructions](https://docs.couchbase.com/cloud/vector-search/create-vector-search-index-ui.html).



```python
try:
    with open('aws_index.json', 'r') as file:
        index_definition = json.load(file)
except Exception as e:
    raise ValueError(f"Error loading index definition: {str(e)}")
```

# Creating or Updating Search Indexes

With the index definition loaded, the next step is to create or update the **Vector Search Index** in Couchbase. This step is crucial because it optimizes our database for vector similarity search operations, allowing us to perform searches based on the semantic content of documents rather than just keywords. By creating or updating a Vector Search Index, we enable our search engine to handle complex queries that involve finding semantically similar documents using vector embeddings, which is essential for a robust semantic search engine.


```python
try:
    scope_index_manager = cluster.bucket(CB_BUCKET_NAME).scope(SCOPE_NAME).search_indexes()

    # Check if index already exists
    existing_indexes = scope_index_manager.get_all_indexes()
    index_name = index_definition["name"]

    if index_name in [index.name for index in existing_indexes]:
        logging.info(f"Index '{index_name}' found")
    else:
        logging.info(f"Creating new index '{index_name}'...")

    # Create SearchIndex object from JSON definition
    search_index = SearchIndex.from_json(index_definition)

    # Upsert the index (create if not exists, update if exists)
    scope_index_manager.upsert_index(search_index)
    logging.info(f"Index '{index_name}' successfully created/updated.")

except QueryIndexAlreadyExistsException:
    logging.info(f"Index '{index_name}' already exists. Skipping creation/update.")

except InternalServerFailureException as e:
    error_message = str(e)
    logging.error(f"InternalServerFailureException raised: {error_message}")

    try:
        # Accessing the response_body attribute from the context
        error_context = e.context
        response_body = error_context.response_body
        if response_body:
            error_details = json.loads(response_body)
            error_message = error_details.get('error', '')

            if "collection: 'bedrock' doesn't belong to scope: 'shared'" in error_message:
                raise ValueError("Collection 'bedrock' does not belong to scope 'shared'. Please check the collection and scope names.")

    except ValueError as ve:
        logging.error(str(ve))
        raise

    except Exception as json_error:
        logging.error(f"Failed to parse the error message: {json_error}")
        raise RuntimeError(f"Internal server error while creating/updating search index: {error_message}")
```

    2024-12-12 03:10:22,891 - INFO - Index 'vector_search_bedrock' found
    2024-12-12 03:10:23,583 - INFO - Index 'vector_search_bedrock' already exists. Skipping creation/update.


# Load the TREC Dataset
To build a search engine, we need data to search through. We use the TREC dataset, a well-known benchmark in the field of information retrieval. This dataset contains a wide variety of text data that we'll use to train our search engine. Loading the dataset is a crucial step because it provides the raw material that our search engine will work with. The quality and diversity of the data in the TREC dataset make it an excellent choice for testing and refining our search engine, ensuring that it can handle a wide range of queries effectively.

The TREC dataset's rich content allows us to simulate real-world scenarios where users ask complex questions, enabling us to fine-tune our search engine's ability to understand and respond to various types of queries.


```python
try:
    trec = load_dataset('trec', split='train[:1000]')
    logging.info(f"Successfully loaded TREC dataset with {len(trec)} samples")
except Exception as e:
    raise ValueError(f"Error loading TREC dataset: {str(e)}")
```

    2024-12-12 03:10:28,959 - INFO - Successfully loaded TREC dataset with 1000 samples


# Creating Amazon Bedrock Client and Embeddings

Embeddings are at the heart of semantic search. They are numerical representations of text that capture the semantic meaning of the words and phrases. We'll use Amazon Bedrock's Titan embedding model for embeddings.

## Using Amazon Bedrock's Titan Model

Language models are AI systems that are trained to understand and generate human language. We'll be using Amazon Bedrock's Titan model to process user queries and generate meaningful responses. The Titan model family includes both embedding models for converting text into vector representations and text generation models for producing human-like responses.

Key features of Amazon Bedrock's Titan models:
- Titan Embeddings model for embedding vector generation
- Titan Text model for natural language understanding and generation
- Seamless integration with AWS infrastructure
- Enterprise-grade security and scalability


```python
try:
    bedrock_client = boto3.client(
        service_name='bedrock-runtime',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    embeddings = BedrockEmbeddings(
        client=bedrock_client,
        model_id="amazon.titan-embed-text-v2:0"
    )
    logging.info("Successfully created Bedrock embeddings client")
except Exception as e:
    raise ValueError(f"Error creating Bedrock embeddings client: {str(e)}")
```

    2024-12-12 03:10:29,148 - INFO - Successfully created Bedrock embeddings client


#  Setting Up the Couchbase Vector Store
A vector store is where we'll keep our embeddings. Unlike the FTS index, which is used for text-based search, the vector store is specifically designed to handle embeddings and perform similarity searches. When a user inputs a query, the search engine converts the query into an embedding and compares it against the embeddings stored in the vector store. This allows the engine to find documents that are semantically similar to the query, even if they don't contain the exact same words. By setting up the vector store in Couchbase, we create a powerful tool that enables our search engine to understand and retrieve information based on the meaning and context of the query, rather than just the specific words used.


```python
try:
    vector_store = CouchbaseVectorStore(
        cluster=cluster,
        bucket_name=CB_BUCKET_NAME,
        scope_name=SCOPE_NAME,
        collection_name=COLLECTION_NAME,
        embedding=embeddings,
        index_name=INDEX_NAME,
    )
    logging.info("Successfully created vector store")
except Exception as e:
    raise ValueError(f"Failed to create vector store: {str(e)}")
```

    2024-12-12 03:10:32,885 - INFO - Successfully created vector store


# Saving Data to the Vector Store
With the vector store set up, the next step is to populate it with data. We save the TREC dataset to the vector store in batches. This method is efficient and ensures that our search engine can handle large datasets without running into performance issues. By saving the data in this way, we prepare our search engine to quickly and accurately respond to user queries. This step is essential for making the dataset searchable, transforming raw data into a format that can be easily queried by our search engine.

Batch processing is particularly important when dealing with large datasets, as it prevents memory overload and ensures that the data is stored in a structured and retrievable manner. This approach not only optimizes performance but also ensures the scalability of our system.


```python
try:
    batch_size = 50
    vector_store.add_texts(
        texts=trec['text'],
        batch_size=batch_size,
    )
except Exception as e:
    raise RuntimeError(f"Failed to save documents to vector store: {str(e)}")
```

# Setting Up a Couchbase Cache
To further optimize our system, we set up a Couchbase-based cache. A cache is a temporary storage layer that holds data that is frequently accessed, speeding up operations by reducing the need to repeatedly retrieve the same information from the database. In our setup, the cache will help us accelerate repetitive tasks, such as looking up similar documents. By implementing a cache, we enhance the overall performance of our search engine, ensuring that it can handle high query volumes and deliver results quickly.

Caching is particularly valuable in scenarios where users may submit similar queries multiple times or where certain pieces of information are frequently requested. By storing these in a cache, we can significantly reduce the time it takes to respond to these queries, improving the user experience.



```python
try:
    cache = CouchbaseCache(
        cluster=cluster,
        bucket_name=CB_BUCKET_NAME,
        scope_name=SCOPE_NAME,
        collection_name=CACHE_COLLECTION,
    )
    logging.info("Successfully created cache")
    set_llm_cache(cache)
except Exception as e:
    raise ValueError(f"Failed to create cache: {str(e)}")
```

    2024-12-12 03:16:20,311 - INFO - Successfully created cache


# Using Amazon Bedrock's Titan Text Express v1 Model

Amazon Bedrock's Titan Text Express v1 is a state-of-the-art foundation model designed for fast and efficient text generation tasks. This model excels at:

- Text generation and completion
- Question answering 
- Summarization
- Content rewriting
- Analysis and extraction

Key features of Titan Text Express v1:

- Optimized for low-latency responses while maintaining high quality output
- Supports up to 8K tokens context window
- Built-in content filtering and safety controls
- Cost-effective compared to larger models
- Seamlessly integrates with AWS services

The model uses a temperature parameter (0-1) to control randomness in responses:
- Lower values (e.g. 0) produce more focused, deterministic outputs
- Higher values introduce more creativity and variation

We'll be using this model through Amazon Bedrock's API to process user queries and generate contextually relevant responses based on our vector database content.


```python
try:
    llm = ChatBedrock(
        client=bedrock_client,
        model_id="amazon.titan-text-express-v1",
        model_kwargs={"temperature": 0}
    )
    logging.info("Successfully created Bedrock LLM client")
except Exception as e:
    logging.error(f"Error creating Bedrock LLM client: {str(e)}. Please check your AWS credentials and Bedrock access.")
    raise
```

    2024-12-12 03:16:20,326 - INFO - Successfully created Bedrock LLM client


# Perform Semantic Search
Semantic search in Couchbase involves converting queries and documents into vector representations using an embeddings model. These vectors capture the semantic meaning of the text and are stored directly in Couchbase. When a query is made, Couchbase performs a similarity search by comparing the query vector against the stored document vectors. The similarity metric used for this comparison is configurable, allowing flexibility in how the relevance of documents is determined. Common metrics include cosine similarity, Euclidean distance, or dot product, but other metrics can be implemented based on specific use cases. Different embedding models like BERT, Word2Vec, or GloVe can also be used depending on the application's needs, with the vectors generated by these models stored and searched within Couchbase itself.

In the provided code, the search process begins by recording the start time, followed by executing the similarity_search_with_score method of the CouchbaseVectorStore. This method searches Couchbase for the most relevant documents based on the vector similarity to the query. The search results include the document content and a similarity score that reflects how closely each document aligns with the query in the defined semantic space. The time taken to perform this search is then calculated and logged, and the results are displayed, showing the most relevant documents along with their similarity scores. This approach leverages Couchbase as both a storage and retrieval engine for vector data, enabling efficient and scalable semantic searches. The integration of vector storage and search capabilities within Couchbase allows for sophisticated semantic search operations without relying on external services for vector storage or comparison.


```python
query = "What caused the 1929 Great Depression?"

try:
    # Perform the semantic search
    start_time = time.time()
    search_results = vector_store.similarity_search_with_score(query, k=10)
    search_elapsed_time = time.time() - start_time

    logging.info(f"Semantic search completed in {search_elapsed_time:.2f} seconds")

    # Display search results
    print(f"\nSemantic Search Results (completed in {search_elapsed_time:.2f} seconds):")

    for doc, score in search_results:
        print(f"Score: {score:.4f}, Text: {doc.page_content}")

except CouchbaseException as e:
    raise RuntimeError(f"Error performing semantic search: {str(e)}")
except Exception as e:
    raise RuntimeError(f"Unexpected error: {str(e)}")
```

    2024-12-12 03:16:21,649 - INFO - Semantic search completed in 1.32 seconds


    
    Semantic Search Results (completed in 1.32 seconds):
    Score: 0.7606, Text: Why did the world enter a global depression in 1929 ?
    Score: 0.5613, Text: When was `` the Great Depression '' ?
    Score: 0.2063, Text: What were popular songs and types of songs in the 1920s ?
    Score: 0.1765, Text: What historical event happened in Dogtown in 1899 ?
    Score: 0.1585, Text: What astronomical phenomenon takes place in Jan. 1999 ?
    Score: 0.1525, Text: What part did John Peter Zenger play in the deveopment of the newspaper in America ?
    Score: 0.1414, Text: What are some of the significant historical events of the 1990s ?
    Score: 0.1396, Text: How long should a person wash their hands before they are clean ?
    Score: 0.1307, Text: What war did the Wanna-Go-Home Riots occur after ?
    Score: 0.1291, Text: What is a Canada two-penny black ?


# Retrieval-Augmented Generation (RAG) with Couchbase and LangChain
Couchbase and LangChain can be seamlessly integrated to create RAG (Retrieval-Augmented Generation) chains, enhancing the process of generating contextually relevant responses. In this setup, Couchbase serves as the vector store, where embeddings of documents are stored. When a query is made, LangChain retrieves the most relevant documents from Couchbase by comparing the query’s embedding with the stored document embeddings. These documents, which provide contextual information, are then passed to a generative language model within LangChain.

The language model, equipped with the context from the retrieved documents, generates a response that is both informed and contextually accurate. This integration allows the RAG chain to leverage Couchbase’s efficient storage and retrieval capabilities, while LangChain handles the generation of responses based on the context provided by the retrieved documents. Together, they create a powerful system that can deliver highly relevant and accurate answers by combining the strengths of both retrieval and generation.


```python
# Create retriever from vector store
retriever = vector_store.as_retriever(
    search_type="similarity", 
    search_kwargs={"k": 4}
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Create RAG prompt template
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant that answers questions based on the provided context."),
    ("human", "Context: {context}\n\nQuestion: {question}")
])

# Create RAG chain
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | rag_prompt
    | llm
    | StrOutputParser()
)
logging.info("Successfully created RAG chain")
```

    2024-12-12 03:16:21,655 - INFO - Successfully created RAG chain



```python
start_time = time.time()
rag_response = rag_chain.invoke(query)
rag_elapsed_time = time.time() - start_time

print(f"RAG Response: {rag_response}")
print(f"RAG response generated in {rag_elapsed_time:.2f} seconds")
```

    RAG Response:  The stock market crash of 1929, which wiped out billions of dollars of investors' wealth, was a significant factor in the Great Depression.
    RAG response generated in 4.39 seconds


# Using Couchbase as a caching mechanism
Couchbase can be effectively used as a caching mechanism for RAG (Retrieval-Augmented Generation) responses by storing and retrieving precomputed results for specific queries. This approach enhances the system's efficiency and speed, particularly when dealing with repeated or similar queries. When a query is first processed, the RAG chain retrieves relevant documents, generates a response using the language model, and then stores this response in Couchbase, with the query serving as the key.

For subsequent requests with the same query, the system checks Couchbase first. If a cached response is found, it is retrieved directly from Couchbase, bypassing the need to re-run the entire RAG process. This significantly reduces response time because the computationally expensive steps of document retrieval and response generation are skipped. Couchbase's role in this setup is to provide a fast and scalable storage solution for caching these responses, ensuring that frequently asked queries can be answered more quickly and efficiently.



```python
try:
    queries = [
        "Why do heavier objects travel downhill faster?",
        "What caused the 1929 Great Depression?", # Repeated query
        "Why do heavier objects travel downhill faster?",  # Repeated query
    ]

    for i, query in enumerate(queries, 1):
        print(f"\nQuery {i}: {query}")
        start_time = time.time()

        response = rag_chain.invoke(query)
        elapsed_time = time.time() - start_time
        print(f"Response: {response}")
        print(f"Time taken: {elapsed_time:.2f} seconds")

except Exception as e:
    raise ValueError(f"Error generating RAG response: {str(e)}")
```

    
    Query 1: Why do heavier objects travel downhill faster?
    Response:  The force of gravity is the reason why heavier objects travel downhill faster. The force of gravity is stronger at higher altitudes, which means that objects with greater mass will experience a stronger gravitational pull and accelerate faster than lighter objects.
    Time taken: 4.64 seconds
    
    Query 2: What caused the 1929 Great Depression?
    Response:  The stock market crash of 1929, which wiped out billions of dollars of investors' wealth, was a significant factor in the Great Depression.
    Time taken: 1.62 seconds
    
    Query 3: Why do heavier objects travel downhill faster?
    Response:  The force of gravity is the reason why heavier objects travel downhill faster. The force of gravity is stronger at higher altitudes, which means that objects with greater mass will experience a stronger gravitational pull and accelerate faster than lighter objects.
    Time taken: 1.73 seconds
