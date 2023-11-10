---
# frontmatter
path: "/tutorial-quickstart-flask-python"
title: Quickstart in Couchbase with Python and Flask
short_title: Python and Flask
description:
  - Learn to build a REST API in Python using Flask and Couchbase
  - See how you can fetch data from Couchbase using SQL++ queries
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

<!-- [abstract] -->

In this tutorial, you will learn how to connect to a Couchbase Capella cluster to create, read, update, and delete documents and how to write simple parametrized SQL++ queries.

## Prerequisites

To run this prebuilt project, you will need:

- Couchbase Cluster running 7 or higher with travel-sample bucket loaded
  - [Couchbase Capella](https://www.couchbase.com/products/capella/) is the easiest way to get started.
  - This tutorial is aimed at helping you get started with Couchbase Capella. If you are running self managed Couchbase server, please refer to the [Appendix](appendix-2-running-self-managed-couchbase-cluster) for relevant instructions.
- [Python](https://www.python.org/downloads/) 3.9 or higher installed
- Note that this tutorial is designed to work with the latest Python SDK (4.x) for Couchbase. It will not work with the older Python SDK for Couchbase without adapting the code.

### Couchbase Capella Configuration

When running Couchbase using [Capella](https://cloud.couchbase.com/), the following prerequisites need to be met.

- The application requires the travel-sample bucket to be [loaded](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html#import-sample-data) in the cluster from the Capella UI.
- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

## Source Code

```shell
git clone https://github.com/couchbase-examples/python-quickstart
```

## Install Dependencies

Any dependencies should be installed through `pip`, the default package manager for Python.

```shell
python -m pip install -r src/requirements.txt
```

### Database Server Configuration

All configuration for communication with the database is fetched from the environment variables. We have provided a convenience feature in this quickstart to read the environment variables from a local file, `.env` in the source folder.

Create a copy of `.env.example` file & rename it to `.env` & add the values for the Couchbase cluster.

```sh
DB_CONN_STR=<connection_string>
DB_USERNAME=<user_with_read_write_permission_to_travel-sample_bucket>
DB_PASSWORD=<password_for_user>
```

> Note: The connection string expects the `couchbases://` or `couchbase://` part.

<!-- #### Running Couchbase Locally

The default username is assumed to be `Administrator` and the default password is assumed to be `password`. If these are different in your environment, you will need to change them before running the application. -->

### Running the Application

#### Directly on Local Machine

At this point, we have installed the dependencies, loaded the travel-sample data and configured the application with the credentials. The application is now ready and you can run it.

The application will run on port 8080 of your local machine (http://localhost:8080). You will find the Swagger documentation of the API which you can use to try the API endpoints.

```shell
cd src
python app.py
```

#### Running via Docker

If you prefer to run this quick start using Docker, we have provided the Dockerfile which you can use to build the image and run the API as a container.

- Build the Docker image

```sh
cd src
docker build -t couchbase-flask-quickstart .
```

- Run the Docker image

```sh
docker run -it --env-file .env -p 8080:8080 couchbase-flask-quickstart
```

> Note: The `.env` file has the connection information to connect to your Capella cluster. With the `--env-file`, docker will inject those environment variables to the container.

<!-- [abstract] -->

<!-- \*Couchbase 7 must be installed and running on localhost (<http://127.0.0.1:8091>) prior to running the Flask Python app if Couchbase is running locally (server installation or using Docker). -->

Once the app is up and running, you can launch your browser and go to the [Swagger documentation](https://localhost:8080/) to test the APIs.

## What We Will Cover

A simple REST API using Python, Flask, and the Couchbase SDK version 4.x with the CRUD operations on the airline, airport and route entities.

## Data Model

For this tutorial, we use three collections, `airport`, `airline` and `route` that contain sample airports, airlines and airline routes respectively. The route collection connects the airports and airlines as seen in the figure below. We use these connections in the quickstart to generate airports that are directly connected and airlines connecting to a destination airport. Note that these are just examples to highlight how you can use SQL++ queries to join the collections.
![img](travel_sample_data_model.png)

## Let Us Review the Code

To begin this tutorial, clone the repo and open it up in the IDE of your choice. Now you can learn about how to create, read, update and delete documents in Couchbase Server.

### Code Layout

```
├── src
│   ├── Dockerfile
│   ├── api
│   │   ├── airline.py
│   │   ├── airport.py
│   │   └── route.py
│   ├── app.py
│   ├── db.py
│   ├── extensions.py
│   ├── requirements.txt
│   └── tests
│       ├── conftest.py
│       ├── test_airline.py
│       ├── test_airport.py
│       └── test_route.py
```

We have separated out the API code into separate files by the entity (collection) in the `api` folder. The tests are similarly separated out by entity in the `tests` folder.

In `app.py`, we initialize the application including connecting to the database and add all the routes from individual API files.

We have the Couchbase SDK operations defined in the `CouchbaseClient` class inside the `db.py` file.

We recommend creating a single Couchbase connection when your application starts up, and sharing this instance throughout your application. If you know at startup time which buckets, scopes, and collections your application will use, we recommend obtaining them from the Cluster at startup time and sharing those instances throughout your application as well.

In this application, we have created the connection object in `extensions.py` and we use this object in all of our APIs. The object is initialized in `app.py`. We have also stored the reference to our bucket, `travel-sample` and the scope, `inventory` in the connection object.

```python
# app.py
from extensions import couchbase_db

...

# Create the database connection
couchbase_db.init_app(conn_str, username, password, app)
couchbase_db.connect()
```

The Couchbase connection is established in the `connect` method defined in `db.py`. There, we call the `Cluster` method defined in the SDK to create the Database connection. If the connection is already established, we do not do anything. In our application, we have the same bucket and scope that is used by all the APIs. The collection will change depending on the API route.

```python
# db.py
# authentication for Couchbase cluster
auth = PasswordAuthenticator(self.username, self.password)

cluster_opts = ClusterOptions(auth)
# wan_development is used to avoid latency issues while connecting to Couchbase over the internet
cluster_opts.apply_profile("wan_development")

# connect to the cluster
self.cluster = Cluster(self.conn_str, cluster_opts)

# wait until the cluster is ready for use
self.cluster.wait_until_ready(timedelta(seconds=5))

# get a reference to our bucket
self.bucket = self.cluster.bucket(self.bucket_name)

# get a reference to our scope
self.scope = self.bucket.scope(self.scope_name)
```

### Airport Entity

For this tutorial, we will focus on the airline entity. The other entities are similar.

We will be setting up a REST API to manage airport documents.

- [POST Airport](#post-airport) – Create a new airport
- [GET Airport](#get-airport) – Read specified airport
- [PUT Airport](#put-airport) – Update specified airport
- [DELETE Airport](#delete-airport) – Delete airport
- [Airport List](#list-airport) – Get all airports. Optionally filter the list by country
- [Direct Connections](#direct-connections) - Get a list of airports directly connected to the specified airport

For CRUD operations, we will use the [Key-Value operations](https://docs.couchbase.com/python-sdk/current/howtos/kv-operations.html) that are built into the Couchbase SDK to create, read, update, and delete a document. Every document will need an ID (similar to a primary key in other databases) to save it to the database. This ID is passed in the URL. For other end points, we will use [SQL++](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html) to query for documents.

### Airport Document Structure

Our profile document will have an airportname, city, country, faa code, icao code, timezone info and the geographic coordinates. For this demo, we will store all airport information in one document in the `airport` collection in the `travel-sample` bucket.

```json
{
  "airportname": "Sample Airport",
  "city": "Sample City",
  "country": "United Kingdom",
  "faa": "SAA",
  "icao": "SAAA",
  "tz": "Europe/Paris",
  "geo": {
    "lat": 48.864716,
    "lon": 2.349014,
    "alt": 92
  }
}
```

### POST Airport

Open the `airport.py` file and navigate to the `post` method in the `AirportId` class. We make a reference of the json data to a variable `data` that we insert into the database using the datbase client, `couchbase_db`.

```python
# post method in class AirportId of airport.py
data = request.json
couchbase_db.insert_document(AIRPORT_COLLECTION, key=id, doc=data)
return data, 201
```

We call the `insert_document` method in CouchbaseClient class, which calls the `insert` method for the collection defined in the Couchbase SDK. The insert method takes the key (ID) by which the document is referenced and the content to be inserted into the collection.

```python
# CouchbaseClient class in db.py
def insert_document(self, collection_name: str, key: str, doc: dict):
  """Insert document using KV operation"""
  return self.scope.collection(collection_name).insert(key, doc)
```

### GET Airport

Navigate to the `get` method of the `AirportId` class in the `airport.py` file. We only need the airport document ID or our key from the user to retrieve a particular airport document using a key-value operation which is passed in the get_document method. The result is converted into a python dictionary using the `.content_as[dict]` operation defined for the result returned by the SDK.

```python
# get method in class AirportId of airport.py
result = couchbase_db.get_document(AIRPORT_COLLECTION, key=id)
return result.content_as[dict]
```

The CouchbaseClient client `get_document` method calls the `get` method defined for collections in the Couchbase SDK. We fetch the documents based on the key by which it is stored.

```python
# CouchbaseClient class in db.py
def get_document(self, collection_name: str, key: str):
  """Get document by key using KV operation"""
  return self.scope.collection(collection_name).get(key)
```

If the document is not found in the database, we get an exception, `DocumentNotFoundException` from the SDK and return the status as 404.

### PUT Airport

Update an Airport by Document ID

We use the ID value passed in via the URL to call the `upsert_document` method in CouchbaseClient passing it the key and the data provided in the request body using request.json.

```python
# put method in class AirportId of airport.py
updated_doc = request.json
couchbase_db.upsert_document(AIRPORT_COLLECTION, key=id, doc=updated_doc)
return updated_doc
```

The CouchbaseClient class `upsert_document` method calls the `upsert` method defined for collection in the Couchbase SDK with the key and json data to update the document in the database.

```python
# CouchbaseClient class in db.py
def upsert_document(self, collection_name: str, key: str, doc: dict):
  """Upsert document using KV operation"""
  return self.scope.collection(collection_name).upsert(key, doc)
```

### DELETE Airport

Navigate to the `delete` function in `airport.py`. We only need the key or document ID from the user to delete a document using the key-value operation.

```python
# delete method in class AirportId of airport.py
couchbase_db.delete_document(AIRPORT_COLLECTION, key=id)
return "Deleted", 204
```

The `delete_document` method in CouchbaseClient class calls the `remove` method defined for collection in the Couchbase SDK sending the key of the document to remove from the database.

```python
# CouchbaseClient class in db.py
def delete_document(self, collection_name: str, key: str):
    """Delete document using KV operation"""
    return self.scope.collection(collection_name).remove(key)
```

### List Airport

This endpoint retrieves the list of airports in the database. The API has options to specify the page size for the results and country from which to fetch the airport documents.

[SQL++](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html) is a powerful query language based on SQL, but designed for structured and flexible JSON documents. We will use a SQL+ query to search for airports with Limit, Offset, and Country option.

Navigate to the `get` method in the `AirportList` class of `airport.py` file. This endpoint is different from the others we have seen before because it makes the SQL++ query rather than a key-value operation. This usually means more overhead because the query engine is involved. For this query, we are using the predefined indices in the `travel-sample` bucket. We can create an additional [index](https://docs.couchbase.com/server/current/learn/services-and-indexes/indexes/indexing-and-query-perf.html) specific for this query to make it perform better.

First, we need to get the values from the query string for country, limit, and Offset that we will use in our query. These are pulled from the `request.args.get` method.

This end point has two queries depending on the value for the country parameter. If a country name is specified, we retrieve the airport documents for that specific country. If it is not specified, we retrieve the list of airports across all countries. The queries are slightly different for these two scenarios.

We build our SQL++ query using the [parameters](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html#queries-placeholders) specified by `$` symbol for both these scenarios. The difference between the two queries is the presence of the `country` parameter in the query. Normally for the queries with pagination, it is advised to order the results to maintain the order of results across multiple queries.

Next, we pass that `query` to the CouchbaseClient class `query` method. We save the results in a list, `airports`. By default, the Python SDK will [stream result set from the server](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html#streaming-large-result-sets). To gather all the results, we need to iterate over the results.

```python
# get method in AirportList class in airport.py
country = request.args.get("country", "")
limit = int(request.args.get("limit", 10))
offset = int(request.args.get("offset", 0))

# create query
if country:
    query = """
        SELECT airport.airportname,
            airport.city,
            airport.country,
            airport.faa,
            airport.geo,
            airport.icao,
            airport.tz
        FROM airport AS airport
        WHERE airport.country = $country
        ORDER BY airport.airportname
        LIMIT $limit
        OFFSET $offset;
    """
else:
    query = """
        SELECT airport.airportname,
            airport.city,
            airport.country,
            airport.faa,
            airport.geo,
            airport.icao,
            airport.tz
        FROM airport AS airport
        ORDER BY airport.airportname
        LIMIT $limit
        OFFSET $offset;
    """

# run query
results = couchbase_db.query(
            query, country=country, limit=limit, offset=offset
          )
# gather all documents
airports = [r for r in results]
return airports
```

The `query` method in the CouchbaseClient class executes the SQL++ query using the `query` method defined in the [Scope](https://docs.couchbase.com/python-sdk/current/howtos/n1ql-queries-with-sdk.html#querying-at-scope-level) by the Couchbase SDK.

```python
# CouchbaseClient class in db.py
def query(self, sql_query, *options, **kwargs):
  """Query Couchbase using SQL++"""
  # options are used for positional parameters
  # kwargs are used for named parameters
  return self.scope.query(sql_query, *options, **kwargs)
```

### Direct Connections

This endpoint fetches the airports that can be reached directly from the specified source airport code. This also uses a SQL++ query to fetch the results simlar to the List Airport endpoint.

Let us look at the query used here:

```sql
SELECT distinct (route.destinationairport)
FROM airport as airport
JOIN route as route on route.sourceairport = airport.faa
WHERE airport.faa = $airport and route.stops = 0
ORDER BY route.destinationairport
LIMIT $limit
OFFSET $offset
```

We are fetching the direct connections by joining the airport collection with the route collection and filtering based on the source airport specified by the user and by routes with no stops.

### Running The Tests

We have defined unit tests using [pytest](https://docs.pytest.org/en/7.4.x/) for all the API end points. The unit tests use the same database configuration as the application. For the unit tests, we perform the operation using the API and confirm the results by checking the documents in the database. For example, to check the creation of the document by the API, we would call the API to create the document and then read the same document directly from the database using the CouchbaseClient and compare them. After the tests, the documents are cleaned up.

The tests including the fixtures and helpers for the tests are configured in the `conftest.py` file in the tests folder.

To run the standard unit tests, use the following commands:

```bash
cd src
python -m pytest
```

## Conclusion

In this tutorial, we saw how to build a basic REST API with Couchbase in Python using Flask. We used the key-value operations in Couchbase for Create, Read, Update and Delete (CRUD) operations and used SQL++ queries to fetch documents based on user input.

### Appendix 1: Extending API by Adding New Entity

If you would like to add another entity to the APIs, these are the steps to follow:

- Create the new entity (collection) in the Couchbase bucket. You can create the collection using the [SDK](https://docs.couchbase.com/sdk-api/couchbase-python-client/couchbase_api/couchbase_management.html#couchbase.management.collections.CollectionManager.create_collection) or via the [Couchbase Server interface](https://docs.couchbase.com/cloud/n1ql/n1ql-language-reference/createcollection.html).
- Define the routes in a new file in the `api` folder similar to the existing routes like `airport.py`.
- Add the new routes to the application in `app.py`.

### Appendix 2: Running Self Managed Couchbase Cluster

If you are running this quickstart with a self managed Couchbase cluster, you need to [load](https://docs.couchbase.com/server/current/manage/manage-settings/install-sample-buckets.html) the travel-sample data bucket in your cluster and generate the credentials for the bucket.

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the lastest Couchbase Database Server Instance.

You need to update the connection string and the credentials in the `.env` file in the source folder.

> Note: Couchbase Server must be installed and running prior to running the Flask Python app.
