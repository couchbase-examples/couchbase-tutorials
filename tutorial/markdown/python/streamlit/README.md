---
# frontmatter
path: "/tutorial-couchbase-streamlit-connector"
title: Couchbase Connector for Streamlit
short_title: Couchbase Connector for Streamlit
description:
  - Learn how to integrate streamlit with Couchbase Capella
  - Example on CRUD and query operations
content_type: tutorial
filter: sdk
technology:
  - capella
  - query
tags:
  - Streamlit
sdk_language:
  - python
length: 30 Mins
---


# [Couchbase Connector for Streamlit](https://couchbase-st-tutorial.streamlit.app/)

## Introduction
This comprehensive tutorial repository guides developers through integrating Couchbase with Streamlit applications. Unlike a simple demo app, this repository focuses on teaching the fundamentals, best practices, and interactive implementation of Couchbase within Streamlit applications.

## Table of Contents
1. [Goals](#goals)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Core Concepts](#core-concepts)
5. [Tutorial Sections](#tutorial-sections)
6. [Running Your Application](#running-your-application)
7. [Conclusion](#conclusion)
8. [Appendix](#appendix)

## Goals
- Master Couchbase integration with Streamlit applications
- Understand core Couchbase concepts and their application in Streamlit
- Learn through hands-on, working example

## Prerequisites

### System Requirements
- Python 3.10 or higher ([Compatibility Guide](https://docs.couchbase.com/python-sdk/current/project-docs/compatibility.html#python-version-compat))
- Couchbase Capella account ([Get Started](https://docs.couchbase.com/cloud/get-started/intro.html))
- Active Couchbase cluster with connection credentials

### Required Knowledge
- Basic Python programming
- Fundamental understanding of web applications
- Basic database concepts

## Installation

1. **Set up your Python environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install required packages**:
   ```bash
   pip install streamlit couchbase-streamlit-connector
   ```

## Core Concepts

### Understanding JSON and Document Databases
Couchbase is a NoSQL document database that stores data in JSON format. This section explains why this matters:

#### JSON Basics
JSON (JavaScript Object Notation) is a lightweight data format that's:
- Human-readable
- Easy to parse and generate
- Flexible for different data structures

Example JSON document:
```json
{
  "id": "user_123",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### Why Couchbase Uses JSON
- **Flexible Schema**: Adapt to changing data requirements
- **Efficient Querying**: Native support for SQL-like queries (N1QL)
- **Scalability**: Easy to distribute and replicate
- **Natural Data Representation**: Matches application objects

### Couchbase Architecture Overview
- **Buckets**: Top-level containers for data
- **Scopes**: Namespaces within buckets
- **Collections**: Groups of related documents
- **Documents**: Individual JSON data records

### Important Operation Notes
- **CRUD Operations**: Create, Read, Update, and Delete operations only work on the specific bucket, scope, and collection specified during connection setup.
- **Queries**: Can work across any bucket, scope, and collection in the cluster, regardless of the connection settings.
- **Access Control**: Both CRUD operations and queries are limited by the permissions assigned to the Couchbase user in the cluster.

## Tutorial Sections

### 1. Setting Up Your First Application

Create a new file `app.py`:
```python
import streamlit as st
import json
from couchbase_streamlit_connector.connector import CouchbaseConnector

def initialize_connection():
    st.title("Couchbase + Streamlit Application")
    
    with st.sidebar:
        st.header("Connection Settings")
        # Connection configuration
        conn_str = st.text_input("Connection String")
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        bucket_name = st.text_input("Bucket Name")
        scope_name = st.text_input("Scope Name")
        collection_name = st.text_input("Collection Name")
        
        if st.button("Connect", key="connect_btn"):
            try:
                connection = st.connection(
                    "couchbase",
                    type=CouchbaseConnector,
                    CONNSTR=conn_str,
                    USERNAME=username,
                    PASSWORD=password,
                    BUCKET_NAME=bucket_name,
                    SCOPE_NAME=scope_name,
                    COLLECTION_NAME=collection_name
                )
                st.session_state["connection"] = connection
                st.success("Connected successfully!")
            except Exception as e:
                st.error(f"Connection failed: {e}")
```

### 2. Implementing CRUD Operations

#### Create Operation
```python
def insert_document():
    st.subheader("Create Document")
    with st.expander("Insert a new document", expanded=False):
        doc_id = st.text_input("Document ID", key="create_id")
        doc_data = st.text_area(
            "Document Data (JSON)",
            value='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
            key="create_data"
        )
        
        if st.button("Insert", key="create_btn"):
            try:
                json_data = json.loads(doc_data)  # Using json.loads instead of eval for safety
                st.session_state["connection"].insert_document(doc_id, json_data)
                st.success("Document inserted successfully!")
            except Exception as e:
                st.error(f"Insert failed: {e}")
```
This function creates new documents in Couchbase by accepting a document ID and JSON data. It uses json.loads() instead of eval() for secure JSON parsing, protecting against code injection. The function displays success or error messages based on the operation outcome.

#### Read Operation
```python
def fetch_document():
    st.subheader("Read Document")
    with st.expander("Fetch an existing document", expanded=False):
        doc_id = st.text_input("Document ID to fetch", key="read_id")
        if st.button("Fetch", key="read_btn"):
            try:
                doc = st.session_state["connection"].get_document(doc_id)
                st.json(doc)
            except Exception as e:
                st.error(f"Fetch failed: {e}")
```
This function retrieves documents from Couchbase using their document IDs. It displays the document contents in a formatted JSON viewer if found, or shows an error message if the document doesn't exist or there's a connection issue.

#### Update Operation
```python
def update_document():
    st.subheader("Update Document")
    with st.expander("Update an existing document", expanded=False):
        doc_id = st.text_input("Document ID to update", key="update_id")
        new_data = st.text_area(
            "Updated Data (JSON)",
            key="update_data",
            value='{\n  "name": "John Doe",\n  "email": "john@example.com"\n}',
        )
        if st.button("Update", key="update_btn"):
            try:
                json_data = json.loads(new_data)  # Using json.loads instead of eval for safety
                st.session_state["connection"].replace_document(doc_id, json_data)
                st.success("Document updated successfully!")
            except Exception as e:
                st.error(f"Update failed: {e}")
```
This function updates existing documents by replacing their entire content with new JSON data. It requires both the document ID and the complete new document content, ensuring data consistency by using json.loads() for safe JSON parsing.

#### Delete Operation
```python
def delete_document():
    st.subheader("Delete Document")
    with st.expander("Delete an existing document", expanded=False):
        doc_id = st.text_input("Document ID to delete", key="delete_id")
        if st.button("Delete", key="delete_btn"):
            try:
                st.session_state["connection"].remove_document(doc_id)
                st.success("Document deleted successfully!")
            except Exception as e:
                st.error(f"Delete failed: {e}")
```
This function removes documents from the database using their document IDs. It provides immediate feedback through success/error messages and handles cases where the document might not exist.

### 3. Querying Data
```python
def query_data():
    st.subheader("Query Data")
    with st.expander("Execute SQL++ Query", expanded=False):
        query = st.text_area(
            "SQL++ Query",
            value="SELECT * FROM `travel-sample`.inventory.airline LIMIT 5;",
            key="query_input"
        )
        if st.button("Execute Query", key="query_btn"):
            try:
                results = st.session_state["connection"].query(query)
                data = []
                for row in results:
                    data.append(row)
                st.write(data)
            except Exception as e:
                st.error(f"Query failed: {e}")
```
This function executes SQL++ (N1QL) queries against Couchbase. The for row in results loop is necessary because Couchbase query results are returned as an iterator to efficiently handle large result sets. Converting the iterator to a list allows Streamlit to display all results at once while managing memory usage effectively.

### Main function
```python
def main():
    # Initialize connection in sidebar
    initialize_connection()
    
    # Main content area
    if "connection" in st.session_state:
        # Add tabs for different operations
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "Create", "Read", "Update", "Delete", "Query"
        ])
        
        with tab1:
            insert_document()
        with tab2:
            fetch_document()
        with tab3:
            update_document()
        with tab4:
            delete_document()
        with tab5:
            query_data()
    else:
        st.info("Please connect to Couchbase using the sidebar to start.")

if __name__ == "__main__":
    st.set_page_config(
        page_title="Couchbase Streamlit Demo",
        page_icon="🔌",
        layout="wide"
    )
    main()
```

## Running Your Application

1. **Start the Streamlit application**:
   ```bash
   streamlit run app.py
   ```

2. **Access the application**:
   - Open your browser to `http://localhost:8501`
   - Enter your Couchbase connection details
   - Start interacting with your data

### Verifying Changes in Couchbase Capella

After performing CRUD operations or queries, you can verify the changes in Couchbase Capella:

1. Log in to your Couchbase Capella account
2. Navigate to the Query Workbench
3. For CRUD operations:
   ```sql
   SELECT * FROM `your-bucket`.`your-scope`.`your-collection` 
   WHERE META().id = "your-document-id";
   ```
4. For general queries:
   - Use the same query you executed in your Streamlit app
   - Modify the query to explore related data
5. You can also use the Documents browser in Capella to directly view and edit documents

## Conclusion
This repository serves as an educational resource for developers who want to integrate Couchbase into Streamlit applications. By following these tutorials, users can learn how to query, display, and optimize Couchbase data in Streamlit apps.

## Appendix

Here are some helpful resources for working with Couchbase and Streamlit:

### **Couchbase Documentation**
- [Couchbase Python SDK Compatibility](https://docs.couchbase.com/python-sdk/current/project-docs/compatibility.html#python-version-compat)  
- [Getting Started with Couchbase Capella](https://docs.couchbase.com/cloud/get-started/intro.html)  
- [Connecting to Couchbase Capella](https://docs.couchbase.com/cloud/get-started/connect.html#prerequisites)  
- [N1QL Query Language Guide](https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/index.html)  
- [Couchbase SDKs Overview](https://docs.couchbase.com/home/sdk.html)  

### **Streamlit Documentation**
- [Streamlit Secrets Management](https://docs.streamlit.io/develop/concepts/connections/secrets-management)  
- [Using `st.connection`](https://docs.streamlit.io/develop/api-reference/connections)  
- [Streamlit Components](https://docs.streamlit.io/develop/api-reference)  

### **Additional Resources**
- [Couchbase Sample Data](https://docs.couchbase.com/server/current/tools/cbimport-json.html)  
- [Demo App](https://couchbase-connector-demo-app.streamlit.app/)  
