---
# frontmatter
path: "/tutorial-csharp-semantic-kernel-vector-search"
# title and description do not need to be added to markdown, start with H2 (##)
title: Build Vector Search with Couchbase .NET Semantic Kernel Connector and OpenAI
short_title: Vector Search with Semantic Kernel
description:
  - Build a semantic search application using Couchbase BHIVE vector index with Semantic Kernel.
  - Learn to use the Couchbase .NET Vector Store Connector for Microsoft Semantic Kernel.
  - Discover how to generate embeddings with OpenAI and store them in Couchbase.
  - Perform vector similarity searches with filtering using SQL++ and ANN_DISTANCE.
content_type: tutorial
filter: sdk
technology:
  - fts
  - kv
tags:
  - Semantic Kernel
  - OpenAI
  - Artificial Intelligence
sdk_language:
  - csharp
length: 30 Mins
---

## Repository Links

- **Connector Repository**: [couchbase-semantic-kernel](https://github.com/Couchbase-Ecosystem/couchbase-semantic-kernel) - The official Couchbase .NET Vector Store Connector for Microsoft Semantic Kernel
- **This Example**: [CouchbaseVectorSearchDemo](https://github.com/Couchbase-Ecosystem/couchbase-semantic-kernel/tree/Support-Bhive-and-Composite-Index/CouchbaseVectorSearchDemo) - Complete working example demonstrating vector search with Couchbase

## Introduction

This demo showcases the **Semantic Kernel Couchbase connector** - a .NET library that bridges Microsoft's Semantic Kernel framework with Couchbase's vector search capabilities. The connector provides a seamless integration that allows developers to build AI-powered applications using familiar Semantic Kernel abstractions while leveraging Couchbase's vector indexing for high-performance semantic search.

The connector supports three index types:
- **BHIVE** (Hyperscale Vector Index) - for pure vector search at scale ← *Used in this demo*
- **Composite Vector Index** - for vector search with heavy scalar filtering
- **FTS** (Full-Text Search) - for hybrid text + semantic search

This makes the connector ideal for RAG (Retrieval-Augmented Generation) applications, semantic search engines, hybrid search, and recommendation systems.

## Prerequisites

### 1. Couchbase Server Setup
- **Couchbase Server 8.0+**
- Local installation or Couchbase Cloud/Capella
- Bucket with proper read/write permissions
- Query service enabled for SQL++ operations

### 2. OpenAI API Access
- **OpenAI API Key** - Get one from: https://platform.openai.com/api-keys
- Used for generating text embeddings with `text-embedding-ada-002` model
- Ensure you have sufficient API quota for embedding generation

### 3. Development Environment
- **.NET 8.0** or later
- Visual Studio, VS Code, or JetBrains Rider
- Basic understanding of C# and vector databases


## Setting Up the Environment

### 1. Clone and Navigate
```bash
git clone https://github.com/Couchbase-Ecosystem/couchbase-semantic-kernel.git
cd couchbase-semantic-kernel/CouchbaseVectorSearchDemo
```

### 2. Install Dependencies
```bash
dotnet restore
```

### 3. Configuration Setup

Update `appsettings.Development.json` with your credentials:

```json
{
  "OpenAI": {
    "ApiKey": "your-openai-api-key-here",
    "EmbeddingModel": "text-embedding-ada-002"
  },
  "Couchbase": {
    "ConnectionString": "couchbase://localhost",
    "Username": "Administrator", 
    "Password": "your-password",
    "BucketName": "demo",
    "ScopeName": "semantic-kernel",
    "CollectionName": "glossary"
  }
}
```

## Understanding the Data Model

The demo uses a `Glossary` class that demonstrates Semantic Kernel's vector store data model. The model uses attributes to define how properties are stored and indexed in the vector database.

For a comprehensive guide on data modeling in Semantic Kernel, refer to [Defining your data model](https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/defining-your-data-model?pivots=programming-language-csharp) in the official documentation.

### The Glossary Model

```csharp
internal sealed class Glossary
{
    [VectorStoreKey]                    
    public string Key { get; set; }
    
    [VectorStoreData(IsIndexed = true)] 
    public string Category { get; set; }
    
    [VectorStoreData]                   
    public string Term { get; set; }
    
    [VectorStoreData]                   
    public string Definition { get; set; }
    
    [VectorStoreVector(Dimensions: 1536)]
    public ReadOnlyMemory<float> DefinitionEmbedding { get; set; }
}
```

## Step-by-Step Tutorial

### Step 1: Prepare Couchbase

Ensure you have the bucket, scope, and collection ready in Couchbase:
- **Bucket**: `demo`
- **Scope**: `semantic-kernel`
- **Collection**: `glossary`

### Step 2: Data Ingestion and Embedding Generation

This step demonstrates how the connector works with Semantic Kernel's vector store abstractions:

**Getting the Collection** - The demo uses `CouchbaseVectorStore.GetCollection<TKey, TRecord>()` to obtain a collection reference configured for BHIVE index:
```csharp
var vectorStore = new CouchbaseVectorStore(scope);
var collection = vectorStore.GetCollection<string, Glossary>(
    "glossary", 
    new CouchbaseQueryCollectionOptions 
    {
        IndexName = "bhive_glossary_index",  // BHIVE index name
        SimilarityMetric = "cosine"
    }
);
```

The `CouchbaseQueryCollectionOptions` works with both BHIVE and composite indexes - simply specify the appropriate index name. For FTS indexes, use `CouchbaseSearchCollection` with `CouchbaseSearchCollectionOptions` instead.

**Automatic Embedding Generation** - The connector integrates with Semantic Kernel's `IEmbeddingGenerator` interface to automatically generate embeddings from text. When you provide an embedding generator (in this case, OpenAI's `text-embedding-ada-002`), the text is automatically converted to vectors:

```csharp
// Generate embedding from text
var embedding = await embeddingGenerator.GenerateAsync(glossary.Definition);
glossary.DefinitionEmbedding = embedding.Vector;
```

For more details on embedding generation in Semantic Kernel, see [Embedding Generation Documentation](https://learn.microsoft.com/en-us/semantic-kernel/concepts/vector-store-connectors/embedding-generation?pivots=programming-language-csharp).

**Upserting Records** - The demo uses the connector's `UpsertAsync()` method to insert or update records in the collection:
```csharp
await collection.UpsertAsync(glossaryEntries);
```

This creates 6 sample glossary entries with technical terms, generates embeddings for each definition, and stores them in Couchbase with the following structure:

**Document ID:** `"1"` (from Key field)
**Document Content:**
```json
{
  "Category": "Software",
  "Term": "API",
  "Definition": "Application Programming Interface. A set of rules...",
  "DefinitionEmbedding": [0.123, -0.456, 0.789, ...] // 1536 floats
}
```

### Step 3: BHIVE Index Creation

This demo uses a **BHIVE (Hyperscale Vector Index)** - optimized for pure vector searches without heavy scalar filtering. After documents are inserted, the demo creates the BHIVE index:

```sql
CREATE VECTOR INDEX `bhive_glossary_index` 
ON `demo`.`semantic-kernel`.`glossary` (DefinitionEmbedding VECTOR) 
INCLUDE (Category, Term, Definition)
USING GSI WITH {
    "dimension": 1536,
    "similarity": "cosine", 
    "description": "IVF,SQ8"
}
```

**BHIVE Index Configuration:**
- **Index Type**: BHIVE (Hyperscale Vector Index) - best for pure vector similarity searches
- **Vector Field**: `DefinitionEmbedding` (1536 dimensions)
- **Similarity**: `cosine` (optimal for OpenAI embeddings)
- **Include Fields**: Non-vector fields for faster retrieval
- **Quantization**: `IVF,SQ8` (Inverted File with 8-bit scalar quantization)

> **Note**: Composite vector indexes can be created similarly by adding scalar fields to the index definition. Use composite indexes when your queries frequently filter on scalar values before vector comparison. For this demo, we use BHIVE since we're demonstrating pure semantic search capabilities.

### Step 4: Vector Search Operations

The demo performs two types of searches using the connector's `SearchAsync()` method with the BHIVE index:

#### Pure Vector Search

Using the connector's search API:
```csharp
// Generate embedding from search query
var searchVector = (await embeddingGenerator.GenerateAsync(
    "What is an Application Programming Interface?")).Vector;

// Search using the connector
var results = await collection.SearchAsync(searchVector, top: 1)
    .ToListAsync();
```

Behind the scenes, this executes a SQL++ query with `ANN_DISTANCE`:
```sql
SELECT META().id AS _id, Category, Term, Definition,
       ANN_DISTANCE(DefinitionEmbedding, [0.1,0.2,...], 'cosine') AS _distance
FROM `demo`.`semantic-kernel`.`glossary`
ORDER BY _distance ASC
LIMIT 1
```

**Expected Result**: Finds "API" entry with high similarity

#### Filtered Vector Search

Even with a BHIVE index (designed for pure vector search), the connector supports filtering using LINQ expressions with `VectorSearchOptions`:
```csharp
// Search with scalar filter
var results = await collection.SearchAsync(
    searchVector, 
    top: 1,
    new VectorSearchOptions<Glossary>
    {
        Filter = g => g.Category == "AI"
    }).ToListAsync();
```

This translates to SQL++ with a WHERE clause:
```sql
SELECT META().id AS _id, Category, Term, Definition,
       ANN_DISTANCE(DefinitionEmbedding, [0.1,0.2,...], 'cosine') AS _distance  
FROM `demo`.`semantic-kernel`.`glossary`
WHERE Category = 'AI'
ORDER BY _distance ASC
LIMIT 1
```

**Query**: *"How do I provide additional context to an LLM?"*  
**Expected Result**: Finds "RAG" entry within AI category

> **Note**: While BHIVE indexes support filtering as shown above, for scenarios where you frequently filter on scalar values with highly selective filters, consider using a **composite vector index** instead. The index creation syntax is similar - just add the scalar fields to the index definition. The connector's `SearchAsync()` method works identically with both index types.

## Understanding Vector Index Configuration

Couchbase offers three types of vector indexes optimized for different use cases:

### Index Types

**1. Hyperscale Vector Indexes (BHIVE)** ← *This demo uses BHIVE*
- Uses SQL++ queries via `CouchbaseQueryCollection`
- Best for pure vector searches without complex scalar filtering
- Designed to scale to billions of vectors with low memory footprint
- Optimized for high-performance concurrent operations
- Ideal for: Large-scale semantic search, recommendations, content discovery
- **Creation**: Using SQL++ `CREATE VECTOR INDEX` as shown in Step 3

**2. Composite Vector Indexes**
- Uses SQL++ queries via `CouchbaseQueryCollection`
- Best for filtered vector searches combining vector similarity with scalar filters
- Efficient when scalar filters significantly reduce the search space
- Ideal for: Compliance filtering, user-specific searches, time-bounded queries
- **Creation**: Similar to BHIVE but includes scalar fields in the index definition

**3. FTS (Full-Text Search) Indexes**
- Uses Couchbase Search API via `CouchbaseSearchCollection`
- Best for hybrid search scenarios combining full-text search with vector similarity
- Supports text search, faceting, and vector search in a single query
- Ideal for: Hybrid search, text + semantic search, moderate scale deployments
- **Creation**: Using Search Service index configuration with vector field support


All three index types work with the same Semantic Kernel abstractions (`SearchAsync()`, `UpsertAsync()`, etc.). The main difference is which collection class you instantiate and the underlying query engine.

**Choosing the Right Type**:
- Start with **BHIVE** for pure vector searches and large datasets
- Use **Composite** when scalar filters eliminate large portions of data before vector comparison
- Use **FTS** when you need hybrid search combining full-text and semantic search

For more details, see the [Couchbase Vector Index Documentation](https://preview.docs-test.couchbase.com/docs-server-DOC-12565_vector_search_concepts/server/current/vector-index/use-vector-indexes.html).


### Index Configuration (Couchbase 8.0+)

The `description` parameter in the index definition controls vector storage optimization through centroids and quantization:

**Format**: `IVF[<centroids>],{PQ|SQ}<settings>`

**Centroids (IVF - Inverted File)**
- Controls dataset subdivision for faster searches
- More centroids = faster search, slower training
- If omitted (e.g., `IVF,SQ8`), Couchbase auto-selects based on dataset size

**Quantization Options**
- **SQ** (Scalar Quantization): `SQ4`, `SQ6`, `SQ8` (4, 6, or 8 bits per dimension)
- **PQ** (Product Quantization): `PQx` (e.g., `PQ32x8`)
- Higher values = better accuracy, larger index size

**Common Examples**:
- `IVF,SQ8` - Auto centroids, 8-bit quantization (good default)
- `IVF1000,SQ6` - 1000 centroids, 6-bit quantization (faster, less accurate)
- `IVF,PQ32x8` - Auto centroids, product quantization (better accuracy)

For detailed configuration options, see the [Quantization & Centroid Settings](https://preview.docs-test.couchbase.com/docs-server-DOC-12565_vector_search_concepts/server/current/vector-index/hyperscale-vector-index.html#algo_settings) documentation.

## Running the Demo

### Build and Execute
```bash
cd CouchbaseVectorSearchDemo
dotnet build
dotnet run
```

### Expected Output
```
Couchbase BHIVE Vector Search Demo
====================================
Using OpenAI model: text-embedding-ada-002
Step 1: Ingesting data into Couchbase vector store...
Data ingestion completed

Step 2: Creating BHIVE vector index manually...
Executing BHIVE index creation query...
BHIVE vector index 'bhive_glossary_index' already exists.

Step 3: Performing vector search...
   Found: API
   Definition: Application Programming Interface. A set of rules and specifications that allow software components to communicate and exchange data.
   Score: 0.1847

Step 4: Performing filtered vector search...
   Found (AI category only): RAG
   Definition: Retrieval Augmented Generation - a term that refers to the process of retrieving additional data to provide as context to an LLM to use when generating a response (completion) to a user's question (prompt).
   Score: 0.4226

 Demo completed successfully!
```

## How the Connector Works

The Couchbase Semantic Kernel connector provides a seamless integration between Semantic Kernel's vector store abstractions and Couchbase's vector search capabilities:

### Data Flow
1. **Initialize** - Create a `CouchbaseVectorStore` instance using a Couchbase scope
2. **Get Collection** - Use `GetCollection<TKey, TRecord>()` to get a typed collection reference
3. **Generate Embeddings** - Use Semantic Kernel's `IEmbeddingGenerator` to convert text to vectors
4. **Upsert Records** - Call `UpsertAsync()` to insert/update records with embeddings
5. **Create Index** - Set up a vector index using SQL++ for optimal search performance
6. **Search** - Use `SearchAsync()` with optional `VectorSearchOptions` for filtered searches
7. **Results** - Receive ranked results with similarity scores (lower = more similar)

### Key Connector Classes & Methods

**Vector Store Classes:**
- **`CouchbaseVectorStore`** - Main entry point for vector store operations
- **`CouchbaseQueryCollection`** - Collection class for BHIVE and Composite indexes (SQL++)
- **`CouchbaseSearchCollection`** - Collection class for FTS indexes (Search API)

**Common Methods (all index types):**
- **`GetCollection<TKey, TRecord>()`** - Returns a typed collection for CRUD operations
- **`UpsertAsync()`** - Inserts or updates records in the collection
- **`SearchAsync()`** - Performs vector similarity search with optional filters
- **`VectorSearchOptions`** - Configures search behavior including filters and result count

**Configuration Options:**
- **`CouchbaseQueryCollectionOptions`** - For BHIVE and Composite indexes
- **`CouchbaseSearchCollectionOptions`** - For FTS indexes

For more documentation, visit the [connector repository](https://github.com/Couchbase-Ecosystem/couchbase-semantic-kernel).

