---
# frontmatter
path: "/tutorial-quickstart-mylang-tutorial"
# title and description do not need to be added to markdown, start with H2 (##)
title: Start with Mylang
short_title: Couchbase Mylang
description: 
  - Build a REST API with Couchbase's Java SDK 3 and Mylang
  - Explore the various features of Mylang
content_type: tutorial
filter: sdk
technology: 
  - kv
  - query
tags:
  - REST API
sdk_language:
  - mylang
length: 30 Mins
---

[![Try it now!](https://da-demo-images.s3.amazonaws.com/runItNow_outline.png?couchbase-example=kotlin-quickstart&source=github)](https://gitpod.io/#https://github.com/couchbase-examples/kotlin-quickstart)

## Prerequisites

To run this prebuilt project, you will need:

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance (at least Couchbase Server 7)
- Java SDK v1.8 or higher installed
- Code Editor installed (Vim, IntelliJ IDEA, Eclipse, or Visual Studio Code)
- Gradle command line

## What We'll Cover

A simple REST API using Ktor and Kotlin Couchbase SDK with the following endpoints:

- [Create Profile Endpoint](#post-a-profile)
- [Profile Management Endpoints](#working-with-existing-profiles) – List, Fetch, Update, and Delete operations
- [Profile Search Endpoint](#get-profiles-by-searching)  – Get all profiles matching first or last Name

## Source Code

```shell
git clone https://github.com/couchbase-examples/kotlin-quickstart
```

## Install Dependencies
```shell
gradle build
```

> Note: Most IDE will run a similar command automatically after you open the project.

### Database Server Configuration

All configuration for communication with the database is stored in the `src/main/resources/application.conf` file under the `couchbase` section:
```
couchbase {
    connectionString = localhost
    username = Administrator
    password = password
    bucket = user_profile
    scope = default
}
```
> _from [`src/main/resources/application.conf`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/resources/application.conf)_

This includes the connection string, username, password, bucket and scope names.
The default username is assumed to be `Administrator` and the default password is assumed to be `password`.
If these are different in your environment you will need to change them before running the application.

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

## Running The Application

At this point the application is ready, and you can run it via your IDE or from the terminal:

```shell
./gradlew run
```

Once the site is up and running you can launch your browser and go to the [Swagger Start Page](http://localhost:8080/swagger-ui/) to test the APIs.

## Document Structure

We will be setting up a REST API to manage some profile documents. Our profile document will have an auto-generated UUID for its key, first and last name of the user, an email, and hashed password. For this demo we will store all profile information in just one document in a collection named `profile`:

```json
{
  "pid": "b181551f-071a-4539-96a5-8a3fe8717faf",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@couchbase.com",
  "password": "$2a$10$tZ23pbQ1sCX4BknkDIN6NekNo1p/Xo.Vfsttm.USwWYbLAAspeWsC"
}
```

## Let's Review the Code

To begin, clone the repo and open it up in the IDE of your choice to learn about how to create, read, update and delete documents in your Couchbase Server.

## Data models
The application uses two data classes: 
- `ProfileWithoutId` is used to handle requests to create a new Profile record. As the name suggests, it contains all profile information except for its identifier, which will be assigned by the application after the profile is created
- `Profile` class represents profiles that are stored on Couchbase cluster and, thus, have an assigned identifier.

All used data classes can be reviewed in the [`src/main/kotlin/com/couchbase/kotlin/quickstart/Models.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/Models.kt) file.

## POST a Profile

For CRUD operations we will use the [Key Value operations](https://docs.couchbase.com/kotlin-sdk/current/howtos/kv-operations.html) that are built into the Couchbase SDK to create, read, update, and delete cluster documents.
Every document will need an ID (similar to a primary key in other databases) in order to save it to the database.

Open the [`ProfileRoutes.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRoutes.kt) file found in the `src/main/kotlin/com/couchbase/kotlin/quickstart` folder. 
This file contains all http routes defined in the API, which are groupped under the `/profile` common route.
The first handler function allows API clients create new profiles by submitting a POST request with json-serialized profile without an id object in its body.

The handler passes received profile data to `createProfile` method of application's profile service, defined in [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileService.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileService.kt) which, in turn, delegates the request to `ProfileRepository::create` method:

```
fun create(data: ProfileWithoutId): Profile {
    val profile = Profile(
        pid = UUID.randomUUID()
    ).apply {
        firstName = data.firstName
        lastName = data.lastName
        email = data.email
        password = data.password
        balance = data.balance
    }

    runBlocking(databaseContext) {
        collection.insert(profile.pid.toString(), profile)
    }
    return profile
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt)_

The repository method creates new Profile object with random UUID, populates it with received data and then uses SDK collection object to store the profile on the cluster.

Stored profile is then returned up the call stack and rendered as JSON in HTTP response body.

## Working with existing Profiles

### Listing profiles

The next handler function processes HTTP GET requests to the `/profile` API endpoint.
Clients can use this endpoint to request all previously created profiles.
The function accepts a `PaginationRequest` object, which represents a set of GET parameters:
```
data class PaginationRequest (
    @QueryParam("Profiles to skip before the results", allowEmptyValues = true)
    val skip: Int?,
    @QueryParam("Number of results", allowEmptyValues = true)
    val limit: Int?
)
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRoutes.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRoutes.kt)_

Following the same pattern as in the POST handler, request is delegated to `list` method of profile repository:
```
fun list(skip: Int, limit: Int): List<Profile> {
    val result: LinkedList<Profile> = LinkedList()
    runBlocking(databaseContext) {
        collection.scope
            .query("SELECT raw profile from profile OFFSET $skip LIMIT $limit")
            .execute {
                result.add(it.contentAs())
            }
    }
    return result
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt)_

The method uses SQL++ to select profile documents from the cluster.
Selected documents are then transformed to Profile objects using `contentAs` SDK method and returned back to the client.

### Reading, updating and deleting profiles
Our API exposes every profile object at its own URL that contains the "/profile/" prefix and ends with serialized profile identifier, for example: `/profile/5ba0c68c-935c-4f0b-bd09-1edb76f79cc9`.

Requests sent using different HTTP methods handled by different functions that all use `ProfileRequest` object to retrieve the profile identifier from the requested URL.

The GET handler returns profile object with requested ID. 
It delegates all work to the profile service, which uses the SDK to fetch the requested document from Couchbase's key-value service:

```
fun getById(id: UUID): Profile {
    var result: Profile
    runBlocking(databaseContext) {
        result = collection.get(id.toString()).contentAs()
    }
    return result
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt)_

The PUT handler additionally accepts a Profile object in the HTTP request body and then uses the SDK key-value operation to store it in Couchbase, overriding the previous profile data:
```
fun store(profile: Profile): Profile {
    runBlocking(databaseContext) {
        collection.insert(profile.pid.toString(), profile)
    }
    return profile
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt)_


Finally, the DELETE handler, which accepts only a profile identifier as the last part of the request URL, deletes correspondig profile documents from the cluster.
```
fun delete(id: UUID) {
    runBlocking(databaseContext) {
        collection.remove(id.toString());
    }
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt)_

## GET Profiles by Searching

[SQL++](https://docs.couchbase.com/kotlin-sdk/current/howtos/n1ql-queries.html) is a powerful query language based on SQL, but designed for structured and flexible JSON documents. We will use a SQL++ query to search for profiles with Skip, Limit, and Search string parameters.
The search is implemented under the "/profile/search" url in the last handler function inside `ProfileRoutes.kt` file.

Search handfler function processes GET requests and uses `ProfileSearchRequest` data class to accept profile search string and optional pagination parameters.
The actual search is again done by a repository function:

```
fun search(text: String, skip: Int = 0, limit: Int = 10): List<Profile> {
    return runBlocking(databaseContext) {
        val lowerText = text.lowercase()
        val qryString = "SELECT p.* FROM `profile` p " +
                "WHERE lower(p.firstName) LIKE '%$lowerText%' " +
                "OR lower(p.lastName) LIKE '%$lowerText%' " +
                "LIMIT $limit OFFSET $skip"
        val result = collection.scope.query(qryString, readonly = true).execute()
        result.rows.map {
            it.contentAs<Profile>()
        }.toList()
    }
}
```
> _from [`src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt`](https://github.com/couchbase-examples/kotlin-quickstart/blob/main/src/main/kotlin/com/couchbase/kotlin/quickstart/ProfileRepository.kt)_

We use `LIKE` SQL++ operator and lower case strings to perform case-insensitive lookup for all profile objects that contain the search string either in first or last name.

### Running The Tests and using the API

To run the standard integration tests, use the following commands:

```shell
./gradlew test
```

And, to run the application, use `./gradlew run`, which should create an HTTP server with OpenAPI UI at [http://localhost:8080](http://localhost:8080)

### Project Setup Notes

This project was based on the standard Ktor project.
A full list of packages is referenced in the `build.gradle` file.

## Conclusion

Setting up a basic REST API in Kotlin with Couchbase is very straight-forward.  This project when run with Couchbase Server 7 installed uses a bucket in Couchbase, an index for our parameterized [N1QL query](https://docs.couchbase.com/java-sdk/current/howtos/n1ql-queries-with-sdk.html), and showcases basic CRUD operations needed in most applications.
