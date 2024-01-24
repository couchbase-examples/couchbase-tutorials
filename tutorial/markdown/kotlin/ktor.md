---
# frontmatter
path: "/tutorial-quickstart-kotlin-ktor"
# title and description do not need to be added to markdown, start with H2 (##)
title: Quickstart in Couchbase with Kotlin and Ktor
short_title: Couchbase Kotlin SDK with Ktor
description: 
  - Learn to build a REST API in Kotlin using Ktor and Couchbase
  - See how you can fetch data from Couchbase using SQL++ queries
  - Explore CRUD operations in action with Couchbase
content_type: quickstart
filter: sdk
technology:
  - kv
  - index
  - query
tags:
  - Ktor
  - REST API
sdk_language:
  - kotlin
length: 30 Mins
---

<!-- [abstract] -->

In this tutorial, you will learn how to connect to a Couchbase Capella cluster to create, read, update, and delete documents and how to write simple parametrized SQL++ queries.

## Prerequisites
To run this prebuilt project, you will need:

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [travel-sample](https://docs.couchbase.com/kotlin-sdk/current/ref/travel-app-data-model.html) bucket loaded.
    - To run this tutorial using a self managed Couchbase cluster, please refer to the [appendix](#running-self-managed-couchbase-cluster).
- [Java SDK v1.8](https://www.oracle.com/java/technologies/downloads/) or higher installed.
    - Ensure that the Java version is [compatible](https://docs.couchbase.com/kotlin-sdk/current/project-docs/compatibility.html) with the Couchbase SDK.
- Code Editor installed (Vim, IntelliJ IDEA, Eclipse, or Visual Studio Code)
- Loading Travel Sample Bucket
    - If travel-sample is not loaded in your Capella cluster, you can load it by following the instructions for your Capella Cluster:
        - [Load travel-sample bucket in Couchbase Capella](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html#import-sample-data)

### Couchbase Capella Configuration

When running Couchbase using [Capella](https://cloud.couchbase.com/), the following prerequisites need to be met.

- The application requires the travel-sample bucket to be [loaded](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html#import-sample-data) in the cluster from the Capella UI.
- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

## App Setup

We will walk through the different steps required to get the application running.

### Cloning Repo

```shell
git clone https://github.com/couchbase-examples/kotlin-quickstart.git
```

### Install Dependencies

```shell
./gradlew build -x test
```

### Dependency Injection via Couchbase Koin module

The quickstart code provides a Koin module that exports configuration, cluster, bucket and scope beans to the application.
```
// Creates a cluster bean
fun createCluster(configuration: CouchbaseConfiguration): Cluster {
  return Cluster.connect(
    connectionString = configuration.connectionString,
    username = configuration.username,
    password = configuration.password,
  )
}


// Creates a bucket bean
@ExperimentalTime
fun createBucket(cluster: Cluster, configuration: CouchbaseConfiguration): Bucket {
  val result : Bucket?
  runBlocking {
    result = cluster.bucket(configuration.bucket).waitUntilReady(10.seconds)
  }
  return result!!
}

// Creates a bucket scope bean
fun createScope(bucket: Bucket, configuration: CouchbaseConfiguration): Scope {
  return bucket.scope(configuration.scope)
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/CouchbaseConfiguration.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/CouchbaseConfiguration.kt)_

Configured database objects like the bucket and scope must exist on the cluster prior to starting the application.

### Setup Database Configuration

To know more about connecting to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

All configuration for communication with the database is stored in the `src/main/resources/application.conf` file under the `couchbase` section:

```
couchbase {
    connectionString = "localhost"
    username = "Administrator"
    password = "password"
    bucket = "travel-sample"
    scope = "inventory"
}
```
> _from [`src/main/resources/application.conf`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/resources/application.conf)_

This includes the connection string, username, password, bucket and scope names. The default username is assumed to be `Administrator` and the default password is assumed to be `password`.
If these are different in your environment you will need to change them before running the application.

## Running The Application

### Directly on Machine

At this point, we have installed the dependencies, loaded the travel-sample data and configured the application with the credentials. The application is now ready and you can run it.

```shell
./gradlew run
```

### Using Docker

- Build the Docker image

```shell 
docker build -t couchbase-koltin-quickstart .
```

- Run the docker image

```shell 
docker run -e DB_CONN_STR=<connection_string> -e DB_USERNAME=<user_with_read_write_permission_to_travel-sample_bucket> -e DB_PASSWORD=<password_for_user> -p 8080:8080 couchbase-koltin-quickstart
```

You can access the Application on http://0.0.0.0:8080

### Verifying the Application

Once the application starts, you can see the details of the application on the logs.

![Application Startup](app_startup.png)

The application will run on port 8080 of your local machine (http://0.0.0.0:8080). You will find the Swagger documentation of the API if you go to the URL in your browser.
Swagger documentation is used in this demo to showcase the different API end points and how they can be invoked. More details on the Swagger documentation can be found in the [appendix](#swagger-documentation).

![Swagger Documentation](swagger_documentation.png)

## Data Model

For this tutorial, we use three collections, `airport`, `airline` and `route` that contain sample airports, airlines and airline routes respectively. The route collection connects the airports and airlines as seen in the figure below. We use these connections in the quickstart to generate airports that are directly connected and airlines connecting to a destination airport. Note that these are just examples to highlight how you can use SQL++ queries to join the collections.

![img](travel_sample_data_model.png)

## Let Us Review the Code

To begin this tutorial, clone the repo and open it up in the IDE of your choice. Now you can learn about how to create, read, update and delete documents in Couchbase Server.

### Code Layout

```
├── src
│   ├── main
│   │   ├── kotlin/com/couchbase/kotlin/quickstart 
│   │   │   ├── models
│   │   │   │   ├── AirlineModel.kt
│   │   │   │   ├── AirportModel.kt
│   │   │   │   └── RouteModel.kt
│   │   │   ├── repositories
│   │   │   │   ├── AirlineRepository
│   │   │   │   ├── AirportRepository
│   │   │   │   └── RouteRepository
│   │   │   ├── routes
│   │   │   │   ├── AirlineRoutes.kt
│   │   │   │   ├── AirportRoutes.kt
│   │   │   │   └── RouteRoutes.kt
│   │   │   ├── services
│   │   │   │   ├── AirlineService
│   │   │   │   ├── AirportService
│   │   │   │   └── RouteService
│   │   │   ├── Application.kt
│   │   │   └── CouchbaseConfiguration.kt 
│   │   └── resources
│   │       ├── application.conf
│   │       └── logback.xml
│   └── test/kotlin/com/couchbase
│       └── kotlin/quickstart
│           ├── AirlineTests
│           ├── AirportTests
│           └── RouteTests
├── build.gradle.kts
└── Dockerfile
```

### Airport Entity

For this tutorial, we will focus on the airport entity. The other entities are similar.

We will be setting up a REST API to manage airport documents.

- [POST Airport](#post-airport) – Create a new airport
- [GET Airport](#get-airport) – Read specified airport
- [PUT Airport](#put-airport) – Update specified airport
- [DELETE Airport](#delete-airport) – Delete airport
- [Airport List](#list-airport) – Get all airports. Optionally filter the list by country
- [Direct Connections](#direct-connections) - Get a list of airports directly connected to the specified airport

For CRUD operations, we will use the [Key-Value operations](https://docs.couchbase.com/dotnet-sdk/current/howtos/kv-operations.html) that are built into the Couchbase SDK to create, read, update, and delete a document. Every document will need an ID (similar to a primary key in other databases) to save it to the database. This ID is passed in the URL. For other end points, we will use [SQL++](https://docs.couchbase.com/dotnet-sdk/current/howtos/n1ql-queries-with-sdk.html) to query for documents.

### Airport Document Structure

Our airport document will have an airportname, city, country, faa code, icao code, timezone info and the geographic coordinates. For this demo, we will store all airport information in one document in the `airport` collection in the `travel-sample` bucket.

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

Open the [`AirportRoutes.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/routes/AirportRoutes.kt) file found in the `src/main/kotlin/com/couchbase/kotlin/quickstart/routes` folder.
This file contains all http routes defined in the API, which are grouped under the `/api/v1/airport` common route.
The first handler function allows API clients to create new airport by submitting a POST request with json-serialized airport.

The handler passes received airport data to `createAirport` method of application's Airport service, defined in [`AirportService.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/services/AirportService.kt) which, in turn, delegates the request to `AirportRepository::create` method:

```
fun create(data: AirportModel, id: String): Airport {
        val airport = Airport().apply {
            airportname = data.airportname
            city = data.city
            country = data.country
            faa = data.faa
            geo = data.geo
            icao = data.icao
            tz = data.tz
        }

        runBlocking(databaseContext) {
            collection.insert(id, airport)
        }
        return airport
    }
```
> _from [`AirportRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/repositories/AirportRepository.kt)_

The repository method creates a new Airport object with an id, populates it with received data and then uses SDK collection object to store the airport on the cluster.

Stored airport is then returned up the call stack and rendered as JSON in HTTP response body.

### GET Airport

The GET handler returns airport object with requested ID.
It delegates all work to the airport service, which uses the SDK to fetch the requested document from Couchbase's key-value service:

```
fun getById(id: String): Airport {
        var result: Airport
        runBlocking(databaseContext) {
            result = collection.get(id).contentAs()
        }
        return result
    }
```
> _from [`AirportRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/repositories/AirportRepository.kt)_

### PUT Airport

The PUT handler additionally accepts an Airport object in the HTTP request body and then uses the SDK key-value operation to store it in Couchbase, overriding the previous profile data:

```
fun update(airport: Airport, id: String): Airport {
        runBlocking(databaseContext) {
            collection.replace(id, airport)
        }
        return airport
    }
```

> _from [`AirportRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/repositories/AirportRepository.kt)_

### DELETE Airport

The DELETE handler, which accepts only an Airport identifier as the last part of the request URL, deletes corresponding airport documents from the cluster.

```
fun delete(id: String) {
        runBlocking(databaseContext) {
            collection.remove(id)
        }
    }
```
> _from [`AirportRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/repositories/AirportRepository.kt)_

### List Airport

This endpoint retrieves the list of airports in the database. The API has options to specify the page size for the results and country from which to fetch the airport documents.

[SQL++](https://docs.couchbase.com/kotlin-sdk/current/howtos/n1ql-queries.html) is a powerful query language based on SQL, but designed for structured and flexible JSON documents. We will use a SQL+ query to search for airports with Limit, Offset, and Country option.

Open the [`AirportRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/repositories/AirportRepository.kt) file  and navigate to the `list` method. This endpoint is different from the others we have seen before because it makes the SQL++ query rather than a key-value operation. This usually means more overhead because the query engine is involved. For this query, we are using the predefined indices in the `travel-sample` bucket. We can create an additional [index](https://docs.couchbase.com/server/current/learn/services-and-indexes/indexes/indexing-and-query-perf.html) specific for this query to make it perform better.

We need to get the values from the query string for country, limit, and Offset that we will use in our query.

This end point has two queries depending on the value for the country parameter. If a country name is specified, we retrieve the airport documents for that specific country. If it is not specified, we retrieve the list of airports across all countries. The queries are slightly different for these two scenarios.

We build our SQL++ query using the [parameters](https://docs.couchbase.com/dotnet-sdk/current/howtos/n1ql-queries-with-sdk.html#parameterized-queries) specified by `$` symbol for both these scenarios. The difference between the two queries is the presence of the `country` parameter in the query. Normally for the queries with pagination, it is advised to order the results to maintain the order of results across multiple queries.

Next, we pass that `query` to the `query` method of the Couchbase SDK. We save the results in a list form.

This endpoint calls the `query` method defined in the [Scope](https://docs.couchbase.com/kotlin-sdk/current/howtos/n1ql-queries.html#search-non-default-collection) by the Couchbase SDK.

```kotlin

fun list(country: String? = null, limit: Int = 10, offset: Int = 0): List<Airport> {
        val lowerCountry = country?.lowercase()
        val query = if (!lowerCountry.isNullOrEmpty()) {
            """
        SELECT airport.airportname,
               airport.city,
               airport.country,
               airport.faa,
               airport.geo,
               airport.icao,
               airport.tz
        FROM airport AS airport
        WHERE lower(airport.country) = '$lowerCountry'
        ORDER BY airport.airportname
        LIMIT $limit
        OFFSET $offset
        """
        } else {
            """
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
        OFFSET $offset
        """
        }

        return runBlocking(databaseContext) {
            val result = collection.scope.query(query, readonly = true).execute()
            result.rows.map {
                it.contentAs<Airport>()
            }.toList()
        }
    }
           
```

### Direct Connections

This endpoint fetches the airports that can be reached directly from the specified source airport code. This also uses a SQL++ query to fetch the results similar to the List Airport endpoint.

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

## Running The Tests

We have defined integration tests using the [JUnit](https://kotlinlang.org/docs/jvm-test-using-junit.html) package for all the API end points. The integration tests use the same database configuration as the application. For the integration tests, we perform the operation using the API and confirm the results by checking the documents in the database. For example, to check the creation of the document by the API, we would call the API to create the document and then read the same document from the database and compare them. After the tests, the documents are cleaned up by calling the DELETE endpoint

To run the standard integration tests, use the following commands:

```sh
```sh
./gradlew test
```

## Appendix

### Data Model

For this quickstart, we use three collections, airport, airline and routes that contain sample airports, airlines and airline routes respectively. The routes collection connects the airports and airlines as seen in the figure below. We use these connections in the quickstart to generate airports that are directly connected and airlines connecting to a destination airport. Note that these are just examples to highlight how you can use SQL++ queries to join the collections.

![travel sample data model](travel_sample_data_model.png)

### Extending API by Adding New Entity

If you would like to add another entity to the APIs, these are the steps to follow:

- Create the new entity (collection) in the Couchbase bucket. You can create the collection using the [SDK](https://docs.couchbase.com/sdk-api/couchbase-net-client/api/Couchbase.Management.Collections.ICouchbaseCollectionManager.html#Couchbase_Management_Collections_ICouchbaseCollectionManager_CreateCollectionAsync_Couchbase_Management_Collections_CollectionSpec_Couchbase_Management_Collections_CreateCollectionOptions_) or via the [Couchbase Server interface](https://docs.couchbase.com/cloud/n1ql/n1ql-language-reference/createcollection.html).
- Define the routes in a file inside the `src/main/kotlin/com/couchbase/kotlin/quickstart/routes` folder similar to the existing routes.
- Define the services in a new file inside the `src/main/kotlin/com/couchbase/kotlin/quickstart/services` folder similar to the existing services.
- Define the repository for this collection inside a new file inside the `src/main/kotlin/com/couchbase/kotlin/quickstart/repositories` folder similar to the existing repositories.
- Add the tests for the new routes in a new file in the `src/test/kotlin/com/couchbase/kotlin/quickstart` folder similar to the existing ones.

### Running Self Managed Couchbase Cluster

If you are running this quickstart with a self managed Couchbase cluster, you need to [load](https://docs.couchbase.com/server/current/manage/manage-settings/install-sample-buckets.html) the travel-sample data bucket in your cluster and generate the credentials for the bucket.

You need to update the connection string and the credentials in the [`src/main/resources/application.conf`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/resources/application.conf) file in the source folder.

> **NOTE:** Couchbase must be installed and running prior to running the the ASP.NET app.

### Swagger Documentation

Swagger documentation provides a clear view of the API including endpoints, HTTP methods, request parameters, and response objects.

Click on an individual endpoint to expand it and see detailed information. This includes the endpoint's description, possible response status codes, and the request parameters it accepts.

#### Trying Out the API

You can try out an API by clicking on the "Try it out" button next to the endpoints.

- Parameters: If an endpoint requires parameters, Swagger UI provides input boxes for you to fill in. This could include path parameters, query strings, headers, or the body of a POST/PUT request.

- Execution: Once you've inputted all the necessary parameters, you can click the "Execute" button to make a live API call. Swagger UI will send the request to the API and display the response directly in the documentation. This includes the response code, response headers, and response body.

#### Models

Swagger documents the structure of request and response bodies using models. These models define the expected data structure using JSON schema and are extremely helpful in understanding what data to send and expect.