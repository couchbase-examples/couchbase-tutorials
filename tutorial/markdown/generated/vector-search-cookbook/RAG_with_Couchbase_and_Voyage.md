---
# frontmatter
path: "/tutorial-openai-voyage-couchbase-rag"
title: Retrieval-Augmented Generation (RAG) with Couchbase, OpenAI, and Voyage
short_title: RAG with Couchbase, OpenAI, and Claude
description:
  - Learn how to build a semantic search engine using Couchbase, OpenAI, and Voyage
  - This tutorial demonstrates how to integrate Couchbase's vector search capabilities with Voyage embeddings and use OpenAI as the language model.
  - You'll understand how to perform Retrieval-Augmented Generation (RAG) using LangChain and Couchbase.
content_type: tutorial
filter: sdk
technology:
  - vector search
tags:
  - Artificial Intelligence
  - LangChain
  - OpenAI
sdk_language:
  - python
length: 60 Mins
---


<!--- *** WARNING ***: Autogenerated markdown file from jupyter notebook. ***DO NOT EDIT THIS FILE***. Changes should be made to the original notebook file. See commit message for source repo. -->


[View Source](https://github.com/couchbase-examples/vector-search-cookbook/tree/main/voyage/RAG_with_Couchbase_and_Voyage.ipynb)

# Introduction
In this guide, we will walk you through building a powerful semantic search engine using Couchbase as the backend database and [Voyage](https://www.voyageai.com/) as the AI-powered embedding and [OpenAI](https://openai.com/) as the language model provider. Semantic search goes beyond simple keyword matching by understanding the context and meaning behind the words in a query, making it an essential tool for applications that require intelligent information retrieval. This tutorial is designed to be beginner-friendly, with clear, step-by-step instructions that will equip you with the knowledge to create a fully functional semantic search system from scratch.

# How to run this tutorial

This tutorial is available as a Jupyter Notebook (`.ipynb` file) that you can run interactively. You can access the original notebook [here](https://github.com/couchbase-examples/vector-search-cookbook/blob/main/voyage/RAG_with_Couchbase_and_Voyage.ipynb).

You can either download the notebook file and run it on [Google Colab](https://colab.research.google.com/) or run it on your system by setting up the Python environment.

# Before you start

## Get Credentials for VoyageAI and OpenAI

* Please follow the [instructions](https://platform.openai.com/docs/quickstart) to generate the OpenAI credentials.
* Please follow the [instructions](https://docs.voyageai.com/docs/api-key-and-installation) to generate the VoyageAI credentials.

## Create and Deploy Your Free Tier Operational cluster on Capella

To get started with Couchbase Capella, create an account and use it to deploy a forever free tier operational cluster. This account provides you with a environment where you can explore and learn about Capella with no time constraint.

To know more, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/create-account.html).

### Couchbase Capella Configuration

When running Couchbase using [Capella](https://cloud.couchbase.com/sign-in), the following prerequisites need to be met.

* Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
* [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

# Setting the Stage: Installing Necessary Libraries
To build our semantic search engine, we need a robust set of tools. The libraries we install handle everything from connecting to databases to performing complex machine learning tasks.


```python
!pip install datasets langchain-couchbase langchain-voyageai langchain-openai
```

    [Output too long, omitted for brevity]

# Importing Necessary Libraries
This block imports all the required libraries and modules used in the notebook. These include libraries for environment management, data handling, natural language processing, interaction with Couchbase, and embeddings generation. Each library serves a specific function, such as managing environment variables, handling datasets, or interacting with the Couchbase database.


```python
import json
import logging
import os
import time
import getpass
from datetime import timedelta
from uuid import uuid4

from couchbase.auth import PasswordAuthenticator
from couchbase.cluster import Cluster
from couchbase.exceptions import (CouchbaseException,
                                  InternalServerFailureException,
                                  QueryIndexAlreadyExistsException)
from couchbase.management.search import SearchIndex
from couchbase.options import ClusterOptions
from datasets import load_dataset
from langchain_core.documents import Document
from langchain_core.globals import set_llm_cache
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_couchbase.cache import CouchbaseCache
from langchain_couchbase.vectorstores import CouchbaseVectorStore
from langchain_openai import ChatOpenAI
from langchain_voyageai import VoyageAIEmbeddings
from tqdm import tqdm
```

# Setup Logging
Logging is configured to track the progress of the script and capture any errors or warnings. This is crucial for debugging and understanding the flow of execution. The logging output includes timestamps, log levels (e.g., INFO, ERROR), and messages that describe what is happening in the script.



```python
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s',force=True)
```

# Loading Sensitive Informnation
In this section, we prompt the user to input essential configuration settings needed for integrating Couchbase with Cohere's API. These settings include sensitive information like API keys, database credentials, and specific configuration names. Instead of hardcoding these details into the script, we request the user to provide them at runtime, ensuring flexibility and security.

The script also validates that all required inputs are provided, raising an error if any crucial information is missing. This approach ensures that your integration is both secure and correctly configured without hardcoding sensitive information, enhancing the overall security and maintainability of your code.


```python
VOYAGE_API_KEY = getpass.getpass('Enter your VoyageAI API key: ')
OPENAI_API_KEY = getpass.getpass('Enter your OpenAI API key: ')
CB_HOST = input('Enter your Couchbase host (default: couchbase://localhost): ') or 'couchbase://localhost'
CB_USERNAME = input('Enter your Couchbase username (default: Administrator): ') or 'Administrator'
CB_PASSWORD = getpass.getpass('Enter your Couchbase password (default: password): ') or 'password'
CB_BUCKET_NAME = input('Enter your Couchbase bucket name (default: vector-search-testing): ') or 'vector-search-testing'
INDEX_NAME = input('Enter your index name (default: vector_search_voyage): ') or 'vector_search_voyage'
SCOPE_NAME = input('Enter your scope name (default: shared): ') or 'shared'
COLLECTION_NAME = input('Enter your collection name (default: voyage): ') or 'voyage'
CACHE_COLLECTION = input('Enter your cache collection name (default: cache): ') or 'cache'

# Verifying that essential environment variables are set
if not VOYAGE_API_KEY:
    raise ValueError("VOYAGE_API_KEY is required.")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is required.")
```

    Enter your VoyageAI API key: ··········
    Enter your OpenAI API key: ··········
    Enter your Couchbase host (default: couchbase://localhost): couchbases://cb.hlcup4o4jmjr55yf.cloud.couchbase.com
    Enter your Couchbase username (default: Administrator): vector-search-rag-demos
    Enter your Couchbase password (default: password): ··········
    Enter your Couchbase bucket name (default: vector-search-testing): 
    Enter your index name (default: vector_search_voyage): 
    Enter your scope name (default: shared): 
    Enter your collection name (default: voyage): 
    Enter your cache collection name (default: cache): 


# Connect to Couchbase
The script attempts to establish a connection to the Couchbase database using the credentials retrieved from the environment variables. Couchbase is a NoSQL database known for its flexibility, scalability, and support for various data models, including document-based storage. The connection is authenticated using a username and password, and the script waits until the connection is fully established before proceeding.





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

    2024-08-29 12:49:44,091 - INFO - Successfully connected to Couchbase


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
            logging.info(f"Collection '{collection_name}' already exists.Skipping creation.")

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

    2024-08-29 12:49:44,316 - INFO - Collection 'voyage' already exists.Skipping creation.
    2024-08-29 12:49:44,354 - INFO - Primary index present or created successfully.
    2024-08-29 12:49:44,997 - INFO - All documents cleared from the collection.
    2024-08-29 12:49:45,035 - INFO - Collection 'cache' already exists.Skipping creation.
    2024-08-29 12:49:45,072 - INFO - Primary index present or created successfully.
    2024-08-29 12:49:45,122 - INFO - All documents cleared from the collection.





    <couchbase.collection.Collection at 0x7ee1dbd96d70>



# Loading Couchbase Vector Search Index

Semantic search requires an efficient way to retrieve relevant documents based on a user's query. This is where the Couchbase **Vector Search Index** comes into play. In this step, we load the Vector Search Index definition from a JSON file, which specifies how the index should be structured. This includes the fields to be indexed, the dimensions of the vectors, and other parameters that determine how the search engine processes queries based on vector similarity.

For more information on creating a vector search index, please follow the [instructions](https://docs.couchbase.com/cloud/vector-search/create-vector-search-index-ui.html).



```python
# If you are running this script locally (not in Google Colab), uncomment the following line
# and provide the path to your index definition file.

# index_definition_path = '/path_to_your_index_file/voyage_index.json'  # Local setup: specify your file path here

# If you are running in Google Colab, use the following code to upload the index definition file
from google.colab import files
print("Upload your index definition file")
uploaded = files.upload()
index_definition_path = list(uploaded.keys())[0]

try:
    with open(index_definition_path, 'r') as file:
        index_definition = json.load(file)
except Exception as e:
    raise ValueError(f"Error loading index definition from {index_definition_path}: {str(e)}")
```

    Upload your index definition file


    Saving voyage_index.json to voyage_index.json


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

            if "collection: 'voyage' doesn't belong to scope: 'shared'" in error_message:
                raise ValueError("Collection 'voyage' does not belong to scope 'shared'. Please check the collection and scope names.")

    except ValueError as ve:
        logging.error(str(ve))
        raise

    except Exception as json_error:
        logging.error(f"Failed to parse the error message: {json_error}")
        raise RuntimeError(f"Internal server error while creating/updating search index: {error_message}")
```

    2024-08-29 12:54:59,624 - INFO - Index 'vector_search_voyage' found
    2024-08-29 12:54:59,808 - INFO - Index 'vector_search_voyage' already exists. Skipping creation/update.


# Load TREC Dataset
The TREC dataset is loaded using the datasets library. TREC is a well-known dataset used in information retrieval and natural language processing (NLP) tasks. In this script, the dataset will be used to generate embeddings, which are numerical representations of text that capture its meaning in a form suitable for machine learning models.



```python
try:
    trec = load_dataset('trec', split='train[:1000]')
    logging.info(f"Successfully loaded TREC dataset with {len(trec)} samples")
except Exception as e:
    raise ValueError(f"Error loading TREC dataset: {str(e)}")
```

    /usr/local/lib/python3.10/dist-packages/huggingface_hub/utils/_token.py:89: UserWarning: 
    The secret `HF_TOKEN` does not exist in your Colab secrets.
    To authenticate with the Hugging Face Hub, create a token in your settings tab (https://huggingface.co/settings/tokens), set it as secret in your Google Colab and restart your session.
    You will be able to reuse this secret in all of your notebooks.
    Please note that authentication is recommended but still optional to access public models or datasets.
      warnings.warn(



    Downloading builder script:   0%|          | 0.00/5.09k [00:00<?, ?B/s]



    Downloading readme:   0%|          | 0.00/10.6k [00:00<?, ?B/s]


    The repository for trec contains custom code which must be executed to correctly load the dataset. You can inspect the repository content at https://hf.co/datasets/trec.
    You can avoid this prompt in future by passing the argument `trust_remote_code=True`.
    
    Do you wish to run the custom code? [y/N] y



    Downloading data:   0%|          | 0.00/336k [00:00<?, ?B/s]



    Downloading data:   0%|          | 0.00/23.4k [00:00<?, ?B/s]



    Generating train split:   0%|          | 0/5452 [00:00<?, ? examples/s]



    Generating test split:   0%|          | 0/500 [00:00<?, ? examples/s]


    2024-08-29 12:55:22,345 - INFO - Successfully loaded TREC dataset with 1000 samples


# Create Embeddings
Embeddings are created using the Voyage API. Embeddings are vectors (arrays of numbers) that represent the meaning of text in a high-dimensional space. These embeddings are crucial for tasks like semantic search, where the goal is to find text that is semantically similar to a query. The script uses a pre-trained model provided by Voyage to generate embeddings for the text in the TREC dataset.


```python
try:
    embeddings = VoyageAIEmbeddings(voyage_api_key=VOYAGE_API_KEY,model="voyage-large-2")
    logging.info("Successfully created VoyageAIEmbeddings")
except Exception as e:
    raise ValueError(f"Error creating VoyageAIEmbeddings: {str(e)}")
```

    2024-08-29 12:55:22,352 - INFO - Successfully created VoyageAIEmbeddings


    batch size None


# Set Up Vector Store
The vector store is set up to manage the embeddings created in the previous step. The vector store is essentially a database optimized for storing and retrieving high-dimensional vectors. In this case, the vector store is built on top of Couchbase, allowing the script to store the embeddings in a way that can be efficiently searched.



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

    2024-08-29 12:55:22,996 - INFO - Successfully created vector store


# Save Data to Vector Store in Batches
To avoid overloading memory, the TREC dataset's text fields are saved to the vector store in batches. This step is important for handling large datasets, as it breaks down the data into manageable chunks that can be processed sequentially. Each piece of text is converted into a document, assigned a unique identifier, and then stored in the vector store.



```python
try:
    batch_size = 50
    for i in tqdm(range(0, len(trec['text']), batch_size), desc="Processing Batches"):
        batch = trec['text'][i:i + batch_size]
        documents = [Document(page_content=text) for text in batch]
        uuids = [str(uuid4()) for _ in range(len(documents))]
        vector_store.add_documents(documents=documents, ids=uuids)
except Exception as e:
    raise RuntimeError(f"Failed to save documents to vector store: {str(e)}")
```

    Processing Batches: 100%|██████████| 20/20 [00:51<00:00,  2.58s/it]


# Set Up Cache
 A cache is set up using Couchbase to store intermediate results and frequently accessed data. Caching is important for improving performance, as it reduces the need to repeatedly calculate or retrieve the same data. The cache is linked to a specific collection in Couchbase, and it is used later in the script to store the results of language model queries.



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

    2024-08-29 12:56:15,179 - INFO - Successfully created cache


# Create Language Model (LLM)
The script initializes a Cohere language model (LLM) that will be used for generating responses to queries. LLMs are powerful tools for natural language understanding and generation, capable of producing human-like text based on input prompts. The model is configured with specific parameters, such as the temperature, which controls the randomness of its outputs.



```python
try:
    llm = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY,
        model="gpt-4o-2024-08-06",
        temperature=0
    )
    logging.info(f"Successfully created OpenAI LLM with model gpt-4o-2024-08-06")
except Exception as e:
    raise ValueError(f"Error creating OpenAI LLM: {str(e)}")
```

    2024-08-29 12:56:15,284 - INFO - Successfully created OpenAI LLM with model gpt-4o-2024-08-06


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
        print(f"Distance: {score:.4f}, Text: {doc.page_content}")

except CouchbaseException as e:
    raise RuntimeError(f"Error performing semantic search: {str(e)}")
except Exception as e:
    raise RuntimeError(f"Unexpected error: {str(e)}")
```

    2024-08-29 12:56:15,670 - INFO - Semantic search completed in 0.38 seconds


    
    Semantic Search Results (completed in 0.38 seconds):
    Distance: 0.8595, Text: Why did the world enter a global depression in 1929 ?
    Distance: 0.8011, Text: When was `` the Great Depression '' ?
    Distance: 0.7282, Text: What were popular songs and types of songs in the 1920s ?
    Distance: 0.7145, Text: What are some of the significant historical events of the 1990s ?
    Distance: 0.7136, Text: What crop failure caused the Irish Famine ?
    Distance: 0.6997, Text: What historical event happened in Dogtown in 1899 ?
    Distance: 0.6914, Text: What happened during the Blackhawk Indian war of 1832 ?
    Distance: 0.6894, Text: What is considered the costliest disaster the insurance industry has ever faced ?
    Distance: 0.6879, Text: What Hollywood dog died in the arms of Jean Harlow in 1932 ?
    Distance: 0.6867, Text: How much was the minimum wage in 1991 ?


# Retrieval-Augmented Generation (RAG) with Couchbase and Langchain
Couchbase and LangChain can be seamlessly integrated to create RAG (Retrieval-Augmented Generation) chains, enhancing the process of generating contextually relevant responses. In this setup, Couchbase serves as the vector store, where embeddings of documents are stored. When a query is made, LangChain retrieves the most relevant documents from Couchbase by comparing the query’s embedding with the stored document embeddings. These documents, which provide contextual information, are then passed to a generative language model within LangChain.

The language model, equipped with the context from the retrieved documents, generates a response that is both informed and contextually accurate. This integration allows the RAG chain to leverage Couchbase’s efficient storage and retrieval capabilities, while LangChain handles the generation of responses based on the context provided by the retrieved documents. Together, they create a powerful system that can deliver highly relevant and accurate answers by combining the strengths of both retrieval and generation.


```python
try:
    template = """You are a helpful bot. If you cannot answer based on the context provided, respond with a generic answer. Answer the question as truthfully as possible using the context below:
    {context}
    Question: {question}"""
    prompt = ChatPromptTemplate.from_template(template)
    rag_chain = (
        {"context": vector_store.as_retriever(), "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    logging.info("Successfully created RAG chain")
except Exception as e:
    raise ValueError(f"Error creating LLM chains: {str(e)}")
```

    2024-08-29 12:56:15,681 - INFO - Successfully created RAG chain



```python
try:
    # Get RAG response
    start_time = time.time()
    rag_response = rag_chain.invoke(query)
    rag_elapsed_time = time.time() - start_time
    logging.info(f"RAG response generated in {rag_elapsed_time:.2f} seconds")

    print(f"RAG Response: {rag_response}")

except CouchbaseException as e:
    raise RuntimeError(f"Error performing semantic search: {str(e)}")
except Exception as e:
    raise RuntimeError(f"Unexpected error: {str(e)}")
```

    2024-08-29 12:56:17,464 - INFO - HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"
    2024-08-29 12:56:17,518 - INFO - RAG response generated in 1.83 seconds


    RAG Response: The Great Depression, which began in 1929, was caused by a combination of factors including the stock market crash of October 1929, bank failures, reduction in consumer spending and investment, and flawed economic policies. These factors led to a severe worldwide economic downturn.


# Using Couchbase as a caching mechanism
Couchbase can be effectively used as a caching mechanism for RAG (Retrieval-Augmented Generation) responses by storing and retrieving precomputed results for specific queries. This approach enhances the system's efficiency and speed, particularly when dealing with repeated or similar queries. When a query is first processed, the RAG chain retrieves relevant documents, generates a response using the language model, and then stores this response in Couchbase, with the query serving as the key.

For subsequent requests with the same query, the system checks Couchbase first. If a cached response is found, it is retrieved directly from Couchbase, bypassing the need to re-run the entire RAG process. This significantly reduces response time because the computationally expensive steps of document retrieval and response generation are skipped. Couchbase's role in this setup is to provide a fast and scalable storage solution for caching these responses, ensuring that frequently asked queries can be answered more quickly and efficiently.


```python
try:
    queries = [
        "How does photosynthesis work?",
        "What is the capital of France?",
        "What caused the 1929 Great Depression?",  # Repeated query
        "How does photosynthesis work?",  # Repeated query
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

    
    Query 1: How does photosynthesis work?


    2024-08-29 12:56:21,284 - INFO - HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"


    Response: Photosynthesis is a process used by plants, algae, and some bacteria to convert light energy, usually from the sun, into chemical energy in the form of glucose. This process involves the absorption of light by chlorophyll, a green pigment in the chloroplasts of plant cells. During photosynthesis, carbon dioxide from the air and water from the soil are combined using the energy from sunlight to produce glucose and oxygen. The overall chemical equation for photosynthesis is:
    
    6CO2 + 6H2O + light energy → C6H12O6 + 6O2
    
    This process is crucial for the survival of plants and for providing oxygen and organic compounds for other living organisms.
    Time taken: 3.80 seconds
    
    Query 2: What is the capital of France?


    2024-08-29 12:56:22,138 - INFO - HTTP Request: POST https://api.openai.com/v1/chat/completions "HTTP/1.1 200 OK"


    Response: The capital of France is Paris.
    Time taken: 0.86 seconds
    
    Query 3: What caused the 1929 Great Depression?
    Response: The Great Depression, which began in 1929, was caused by a combination of factors including the stock market crash of October 1929, bank failures, reduction in consumer spending and investment, and flawed economic policies. These factors led to a severe worldwide economic downturn.
    Time taken: 0.57 seconds
    
    Query 4: How does photosynthesis work?
    Response: Photosynthesis is a process used by plants, algae, and some bacteria to convert light energy, usually from the sun, into chemical energy in the form of glucose. This process involves the absorption of light by chlorophyll, a green pigment in the chloroplasts of plant cells. During photosynthesis, carbon dioxide from the air and water from the soil are combined using the energy from sunlight to produce glucose and oxygen. The overall chemical equation for photosynthesis is:
    
    6CO2 + 6H2O + light energy → C6H12O6 + 6O2
    
    This process is crucial for the survival of plants and for providing oxygen and organic compounds for other living organisms.
    Time taken: 0.42 seconds

