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

## 1. Introduction
This project provides a seamless integration between Streamlit and Couchbase, allowing developers to interact with Couchbase databases effortlessly. It enables users to fetch, insert, update, and delete data within Streamlit applications without needing to switch between different SDKs, enhancing the overall development experience.

For a working demo please checkout `src/Demo.py` file. You can run it by the command
```bash
git clone https://github.com/Couchbase-Ecosystem/couchbase_streamlit_connector.git
cd ./couchbase_streamlit_connector
pip install -r requirements.txt
pip install plotly geopy numpy
streamlit run src/Demo.py
```
Or you can jave a look at it through this link [Demo App](https://couchbase-connector-demo-app.streamlit.app/)

## 2. Prerequisites
### System Requirements
- Ensure you have **Python 3.10 or higher** (check [compatibility](https://docs.couchbase.com/python-sdk/current/project-docs/compatibility.html#python-version-compat) with the Couchbase SDK), a **Couchbase Capella account** ([Docs](https://docs.couchbase.com/cloud/get-started/intro.html)), and an **operational cluster** created in a project.
- Configured cluster access permissions and allowed IP addresses ([Docs](https://docs.couchbase.com/cloud/get-started/connect.html#prerequisites))
- Connection string obtained from Couchbase Capella

### Installing Dependencies
To install the required dependencies, run:
```sh
pip install couchbase-streamlit-connector
```

## 3. Usage Guide

### Initializing the Connector
You can set up the Couchbase connection using either of the following methods:

#### **Option 1: Using `secrets.toml` (Recommended)**
For better security and convenience, store your credentials in a `.streamlit/secrets.toml` file at the root of your project. Learn more about [Streamlit Secrets Management](https://docs.streamlit.io/develop/concepts/connections/secrets-management):

```toml
[connections.couchbase]
CONNSTR = "<CONNECTION_STRING>"
USERNAME = "<CLUSTER_ACCESS_USERNAME>"
PASSWORD = "<CLUSTER_ACCESS_PASSWORD>"
BUCKET_NAME = "<BUCKET_NAME>"
SCOPE_NAME = "<SCOPE_NAME>"
COLLECTION_NAME = "<COLLECTION_NAME>"
```

Then, initialize the connection in your Streamlit application:

```python
import streamlit as st
from couchbase_streamlit_connector.connector import CouchbaseConnector

connection = st.connection(
    "couchbase",
    type=CouchbaseConnector
)
st.help(connection)
```

#### **Option 2: Passing Credentials Directly (Alternative)**
Alternatively, you can pass the connection details as keyword arguments:

```python
import streamlit as st
from couchbase_streamlit_connector.connector import CouchbaseConnector

connection = st.connection(
    "couchbase",
    type=CouchbaseConnector,
    CONNSTR="<CONNECTION_STRING>",
    USERNAME="<USERNAME>",
    PASSWORD="<PASSWORD>",
    BUCKET_NAME="<BUCKET_NAME>",
    SCOPE_NAME="<SCOPE_NAME>",
    COLLECTION_NAME="<COLLECTION_NAME>"
)
st.help(connection)
```

### Performing CRUD Operations

#### **Insert a Document**
```python
connection.insert_document("222", {"key": "value"})
st.write(connection.get_document("222"))
```

#### **Fetch a Document**
```python
st.write(connection.get_document("111"))
```

#### **Replace a Document**
```python
connection.replace_document("222", {"new_key": "new_value"})
st.write(connection.get_document("222"))
```

#### **Delete a Document**
```python
connection.remove_document("222")
st.write("Document 222 deleted")
```

#### **Run a Query**
```python
result = connection.query("SELECT * FROM `travel-sample`.`inventory`.`airline` LIMIT 5;")
st.write(result)
```

## 4. Appendix

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
