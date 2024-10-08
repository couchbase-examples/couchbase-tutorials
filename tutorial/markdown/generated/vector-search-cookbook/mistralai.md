---
# frontmatter
path: "/tutorial-mistralai-couchbase-vector-search"
title: Using Mistral AI Embeddings with Couchbase Vector Search
short_title: Mistral AI with Couchbase Vector Search
description:
  - Learn how to generate embeddings using Mistral AI and store them in Couchbase.
  - This tutorial demonstrates how to use Couchbase's vector search capabilities with Mistral AI embeddings.
  - You'll understand how to perform vector searches to find relevant documents based on similarity.
content_type: tutorial
filter: sdk
technology:
  - vector search
tags:
  - Artificial Intelligence
  - Mistral AI
sdk_language:
  - python
length: 30 Mins
---


<!--- *** WARNING ***: Autogenerated markdown file from jupyter notebook. ***DO NOT EDIT THIS FILE***. Changes should be made to the original notebook file. See commit message for source repo. -->


[View Source](https://github.com/couchbase-examples/vector-search-cookbook/tree/main/mistralai/mistralai.ipynb)

# Prerequisites
In order to run this tutorial, you will need access to a collection on a Couchbase Cluster either through Couchbase Capella or by running it locally. 


```python
import getpass
couchbase_cluster_url = input("Cluster URL:")
couchbase_username = input("Couchbase username:")
couchbase_password = getpass.getpass("Couchbase password:")
couchbase_bucket = input("Couchbase bucket:")
couchbase_scope = input("Couchbase scope:")
couchbase_collection = input("Couchbase collection:")
```

    Cluster URL: localhost
    Couchbase username: Administrator
    Couchbase password: ········
    Couchbase bucket: mistralai
    Couchbase scope: _default
    Couchbase collection: mistralai


## Imports


```python
from pathlib import Path
from datetime import timedelta
from mistralai import Mistral
from couchbase.auth import PasswordAuthenticator
from couchbase.cluster import Cluster
from couchbase.options import (ClusterOptions, ClusterTimeoutOptions,
                               QueryOptions)
import couchbase.search as search
from couchbase.options import SearchOptions
from couchbase.vector_search import VectorQuery, VectorSearch
import uuid
```

## Couchbase Connection


```python
auth = PasswordAuthenticator(
    couchbase_username,
    couchbase_password
)
```


```python
cluster = Cluster(couchbase_cluster_url, ClusterOptions(auth))
cluster.wait_until_ready(timedelta(seconds=5))

bucket = cluster.bucket(couchbase_bucket)
scope = bucket.scope(couchbase_scope)
collection = scope.collection(couchbase_collection)
```

## Creating Couchbase Vector Search Index
In order to store Mistral embeddings onto a Couchbase Cluster, a vector search index needs to be created first. We included a sample index definition that will work with this tutorial. The definition can be used to create a vector index using Couchbase server web console, on more information on vector indexes, please read [Create a Vector Search Index with the Server Web Console](https://docs.couchbase.com/server/current/vector-search/create-vector-search-index-ui.html). 


```python
search_index_name = couchbase_bucket + "._default.vector_test"
search_index = cluster.search_indexes().get_index(search_index_name)
```

## Mistral Connection
A Mistral API key needs to be obtained and configured in the code before using the Mistral API. The key can be obtained in MistralAI personal cabinet, for more detailed instructions please consult with [Mistral documentation site](https://docs.mistral.ai/).


```python
MISTRAL_API_KEY = getpass.getpass("Mistral API Key:")
mistral_client = Mistral(api_key=MISTRAL_API_KEY)
```

## Embedding Documents
Mistral client can be used to generate vector embeddings for given text fragments. These embeddings represent the sentiment of corresponding fragments and can be stored in Couchbase for further retrieval.


```python
texts = [
    "Couchbase Server is a multipurpose, distributed database that fuses the strengths of relational databases such as SQL and ACID transactions with JSON’s versatility, with a foundation that is extremely fast and scalable.",
    "It’s used across industries for things like user profiles, dynamic product catalogs, GenAI apps, vector search, high-speed caching, and much more."
]
embeddings = mistral_client.embeddings.create(
    model="mistral-embed",
    inputs=texts,
)

print("Output embeddings: " + str(len(embeddings.data)))
```

    Output embeddings: 2


The output `embeddings` is an EmbeddingResponse object with the embeddings and the token usage information:

```
EmbeddingResponse(
    id='eb4c2c739780415bb3af4e47580318cc', object='list', data=[
        Data(object='embedding', embedding=[-0.0165863037109375,...], index=0),
        Data(object='embedding', embedding=[-0.0234222412109375,...], index=1)],
    model='mistral-embed', usage=EmbeddingResponseUsage(prompt_tokens=15, total_tokens=15)
)
```

## Storing Embeddings in Couchbase
Each embedding needs to be stored as a couchbase document. According to provided search index, embedding vector values need to be stored in the `vector` field. The original text of the embedding can be stored in the same document:


```python
for i in range(0, len(texts)):
    doc = {
        "id": str(uuid.uuid4()),
        "text": texts[i],
        "vector": embeddings.data[i].embedding,
    }
    collection.upsert(doc["id"], doc)
```

## Searching For Embeddings
Stored in Couchbase embeddings later can be searched using the vector index to, for example, find text fragments that would be the most relevant to some user-entered prompt:


```python
search_embedding = mistral_client.embeddings.create(
    model="mistral-embed",
    inputs=["name a multipurpose database with distributed capability"],
).data[0]

search_req = search.SearchRequest.create(search.MatchNoneQuery()).with_vector_search(
    VectorSearch.from_vector_query(
        VectorQuery(
            "vector", search_embedding.embedding, num_candidates=1
        )
    )
)
result = scope.search(
    "vector_test", 
    search_req, 
    SearchOptions(
        limit=13, 
        fields=["vector", "id", "text"]
    )
)
for row in result.rows():
    print("Found answer: " + row.id + "; score: " + str(row.score))
    doc = collection.get(row.id)
    print("Answer text: " + doc.value["text"])
    

```

    Found answer: 7a4c24dd-393f-4f08-ae42-69ea7009dcda; score: 1.7320726542316662
    Answer text: Couchbase Server is a multipurpose, distributed database that fuses the strengths of relational databases such as SQL and ACID transactions with JSON’s versatility, with a foundation that is extremely fast and scalable.

