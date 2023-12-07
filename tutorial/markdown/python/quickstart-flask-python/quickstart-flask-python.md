---
# frontmatter
path: "/tutorial-quickstart-flask-python"
title: Quickstart in Couchbase with Python and Flask
short_title: Python and Flask
description:
  - Learn to build a REST API in Python using Flask and Couchbase
  - See how you can persist and fetch data from Couchbase using primary indices
  - Explore CRUD operations in action with Couchbase
content_type: quickstart
filter: sdk
technology:
  - kv
  - index
  - query
tags:
  - Flask
  - REST API
sdk_language:
  - python
length: 30 Mins
---

[![Try it now!](https://da-demo-images.s3.amazonaws.com/runItNow_outline.png?couchbase-example=python-flask-quickstart-repo&source=devPortal)](https://gitpod.io/#https://github.com/couchbase-examples/python-quickstart)

<!-- [abstract] -->

In this article, you will learn how to connect to a Couchbase cluster to create, read, update, and delete documents and how to write simple parametrized N1QL queries.

## Prerequisites

To run this prebuilt project, you will need:

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance
- [Python v3.x](https://www.python.org/downloads/) installed
- Code Editor installed
- Note that this tutorial is designed to work with the latest Python SDK (4.x) for Couchbase. It will not work with the older Python SDK for Couchbase without adapting the code.

## Source Code

```shell
git clone https://github.com/couchbase-examples/python-quickstart
```

## Install Dependencies

Any dependencies should be installed through PIP, the default package manager for Python.

```shell
python -m pip install -r src/requirements.txt
```

### Database Server Configuration

All configuration for communication with the database is stored in the `app.py` file. The dictionary is named `db_info`. This dictionary includes the connection string, username, password, bucket name, collection name and scope name.

#### Running Couchbase Locally

The default username is assumed to be `Administrator` and the default password is assumed to be `password`. If these are different in your environment, you will need to change them before running the application.

#### Running Couchbase Capella

When running Couchbase using [Capella](https://cloud.couchbase.com/), the application requires the bucket, scope, collection and the database user to be setup from Capella Console.

Steps

- Create the bucket in Capella UI. For more details, you can refer to the [documentation](https://docs.couchbase.com/cloud/get-started/cluster-and-data.html).
- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.
- Enable the commented out `connect()` in the application (`app.py`) that is used to connect to Capella. Also, enable the commented out 'initialize_db()` in the database initialization script (`db_init.py`). Note that we are not using certificates for authentication for simplicity. This is not the recommended approach for production use.

### Running The Application

At this point the application is ready. You can run it with the following commands from the terminal/command prompt:

The bucket along with the scope and collection will be created on the cluster. For Capella, you need to ensure that the bucket is created before running the application.

```shell
export FLASK_APP=src/app && \
export FLASK_ENV=development
python db_init.py && flask run
```

<!-- [abstract] -->

\*Couchbase 7 must be installed and running on localhost (<http://127.0.0.1:8091>) prior to running the Flask Python app if Couchbase is running locally (server installation or using Docker).

Once the site is up and running, you can launch your browser and go to the [Swagger start page](https://localhost:5001/swagger/index.html) to test the APIs.

## What We'll Cover

A simple REST API using Python, Flask, and the Couchbase SDK version 3.x with the following endpoints:

- [POST a Profile](#post-a-profile) – Create a new user profile
- [GET a Profile by Key](#get-a-profile-by-key) – Get a specific profile
- [PUT Profile](#put-profile) – Update a profile
- [DELETE Profile](#delete-profile) – Delete a profile
- [GET Profiles by Searching](#get-profiles-by-searching) – Get all profiles matching First or Last Name

## Document Structure

We will be setting up a REST API to manage some profile documents. Our profile document will have an auto-generated UUID for its key, first and last name of the user, an email, and hashed password. For this demo, we will store all profile information in just one document in a collection named `profile`:

```json
{
  "pid": "b181551f-071a-4539-96a5-8a3fe8717faf",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@couchbase.com",
  "password": "$2a$10$tZ23pbQ1sCX4BknkDIN6NekNo1p/Xo.Vfsttm.USwWYbLAAspeWsC"
}
```

As we can see, we want our user's password to be encrypted in the database too, we can achieve this simply with `bcrypt`, a dependency we have installed.

## Let's Review the Code

To begin this tutorial, clone the repo and open it up in the IDE of your choice. Now you can learn about how to create, read, update and delete documents in Couchbase Server.

## POST a Profile

For CRUD operations, we will use the [Key Value operations](https://docs.couchbase.com/python-sdk/current/howtos/kv-operations.html) that are built into the Couchbase SDK to create, read, update, and delete a document. Every document will need an ID (similar to a primary key in other databases) to save it to the database.

Open the `app.py` file and navigate to the `post` method in the `Profile` class. Let’s break this code down. First, we make a reference of the json data to a variable `data` that we can use to modify the posted information before inserting it into the database.

Next, we create a `UUID` object using the `uuid4` method and convert it to a string. The `pid` that we` re saving into the dictionary is a unique key. This value will be used for the``Key ` to the document.

Rather than saving the password in the account object as plain text, we hash it with [Bcrypt](https://pypi.org/project/bcrypt/) `hashpw` function. Note that the `hashpw` function requires a UTF-8 coded String. The function returns a binary String which must be decoded to a regular string using the `decode` function before saving it to the dictionary.

```python
data = request.json
#create new random key
key = uuid.uuid4().__str__()
data["pid"] = key
#encrypt password
hashed = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode()
data["password"] = hashed
cb.insert(key, data)
return data, 201
```

<!-- [abstract] -->

from post method of Profile class in app.py

Our `profile` document is ready to be persisted to the database. We call the CouchbaseClient class `insert` method, which calls the `_collection insert` method sending the key and document for insertion into the database.

```python
def insert(self, key, doc):
  return self._collection.insert(key, doc)
```

<!-- [abstract] -->

from insert method of CouchbaseClient class in app.py

## GET a Profile by Key

Navigate to the `get` method of the `ProfileId` class in the `app.py` file. We only need the profile ID (`pid`) or our `Key` from the user to retrieve a particular profile document using a basic key-value operation which is passed in the method signature as a string.

```python
res = cb.get(id)
return jsonify(res.content_as[dict])
```

<!-- [abstract] -->

from get function ProfileId class in app.py

The CouchbaseClient class `get` method calls the \_collection variable `get` method. Since we created the document with a unique key we can use that to find the document in the scope and collection it is stored.

```python
def get(self, key):
  return self._collection.get(key)
```

<!-- [abstract] -->

from get method of CouchbaseClient class in app.py

If the document wasn't found in the database, we return the `NotFound` method.

## PUT Profile

Update a Profile by Profile ID (pid)

We use the key-value passed in via the URL query string to call the CouchbaseClient class `insert` method passing it the key and the form body data using request.json.

```python
data = request.json
#create new random key
data["pid"] = id
#encrypt password
hashed = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt()).decode()
data["password"] = hashed
cb.upsert(pid, request.json)
return data;
```

<!-- [abstract] -->

from put of ProfileId class in app.py

The CouchbaseClient class `upsert` method calls the collection's `upsert` method sending the key and json data to update the database.

```python
def upsert(self, key, doc):
  return self._collection.upsert(key, doc)
```

<!-- [abstract] -->

from upsert method of the CouchbaseClient class in app.py

## DELETE Profile

Navigate to the `delete` function in `app.py`. We only need the `key` or id from the user to delete a document using the basic key-value operation.

```python
cb.remove(id)
```

<!-- [abstract] -->

from delete function of app.py

The CouchbaseClient class `remove` method calls the \_collection `remove` method sending the key of the document to remove from the database.

```python
def remove(self, key):
  return self._collection.remove(key)
```

<!-- [abstract] -->

from remove method of CouchbaseClient class in app.py

## GET Profiles by Searching

[N1QL](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html) is a powerful query language based on SQL, but designed for structured and flexible JSON documents. We will use an N1QL query to search for profiles with Skip, Limit, and Search options.

Navigate to the `get` method in the `Profiles` class of the `app.py` file. This endpoint is different from all of the others because it makes the N1QL query rather than a key-value operation. This usually means more overhead because the query engine is involved. We did create an [index](https://docs.couchbase.com/server/current/learn/services-and-indexes/indexes/indexing-and-query-perf.html) specific for this query, so it should be performant.

First, we need to get the values from the query string for search, limit, and skip that we will use in our query. These are pulled from the `request.args.get` method.

Then, we build our N1QL query using the parameters. Take notice of the N1QL syntax and how it targets the `bucket`.`scope`.`collection`.

Next, we pass that `query` to the CouchbaseClient class `query` method. We create a dictionary called `profiles` we can save the results in it that will be returned to the user. By default, the Python SDK will [stream result set from the server](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html#streaming-large-result-sets). To resolve this, we must enumerate over the results and store them in the profiles dictionary before converting them to JSON to send back to the user.

```python
#get vars from GET request
search = request.args.get("search")
limit = request.args.get("limit")
skip = request.args.get("skip")

#create query
query = f"SELECT p.* FROM  {db_info['bucket']}.{db_info['scope']}.{db_info['collection']} p WHERE lower(p.firstName) LIKE '%{search.lower()}%' OR lower(p.lastName) LIKE '%{search.lower()}%' LIMIT {limit} OFFSET {skip}"
res = cb.query(query)

#must loop through results
#https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html#streaming-large-result-sets
profiles = []
for x in res:
    profiles.append(x)
return jsonify(profiles)
```

<!-- [abstract] -->

from getProfiles method of the Profiles class in app.py

### Running The Tests

To run the standard integration tests, use the following commands:

```bash
cd src
python test.py
```

## Conclusion

Setting up a basic REST API in Flask and Python with Couchbase is fairly simple. In this project when ran with Couchbase Server 7 installed, it will create a bucket in Couchbase, an index for our parameterized [N1QL query](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html), and showcases basic CRUD operations needed in most applications.
