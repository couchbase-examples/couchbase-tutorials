---
# frontmatter
path: "/tutorial-google-adk-couchbase-mcp-agent"
# title and description do not need to be added to markdown, start with H2 (##)
title: Build an AI Agent with Google ADK and Couchbase MCP Server
short_title: AI Agent with Google ADK
description:
  - Build an AI agent using Google's Agent Development Kit (ADK) that connects to Couchbase via the MCP protocol.
  - Learn to explore Couchbase data, run SQL++ queries, and analyze query performance using natural language.
  - Discover how to use the Couchbase MCP Server with Google ADK for database administration and data exploration.
content_type: tutorial
filter: sdk
technology:
  - kv
  - query
  - model context protocol (mcp)
tags:
  - Google ADK
  - Model Context Protocol (MCP)
  - Artificial Intelligence
  - SQL++ (N1QL)
sdk_language:
  - python
length: 30 Mins
---

## Introduction

In this tutorial, you will build an AI-powered database assistant using [Google's Agent Development Kit (ADK)](https://google.github.io/adk-docs/) and the [Couchbase MCP Server](https://github.com/Couchbase-Ecosystem/mcp-server-couchbase). The agent can explore your Couchbase cluster, run SQL++ queries, analyze query performance, and perform key-value operations — all through natural language.

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard that allows AI agents to connect to external tools and data sources. The Couchbase MCP Server implements this protocol, exposing Couchbase operations as tools that any MCP-compatible agent framework can use.

Google ADK provides the agent framework, and the Couchbase MCP Server provides the database tools. Together, they let you interact with Couchbase using conversational queries like "What buckets are in my cluster?" or "Show me the schema for the users collection."

This tutorial will demonstrate how to:

- Set up a Google ADK agent with the Couchbase MCP Server
- Explore cluster health, buckets, scopes, and collections using natural language
- Run SQL++ queries through the agent
- Use the ADK web UI to interact with the agent

## Prerequisites

- [Python](https://www.python.org/downloads/) 3.10 or higher installed
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) package manager installed (used to run the MCP server via `uvx`)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
- Couchbase Cluster (Self Managed or Capella) version 7.x+
- Connection string and credentials for the cluster

## Quick Start Guide

### Cloning Repo

```shell
git clone https://github.com/Couchbase-Ecosystem/mcp-server-couchbase.git
```

> The Couchbase MCP Server repository includes an example ADK agent you can use as a starting point.

### Install Dependencies

Install the required Python packages. It is recommended to use a [virtual environment](https://docs.python.org/3/tutorial/venv.html).

```shell
python -m pip install google-adk python-dotenv
```

### Setup Database Configuration

#### Capella Setup

To connect to your Capella cluster, follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

You will need to:

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the cluster via SDK
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the cluster from the IP where the application is running

#### Self Managed Setup

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance.

### Setup Environment Variables

Create a `.env` file in your project directory with the following variables:

```bash
GOOGLE_GENAI_API_KEY="<your_google_gemini_api_key>"
CB_CONNECTION_STRING="couchbase://localhost"
CB_USERNAME="Administrator"
CB_PASSWORD="password"
```

> You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/).

> The [connection string](https://docs.couchbase.com/python-sdk/current/howtos/managing-connections.html#connection-strings) expects the `couchbases://` or `couchbase://` part. Use `couchbases://` for Capella.

## Building the Agent

### Project Structure

Create the following project structure:

```
mcp_couchbase_agent/
├── __init__.py
├── agent.py
└── .env
```

The `__init__.py` file can be empty. Google ADK expects this structure to discover the agent.

### Agent Code

Create `agent.py` with the following code. This is the complete agent definition:

```python
import os

from dotenv import load_dotenv
from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool import StdioConnectionParams
from mcp import StdioServerParameters

load_dotenv()

CB_CONNECTION_STRING = os.getenv("CB_CONNECTION_STRING")
CB_USERNAME = os.getenv("CB_USERNAME")
CB_PASSWORD = os.getenv("CB_PASSWORD")

root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="couchbase_agent",
    description=(
        "An agent that interacts with Couchbase databases using the"
        " Couchbase MCP server."
    ),
    instruction=(
        "You are a Couchbase database assistant. "
        "Use the provided tools to check cluster health, explore the data "
        "model (buckets, scopes, collections, and document schemas), "
        "run SQL++ queries, and perform key-value document operations. "
        "Use SQL++ syntax (not standard "
        "SQL) for queries. Always discover the data model before writing "
        "queries. Ask clarifying questions when unsure about bucket, scope, "
        "or collection names."
    ),
    tools=[
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="uvx",
                    args=["couchbase-mcp-server"],
                    env={
                        "CB_CONNECTION_STRING": CB_CONNECTION_STRING,
                        "CB_USERNAME": CB_USERNAME,
                        "CB_PASSWORD": CB_PASSWORD,
                        "CB_MCP_READ_ONLY_MODE": "true",
                    },
                ),
                timeout=60,
            ),
        )
    ],
)
```

Let's break down what each part does.

### Loading Environment Variables

```python
from dotenv import load_dotenv

load_dotenv()

CB_CONNECTION_STRING = os.getenv("CB_CONNECTION_STRING")
CB_USERNAME = os.getenv("CB_USERNAME")
CB_PASSWORD = os.getenv("CB_PASSWORD")
```

We load the connection details from the `.env` file. These are read in the main process and then explicitly passed to the MCP server subprocess through the `env` parameter. Environment variables loaded via `dotenv` do not automatically propagate to subprocesses — they must be passed explicitly in the `env` dict within `StdioServerParameters`.

### Connecting to the MCP Server

```python
McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command="uvx",
            args=["couchbase-mcp-server"],
            env={
                "CB_CONNECTION_STRING": CB_CONNECTION_STRING,
                "CB_USERNAME": CB_USERNAME,
                "CB_PASSWORD": CB_PASSWORD,
                "CB_MCP_READ_ONLY_MODE": "true",
            },
        ),
        timeout=60,
    ),
)
```

The `McpToolset` class connects your ADK agent to the Couchbase MCP Server. Key points:

- **`command: "uvx"`**: Runs the MCP server using the `uv` package manager. This downloads and runs `couchbase-mcp-server` without needing a manual install.
- **`env` dict**: Passes the Couchbase connection details to the MCP server subprocess. All required environment variables must be included here.
- **`CB_MCP_READ_ONLY_MODE: "true"`**: Restricts the server to read-only operations, preventing accidental data modifications. Set to `"false"` to enable write operations.
- **`timeout: 60`**: Allows up to 60 seconds for the MCP server to start and establish a connection.

### Defining the Agent

```python
root_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="couchbase_agent",
    description=(
        "An agent that interacts with Couchbase databases using the"
        " Couchbase MCP server."
    ),
    instruction=(
        "You are a Couchbase database assistant. ..."
    ),
    tools=[...],
)
```

The `LlmAgent` is the core of Google ADK. It takes:

- **`model`**: The Gemini model to use. `gemini-2.5-flash` provides a good balance of speed and capability.
- **`name`**: A unique identifier for the agent.
- **`description`**: A brief description used when agents are composed together.
- **`instruction`**: The system prompt that guides the agent's behavior. The instruction tells the agent to use SQL++ syntax (not standard SQL) and to discover the data model before writing queries.
- **`tools`**: The list of toolsets available to the agent. The `McpToolset` provides all the Couchbase tools.

## Running the Agent

### Using the ADK Web UI

Google ADK includes a built-in web UI for interacting with your agent. From the parent directory of `mcp_couchbase_agent/`, run:

```shell
adk web
```

This starts a local web server. Open the URL shown in your terminal (typically `http://localhost:8000`) and select `mcp_couchbase_agent` from the agent dropdown.

### Example Interactions

Once the agent is running, try these queries:

**Explore the cluster:**
- "What is the health status of my cluster?"
- "What buckets are available?"
- "Show me the scopes and collections in the travel-sample bucket"

**Discover data schemas:**
- "What does a document look like in the airline collection?"
- "Show me the schema for the hotel collection in travel-sample"

**Run SQL++ queries:**
- "How many airlines are based in the United States?"
- "Find the top 5 hotels with the highest ratings"
- "Show me all routes from SFO to JFK"

**Analyze query performance:**
- "What are the longest running queries?"
- "Are there any queries using a primary index?"
- "Get index recommendations for: SELECT * FROM `travel-sample`.inventory.airline WHERE country = 'United States'"

The agent uses the Couchbase MCP Server tools to execute these operations and returns the results in natural language.

## Available Tools

The Couchbase MCP Server exposes the following tools to your agent. The full list of tools and their descriptions is available in the [Couchbase MCP Server documentation](https://github.com/Couchbase-Ecosystem/mcp-server-couchbase).

### Cluster Setup and Health

| Tool | Description |
|------|-------------|
| `get_server_configuration_status` | Get the status of the MCP server |
| `test_cluster_connection` | Check cluster credentials by connecting to the cluster |
| `get_cluster_health_and_services` | Get cluster health status and list of running services |

### Data Model and Schema Discovery

| Tool | Description |
|------|-------------|
| `get_buckets_in_cluster` | List all buckets in the cluster |
| `get_scopes_in_bucket` | List all scopes in a specified bucket |
| `get_collections_in_scope` | List all collections in a specified scope and bucket |
| `get_scopes_and_collections_in_bucket` | List all scopes and collections in a bucket |
| `get_schema_for_collection` | Get the structure of a collection |

### Document KV Operations

| Tool | Description |
|------|-------------|
| `get_document_by_id` | Get a document by ID |
| `upsert_document_by_id` | Upsert a document by ID (disabled in read-only mode) |
| `insert_document_by_id` | Insert a new document by ID (disabled in read-only mode) |
| `replace_document_by_id` | Replace an existing document by ID (disabled in read-only mode) |
| `delete_document_by_id` | Delete a document by ID (disabled in read-only mode) |

### Query and Indexing

| Tool | Description |
|------|-------------|
| `run_sql_plus_plus_query` | Run a SQL++ query on a specified scope |
| `list_indexes` | List all indexes in the cluster with optional filtering |
| `get_index_advisor_recommendations` | Get index recommendations for a SQL++ query |

### Query Performance Analysis

| Tool | Description |
|------|-------------|
| `get_longest_running_queries` | Get longest running queries by average service time |
| `get_most_frequent_queries` | Get most frequently executed queries |
| `get_queries_with_largest_response_sizes` | Get queries with the largest response sizes |
| `get_queries_with_large_result_count` | Get queries with the largest result counts |
| `get_queries_using_primary_index` | Get queries using a primary index (performance concern) |
| `get_queries_not_using_covering_index` | Get queries not using a covering index |
| `get_queries_not_selective` | Get queries that are not selective |

## Configuration Options

### Read-Only Mode

The `CB_MCP_READ_ONLY_MODE` setting (enabled by default) restricts the server to read-only operations. When enabled, KV write tools are not loaded and SQL++ queries that modify data are blocked. This is recommended for data exploration.

To enable write operations, set `CB_MCP_READ_ONLY_MODE` to `"false"` in the `env` dict:

```python
env={
    "CB_CONNECTION_STRING": CB_CONNECTION_STRING,
    "CB_USERNAME": CB_USERNAME,
    "CB_PASSWORD": CB_PASSWORD,
    "CB_MCP_READ_ONLY_MODE": "false",  # Enable write operations
},
```

### Disabling Specific Tools

You can disable specific tools using the `CB_MCP_DISABLED_TOOLS` environment variable:

```python
env={
    "CB_CONNECTION_STRING": CB_CONNECTION_STRING,
    "CB_USERNAME": CB_USERNAME,
    "CB_PASSWORD": CB_PASSWORD,
    "CB_MCP_DISABLED_TOOLS": "delete_document_by_id,upsert_document_by_id",
},
```

### mTLS Authentication

For clusters that require mutual TLS authentication, use client certificate paths instead of username/password:

```python
env={
    "CB_CONNECTION_STRING": CB_CONNECTION_STRING,
    "CB_CLIENT_CERT_PATH": "/path/to/client.cert",
    "CB_CLIENT_KEY_PATH": "/path/to/client.key",
    "CB_CA_CERT_PATH": "/path/to/ca.cert",
},
```

### All Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CB_CONNECTION_STRING` | Connection string to the Couchbase cluster | Required |
| `CB_USERNAME` | Username for basic authentication | Required (or client cert) |
| `CB_PASSWORD` | Password for basic authentication | Required (or client cert) |
| `CB_CLIENT_CERT_PATH` | Path to client certificate for mTLS | None |
| `CB_CLIENT_KEY_PATH` | Path to client key for mTLS | None |
| `CB_CA_CERT_PATH` | Path to server root certificate for TLS | None |
| `CB_MCP_READ_ONLY_MODE` | Prevent all data modifications | `true` |
| `CB_MCP_DISABLED_TOOLS` | Comma-separated list of tools to disable | None |

## Concepts

### Model Context Protocol (MCP)

The [Model Context Protocol](https://modelcontextprotocol.io/) is an open standard for connecting AI models to external data sources and tools. It defines a client-server architecture where:

- The **MCP Server** (Couchbase MCP Server) exposes tools that perform operations on the database
- The **MCP Client** (Google ADK's `McpToolset`) connects to the server and makes tools available to the agent
- Communication happens over **stdio** (standard input/output) when running locally

This architecture means your agent doesn't need the Couchbase SDK installed — the MCP server handles all database communication.

### Google Agent Development Kit (ADK)

[Google ADK](https://google.github.io/adk-docs/) is a framework for building AI agents powered by Gemini models. It provides:

- **LlmAgent**: The core agent class that processes user queries and decides which tools to use
- **McpToolset**: A toolset that connects to MCP servers, automatically discovering available tools
- **Web UI**: A built-in interface for testing and interacting with agents

ADK handles the orchestration — deciding when to call tools, interpreting results, and generating natural language responses.

### SQL++

[SQL++](https://www.couchbase.com/sqlplusplus/) is Couchbase's query language, extending SQL for JSON documents. When interacting with the agent, queries use SQL++ syntax. For example:

```sql
SELECT name, country FROM `travel-sample`.inventory.airline WHERE country = "United States" LIMIT 5
```

The agent's instruction prompt tells it to use SQL++ syntax, so you can ask questions in natural language and the agent will construct the appropriate SQL++ queries.

## Additional Resources

- [Couchbase MCP Server Repository](https://github.com/Couchbase-Ecosystem/mcp-server-couchbase)
- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Google ADK Couchbase Integration Page](https://google.github.io/adk-docs/integrations/couchbase/)
- [Couchbase Documentation](https://docs.couchbase.com/)
- [Couchbase Capella](https://cloud.couchbase.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
