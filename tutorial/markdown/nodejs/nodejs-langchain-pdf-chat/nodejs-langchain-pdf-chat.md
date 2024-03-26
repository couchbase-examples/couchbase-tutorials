---
# frontmatter
path: "/tutorial-nodejs-langchain-pdf-chat"
# title and description do not need to be added to markdown, start with H2 (##)
title: Build PDF Chat App With Langchain, Couchbase Nodejs SDK and Couchbase Vector Search
short_title: Build PDF Chat App
description:
  - Construct a PDF Chat App with Langchain, Couchbase Node.js SDK, Couchbase Vector Search, and Next.js.
  - Learn to upload PDFs into Couchbase Vector Store with Langchain.
  - Discover how to use RAG’s for context-based Q&A’s from PDFs with LLMs.
content_type: tutorial
filter: sdk
technology:
  - fts
  - kv
tags:
  - Next.js
  - Langchain
  - OpenAI
sdk_language:
  - nodejs
length: 30 Mins
---

## Introduction

Welcome to this comprehensive guide on constructing an AI-enhanced Chat Application. We will create a dynamic chat interface capable of delving into PDF documents to extract and provide summaries, key facts, and answers to your queries. By the end of this tutorial, you’ll have a powerful tool at your disposal, transforming the way you interact with and utilize the information contained within PDFs.

This tutorial will demonstrate how to -

- Construct a [Couchbase Search Index](<(https://www.couchbase.com/products/vector-search/)>) for doing Vector Search
- Chunk PDFs into Vectors with [Langchain.js](https://js.langchain.com/) and use [Couchbase Vector Store](https://js.langchain.com/docs/integrations/vectorstores/couchbase) to store the vectors into couchbase
- Query large language models via the [RAG framework](<(https://aws.amazon.com/what-is/retrieval-augmented-generation/)>) for contextual insights. We will use [Open AI](https://openai.com) for generating Embeddings and LLM
- Craft an elegant UI with Next.js. All these components come together to create a seamless, AI-powered chat experience.

## Prerequisites

- [LTS Node.js Version](https://nodejs.org/en/download)
- Couchbase Cluster (Self Managed or Capella) with [Search Service](https://docs.couchbase.com/server/current/fts/fts-introduction.html)

> Note that this tutorial is designed to work with the latest Node SDK version (4.3.0+) for Couchbase. It will not work with the older Node.js versions.

## Quick Start Guide:

### Cloning Repo

```shell
git clone https://github.com/couchbase-examples/vector-search-nodejs.git
```

### Install Dependencies

Any dependencies will be installed by running the npm install command from the root directory of the project.

```shell
npm install
```

### Setup Database Configuration

#### Capella Setup

To know more about connecting to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access cluster via SDK
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

#### Self Managed Setup

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance. Make sure to add the [Search Service](https://docs.couchbase.com/server/current/fts/fts-introduction.html)

### Create Bucket

- For the purpose of this tutorial, we will be using specific bucket, scope and collection. However you may use any name of your choice but make sure to update names in all the steps.
- Create a bucket named `pdf-chat`. We will use the `_default` scope and `_default` collection of this bucket.

### Create the Search Index on Full Text Service

We need to create the Search Index on the Full Text Service in Couchbase. For this demo, you can import the following index using the instructions.

- [Couchbase Capella](https://docs.couchbase.com/cloud/search/import-search-index.html)

  - Copy the index definition to a new file index.json
  - Import the file in Capella using the instructions in the documentation.
  - Click on Create Index to create the index.

- [Couchbase Server](https://docs.couchbase.com/server/current/search/import-search-index.html)

  - Click on Search -> Add Index -> Import
  - Copy the following Index definition in the Import screen
  - Click on Create Index to create the index.

You may also create a vector index using Search UI on both [Couchbase Capella](https://docs.couchbase.com/cloud/vector-search/create-vector-search-index-ui.html) and [Couchbase Self Managed Server](https://docs.couchbase.com/server/current/vector-search/create-vector-search-index-ui.html)

#### Index Definition

Here, we are creating the index `pdf_search` on the documents. The Vector field is set to `embedding` with 1536 dimensions and the text field set to `text`. We are also indexing and storing all the fields under `metadata` in the document as a dynamic mapping to account for varying document structures. The similarity metric is set to dot_product. If there is a change in these parameters, please adapt the index accordingly.

```json
{
  "name": "pdf_search",
  "type": "fulltext-index",
  "params": {
    "doc_config": {
      "docid_prefix_delim": "",
      "docid_regexp": "",
      "mode": "scope.collection.type_field",
      "type_field": "type"
    },
    "mapping": {
      "default_analyzer": "standard",
      "default_datetime_parser": "dateTimeOptional",
      "default_field": "_all",
      "default_mapping": {
        "dynamic": true,
        "enabled": false
      },
      "default_type": "_default",
      "docvalues_dynamic": false,
      "index_dynamic": true,
      "store_dynamic": false,
      "type_field": "_type",
      "types": {
        "_default._default": {
          "dynamic": true,
          "enabled": true,
          "properties": {
            "embedding": {
              "enabled": true,
              "dynamic": false,
              "fields": [
                {
                  "dims": 1536,
                  "index": true,
                  "name": "embedding",
                  "similarity": "dot_product",
                  "type": "vector",
                  "vector_index_optimized_for": "recall"
                }
              ]
            },
            "metadata": {
              "dynamic": true,
              "enabled": true
            },
            "text": {
              "enabled": true,
              "dynamic": false,
              "fields": [
                {
                  "index": true,
                  "name": "text",
                  "store": true,
                  "type": "text"
                }
              ]
            }
          }
        }
      }
    },
    "store": {
      "indexType": "scorch",
      "segmentVersion": 16
    }
  },
  "sourceType": "gocbcore",
  "sourceName": "pdf-docs",
  "sourceParams": {},
  "planParams": {
    "maxPartitionsPerPIndex": 64,
    "indexPartitions": 16,
    "numReplicas": 0
  }
}
```

### Setup Environment Config

Copy the `.env.template` file from the repo and rename it to `.env` (`.env.local` in case of local development) and replace the placeholders with the actual values for your environment.
All configuration for communication with the database is read from the environment variables.

```sh
OPENAI_API_KEY=<open_ai_api_key>
DB_CONN_STR=<connection_string_for_couchbase_cluster>
DB_USERNAME=<username_for_couchbase_cluster>
DB_PASSWORD=<password_for_couchbase_cluster>
DB_BUCKET=<name_of_bucket_to_store_documents>
DB_SCOPE=<name_of_scope_to_store_documents>
DB_COLLECTION=<name_of_collection_to_store_documents>
INDEX_NAME=<name_of_fts_index_with_vector_support>
```

> [Open AI](https://openai.com) API Key is required for usage in generating embedding and querying LLM

> The [connection string](https://docs.couchbase.com/nodejs-sdk/current/howtos/managing-connections.html#connection-strings) expects the `couchbases://` or `couchbase://` part.

> For this tutorial, `DB_BUCKET=pdf-chat`, `DB_SCOPE=_default`, `DB_COLLECTION=_default` and `INDEX_NAME=pdf_search`

### Running the Application

After starting couchbase server, adding vector index and installing dependencies. Our Application is ready to run.

In the projects root directory, run the following command

```sh
npm run dev
```

The application will run on your local machine at (http://localhost:3000).
