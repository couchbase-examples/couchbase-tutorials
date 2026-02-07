---
# frontmatter
path: "/tutorial-java-spring-ai"
title: Couchbase Vector Search using Spring AI
short_title: Spring AI Vector Storage
description: 
  - Learn how to configure and use couchbase vector search with Spring AI
  - Learn how to vectorize data with Spring AI
  - Learn how to retrieve vector data from Couchbase
content_type: tutorial
filter: sdk
technology:
  - connectors
  - vector search
tags:
  - LangChain
  - Artificial Intelligence
  - Data Ingestion
sdk_language:
  - java
length: 10 Mins
---

## About This Tutorial
This tutorial is your quick and easy guide to getting started with Spring AI and Couchbase as a Vector Store. Let's dive in and explore how these powerful tools can work together to enhance your applications.
### Example Source code
Example source code for this tutorial can be obtained from [Spring AI demo application with Couchbase Vector Store](https://github.com/couchbase-examples/couchbase-spring-ai-demo).
To do this, clone the repository using git:
```shell
git clone https://github.com/couchbase-examples/couchbase-spring-ai-demo.git
cd couchbase-spring-ai-demo
```

### What is Spring AI?


Spring AI is an extension of the Spring Framework that simplifies the integration of AI capabilities into Spring applications. It provides abstractions and integrations for working with various AI services and models, making it easier for developers to incorporate AI functionality without having to manage low-level implementation details.

Key features of Spring AI include:
- **Model integrations**: Pre-built connectors to popular AI models (like OpenAI)
- **Prompt engineering**: Tools for crafting and managing prompts
- **Vector stores**: Abstractions for storing and retrieving vector embeddings
- **Document processing**: Utilities for working with unstructured data

##### Why Use Spring AI?

Spring AI brings several benefits to Java developers:
1. **Familiar programming model**: Uses Spring's dependency injection and configuration
2. **Abstraction layer**: Provides consistent interfaces across different AI providers
3. **Enterprise-ready**: Built with production use cases in mind
4. **Simplified development**: Reduces boilerplate code for AI integrations


- [Spring AI](https://docs.spring.io/spring-ai/reference/index.html)
- [Spring AI Github Page](https://github.com/spring-projects/spring-ai)


## Couchbase Embedding Store 
Couchbase spring-ai integration stores each embedding in a separate document and uses an FTS vector index to perform
queries against stored vectors.
- [Couchbase Integration with Spring AI Documentation](https://docs.spring.io/spring-ai/reference/api/vectordbs/couchbase.html)

## Project Structure

```
src/main/java/com/couchbase_spring_ai/demo/
├── Config.java                         # Application configuration
├── Controller.java                     # REST API endpoints
└── CouchbaseSpringAiDemoApplications.java  # Application entry point

src/main/resources/
├── application.properties              # Application settings
└── bbc_news_data.json                  # Sample data
```

## Setup and Configuration

### Prerequisites
- [Couchbase Capella](https://docs.couchbase.com/cloud/get-started/create-account.html) account or locally installed [Couchbase Server](/tutorial-couchbase-installation-options)
- Java 17
- Maven
- Couchbase Server
- OpenAI API key

### Configuration Details

The application is configured in `application.properties`:

```properties
spring.application.name=spring-ai-demo
spring.ai.openai.api-key=your-openai-api-key
spring.couchbase.connection-string=couchbase://127.0.0.1
spring.couchbase.username=Administrator
spring.couchbase.password=password
```

## Key Components

### Configuration Class (`Config.java`)

This class creates the necessary beans for:
- Connecting to Couchbase cluster
- Setting up the OpenAI embedding model (OpenAI key is assumed to be stored as an environment variable.)
- Configuring the Couchbase vector store

```java
public class Config {
    @Value("${spring.couchbase.connection-string}")
    private String connectionUrl;
    @Value("${spring.couchbase.username}")
    private String username;
    @Value("${spring.couchbase.password}")
    private String password;
    @Value("${spring.ai.openai.api-key}")
    private String openaiKey;

    public Config() {
    }

    @Bean
    public Cluster cluster() {
        return Cluster.connect(this.connectionUrl, this.username, this.password);
    }

    @Bean
    public Boolean initializeSchema() {
        return true;
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        return new OpenAiEmbeddingModel(OpenAiApi.builder().apiKey(this.openaiKey).build());
    }

    @Bean
    public VectorStore couchbaseSearchVectorStore(Cluster cluster,
                                                  EmbeddingModel embeddingModel,
                                                  Boolean initializeSchema) {
        return CouchbaseSearchVectorStore
                .builder(cluster, embeddingModel)
                .bucketName("test")
                .scopeName("test")
                .collectionName("test")
                .initializeSchema(initializeSchema)
                .build();
    }
}
```

The vector store is configured to use:
- Bucket: "test"
- Scope: "test"
- Collection: "test"

### Vector Store Integration

The application uses `CouchbaseSearchVectorStore`, which:
- Stores document embeddings in Couchbase
- Provides similarity search capabilities
- Maintains metadata alongside vector embeddings

### Vector Index
The embedding store uses an Search Vector Index in order to perform vector similarity lookups. If provided with a name for
vector index that does not exist on the cluster, the store will attempt to create a new index with default
configuration based on the provided initialization settings. It is recommended to manually review the settings for the
created index and adjust them according to specific use cases. More information about Search Vector Index 
configuration can be found at [Couchbase Documentation](https://docs.couchbase.com/server/current/vector-search/vector-search.html).

### Controller Class (`Controller.java`)

Provides REST API endpoints:
- `/tutorial/load`: Loads sample BBC news data into Couchbase
- `/tutorial/search`: Performs a semantic search for sports-related news articles

##### Load functionality
```java
...
Document doc = new Document(String.format("%s", i + 1), j.getString("content"), Map.of("title", j.getString("title")))
...
this.couchbaseSearchVectorStore.add(doc);
...
```

- A new Document object is created. The document's ID is generated using String.format("%s", i + 1), which increments an index i to ensure unique IDs and same ID across calls. Metadata is added as a map with a key "title" and its corresponding value from a previously parsed JSON.
- The document is then added to the couchbaseSearchVectorStore, which is  an instance of a class that handles storing documents in Couchbase. This operation involves vectorizing the document content and storing it in a format suitable for vector search.


##### Search functionality
```java
List<Document> results = this.couchbaseSearchVectorStore.similaritySearch(SearchRequest.builder()
.query("Give me some sports news")
.similarityThreshold((double)0.75F)
.topK(15)
.build());

return (List)results.stream()
.map((doc) -> Map.of("content", doc.getText(), "metadata", doc.getMetadata()))
.collect(Collectors.toList());
```

- A SearchRequest is built with a query string "Give me some sports news". The similarityThreshold is set to 0.75, meaning only documents with a similarity score above this threshold will be considered relevant. The topK parameter is set to 15, indicating that the top 15 most similar documents should be returned.
- The similaritySearch method of couchbaseSearchVectorStore is called with the built SearchRequest. This method performs a vector similarity search against the stored documents.
- The results, which are a list of Document objects, are processed using Java Streams. Each document is mapped to a simplified structure containing its text content and metadata. The final result is a list of maps, each representing a document with its content and metadata.

## Using the Application

This is basically a Spring Boot project with two endpoints `tutorial/load` and `tutorial/search`.
In order to run this application, use the following command:
`./mvnw spring-boot:run`


### Loading Data

1. Start the application
2. Make a GET request to `http://localhost:8080/tutorial/load`
3. This loads BBC news articles from the included JSON file into Couchbase, creating embeddings via OpenAI

### Performing Similarity Searches

1. Make a GET request to `http://localhost:8080/tutorial/search`
2. The application will search for documents semantically similar to "Give me some sports news"
3. Results are returned with content and metadata, sorted by similarity score


## Resources

- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/index.html)
- [Couchbase Vector Search](https://docs.couchbase.com/server/current/fts/vector-search.html)
- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
