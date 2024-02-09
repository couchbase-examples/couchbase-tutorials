---
# frontmatter
path: "/tutorial-quickstart-java-springdata"
title: Couchbase With Spring-Boot and Spring Data
short_title: Spring Data
description:
  - Build a REST API with Couchbase and Spring Data
  - Learn how to configure the Couchbase SDK
content_type: tutorial
filter: sdk
technology:
  - kv
  - query
tags:
  - Spring Boot
  - Spring Data
sdk_language:
  - java
length: 30 Mins
---

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Source Code](#source-code)
  - [Install Dependencies](#install-dependencies)
  - [Database Server Configuration](#database-server-configuration)
  - [Application Properties](#application-properties)
- [Running the Application](#running-the-application)
  - [Directly on the machine](#directly-on-the-machine)
  - [Docker](#docker)
- [What We'll Cover](#what-well-cover)
  - [Document Structure](#document-structure)
  - [Code Organization](#code-organization)
- [Data Model](#data-model)
- [Let's Review the Code](#lets-review-the-code)
  - [Integration Tests](#integration-tests)
  - [Repository](#repository)
  - [Model](#model)
  - [Controller](#controller)
  - [Service](#service)i
- [Mapping Workflow](#mapping-workflow)
  - [GET Mapping Workflow](#get-mapping-workflow)
  - [POST Mapping Workflow](#post-mapping-workflow)
  - [PUT Mapping Workflow](#put-mapping-workflow)
  - [DELETE Mapping Workflow](#delete-mapping-workflow)
- [Custom SQL++ Queries](#custom-sql-queries)
- [Running The Tests](#running-the-tests)
- [Project Setup Notes](#project-setup-notes)
- [Contributing](#contributing)
- [Appendix](#appendix)
  - [Extending API by Adding New Entity](#extending-api-by-adding-new-entity)
  - [Running Self Managed Couchbase Cluster](#running-self-managed-couchbase-cluster)
  - [Swagger Documentation](#swagger-documentation)

## Getting Started

### Prerequisites

To run this prebuild project, you will need:

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded.
  - To run this tutorial using a self managed Couchbase cluster, please refer to the [appendix](#running-self-managed-couchbase-cluster).
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Code Editor or an Integrated Development Environment (e.g., [Eclipse](https://www.eclipse.org/ide/))
- [Java SDK v1.8 or higher installed](https://www.oracle.com/java/technologies/ee8-install-guide.html)
- [Gradle Build Tool](https://gradle.org/install/)

### Source Code

The sample source code used in this tutorial is [published on GitHub](https://github.com/couchbase-examples/java-springboot-quickstart).
To obtain it, clone the git repository with your IDE or execute the following command:

```shell
git clone https://github.com/couchbase-examples/java-springdata-quickstart.git
```

### Install Dependencies

Gradle dependencies:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-web'
// spring data couchbase connector
implementation 'org.springframework.boot:spring-boot-starter-data-couchbase'
// swagger ui
implementation 'org.springdoc:springdoc-openapi-ui:1.6.6'
```

Maven dependencies:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-couchbase</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-ui</artifactId>
  <version>1.6.6</version>
</dependency>
```

## What We'll Cover

- [Cluster Connection Configuration](#cluster-connection-configuration) – Configuring Spring Data to connect to a Couchbase cluster.
- [Database Initialization](#database-initialization) – Creating required database structures upon application startup
- [CRUD operations](#create-or-update-a-profile) – Standard create, update and delete operations.
- [Custom SQL++ queries](#search-profiles-by-text) – Using [SQl++](https://www.couchbase.com/sqlplusplus) with Spring Data.

## Useful Links

- [Spring Data Couchbase - Reference Documentation](https://docs.spring.io/spring-data/couchbase/docs/current/reference/html/)
- [Spring Data Couchbase - JavaDoc](https://docs.spring.io/spring-data/couchbase/docs/current/api/)

### Database Server Configuration

Spring Data couchbase connector can be configured by providing a `@Configuration` [bean](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-definition) that extends [`AbstractCouchbaseConfiguration`](https://docs.spring.io/spring-data/couchbase/docs/current/api/org/springframework/data/couchbase/config/AbstractCouchbaseConfiguration.html).
The sample application provides a configuration bean that uses default couchbase login and password:

```java
@Configuration
public class CouchbaseConfiguration extends AbstractCouchbaseConfiguration {

  @Override
  public String getConnectionString() {
    // capella
    // return "couchbases://cb.jnym5s9gv4ealbe.cloud.couchbase.com";

    // localhost
    return "127.0.0.1"
  }

  @Override
  public String getUserName() {
    return "Administrator";
  }

  @Override
  public String getPassword() {
    return "password";
  }

  @Override
  public String getBucketName() {
    return "springdata_quickstart";
  }

  ...
```

> _from config/CouchbaseConfiguration.java_

This default configuration assumes that you have a locally running Couchbae server and uses standard administrative login and password for demonstration purpose.
Applications deployed to production or staging environments should use less privileged credentials created using [Role-Based Access Control](https://docs.couchbase.com/go-sdk/current/concept-docs/rbac.html).
Please refer to [Managing Connections using the Java SDK with Couchbase Server](https://docs.couchbase.com/java-sdk/current/howtos/managing-connections.html) for more information on Capella and local cluster connections.

### Application Properties

You need to configure the connection details to your Couchbase Server in the application.properties file located in the src/main/resources directory.s

```properties
spring.couchbase.bootstrap-hosts=DB_CONN_STR
spring.couchbase.bucket.user=DB_USERNAME
spring.couchbase.bucket.password=DB_PASSWORD
```

In the connection string, replace `DB_CONN_STR` with the connection string of your Couchbase cluster. Replace `DB_USERNAME` and `DB_PASSWORD` with the username and password of a Couchbase user with access to the bucket.

The connection string should be in the following format:

```properties
spring.couchbase.bootstrap-hosts=couchbases://cb.fwu-oviwcpjq4v.cloud.couchbase.com
OR
spring.couchbase.bootstrap-hosts=localhost
```

The couchbases protocol is used for secure connections. If you are using Couchbase Server 6.5 or earlier, you should use the couchbase protocol instead.

## Running the Application

### Directly on Machine

At this point, we have installed the dependencies, loaded the travel-sample data and configured the application with the credentials. The application is now ready and you can run it.

```sh
gradle bootRun
```

Note: If you're using Windows, you can run the application using the `gradle.bat` executable.

```sh
./gradew.bat bootRun
```

<!-- Screeenshot -->

![Spring Data Application](./app-startup-spring-data.png)

Once the site is up and running, you can launch your browser and go to the [Swagger Start Page](http://localhost:8080/swagger-ui/) to test the APIs.

<!-- Screenshot -->

![Swagger UI](./swagger-documentation-spring-data.png)

### Using Docker

Build the Docker image

```sh
docker build -t java-springdata-quickstart .
```

Run the Docker image

```sh
docker run -d --name springdata-container -p 8080:8080 java-springdata-quickstart
```

Note: The `application.properties` file has the connection information to connect to your Capella cluster. These will be part of the environment variables in the Docker container.

## What We'll Cover

A simple REST API using Spring Boot and the `Couchbase SDK version 3.x` with the following endpoints:

- [Create new airlines with essential information](#post-mapping).
- [Update airline details](#put-mapping).
- [Delete airlines](#delete-mapping).
- [Retrieve airlines by ID](#get-mapping).
- [List all airlines with pagination](#get-mapping).
- [List airlines by country](#get-mapping).
- [List airlines by destination airport](#get-mapping).

### Document Structure

We will be setting up a REST API to manage some airline documents. Our airline document will have a structure similar to the following:

```json
{
  "id": "airline_8091",
  "type": "airline",
  "name": "Couchbase Airways",
  "callsign": "Couchbase",
  "iata": "CB",
  "icao": "CBA",
  "country": "United States",
  "active": true
}
```

The `id` field is the unique identifier for the document. The `type` field is used to identify the type of document. The `name` field is the name of the airline. The `callsign` field is the callsign of the airline. The `iata` field is the IATA code of the airline. The `icao` field is the ICAO code of the airline. The `country` field is the country of the airline. The `active` field is a boolean value indicating whether the airline is active or not.

### Code Organization

- `src/test/java`: Contains integration tests.
- `src/main/java/org/couchbase/quickstart/springdata/repository`: Contains the repository implementation.
- `src/main/java/org/couchbase/quickstart/springdata/model`: Contains the data model.
- `src/main/java/org/couchbase/quickstart/springdata/controller`: Contains the RESTful API controllers.
- `src/main/java/org/couchbase/quickstart/springdata/service`: Contains the service classes.

## Data Model

For this tutorial, we use three collections, `airport`, `airline` and `route` that contain sample airports, airlines and airline routes respectively. The route collection connects the airports and airlines as seen in the figure below. We use these connections in the quickstart to generate airports that are directly connected and airlines connecting to a destination airport. Note that these are just examples to highlight how you can use SQL++ queries to join the collections.

![Data Model](./travel_sample_data_model.png)

## Let's Review the Code

To begin clone the repo and open it up in the IDE of your choice to learn about how to create, read, update and delete documents in your Couchbase Server.

### Repository

`AirlineRepository.java`
This interface extends the `CouchbaseRepository` interface and provides methods for CRUD operations. The `@N1qlPrimaryIndexed` annotation creates a primary index on the `airline` collection. The `@ViewIndexed` annotation creates a view index on the `airline` collection. The `@Query` annotation allows us to create custom N1QL queries. The `@ScanConsistency` annotation allows us to specify the scan consistency for the query. The `@Param` annotation allows us to specify parameters for the query.

### Model

`Airline.java`
This class represents an airline document. The `@Document` annotation indicates that this class is a Couchbase document. The `@Id` annotation indicates that the `id` field is the document ID. The `@Field` annotation indicates that the following fields are Couchbase document fields: `type`, `name`, `callsign`, `iata`, `icao`, `country`, and `active`.

### Controller

`AirlineController.java`
This class contains the REST API endpoints for CRUD operations. The `@RestController` annotation indicates that this class is a REST controller. The `@RequestMapping` annotation specifies the base URL for the REST API. The `@Autowired` annotation is used to autowire the `AirlineService` object. The `@GetMapping`, `@PostMapping`, `@PutMapping`, and `@DeleteMapping` annotations are used to map HTTP GET, POST, PUT, and DELETE requests respectively to their corresponding methods.

### Service

`AirlineService.java`
This class contains the business logic for the REST API. The `@Autowired` annotation is used to autowire the `AirlineRepository` object.

## Mapping Workflow

### GET Mapping Workflow

- The client initiates a GET request to `/api/v1/airline/{id}`, providing the unique identifier (`{id}`) of the airline they want to retrieve.
- The `AirlineController` receives the request and invokes the `getAirlineById(id)` method in the `AirlineService`. This function internally calls the [findById](<https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html#findById(ID)>) method of the `AirlineRepository`(which extends `CouchbaseRepository`) to retrieve the airline information from the Couchbase database.
- Inside the `AirlineService`, the request is processed. The service interacts with the `AirlineRepository`.
- The `AirlineRepository` executes a query against the Couchbase database to retrieve the airline information based on the provided ID.
- If the airline is found, the `AirlineService` returns the retrieved information to the `AirlineController`.
- The `AirlineController` sends an HTTP response with an HTTP status code of `200` (OK) and includes the airline information in the response body.
- If the airline is not found in the database, the `AirlineService` returns `null`.
- The `AirlineController` responds with an HTTP status code of `404` (Not Found) if the airline is not found.

### POST Mapping Workflow

- The client initiates a POST request to `/api/v1/airline/{id}` with a JSON payload containing the airline's information, including a unique ID.
- The `AirlineController` receives the request and invokes the `createAirline(airline)` method in the `AirlineService`. The `createAirline` method internally calls the [save](<https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html#save(S)>) method of the `AirlineRepository` to save the airline information to the Couchbase database.
- Inside the `AirlineService`, the incoming data is validated to ensure it meets the required criteria.
- The `AirlineService` creates a new `Airline` object and saves it to the Couchbase database using the `AirlineRepository`.
- If the airline is successfully created, the `AirlineService` returns the newly created airline object.
- The `AirlineController` sends an HTTP response with an HTTP status code of `201` (Created), including the newly created airline information in the response body.
- If the airline already exists in the database, a `DocumentExistsException` may be thrown.
- In case of a conflict, the `AirlineController` responds with an HTTP status code of `409` (Conflict).

### PUT Mapping Workflow

- The client initiates a PUT request to `/api/v1/airline/{id}` with a JSON payload containing the updated airline information and the unique ID of the airline to be updated.
- The `AirlineController` receives the request and invokes the `updateAirline(id, airline)` method in the `AirlineService`. The `updateAirline` method internally calls the [save](<https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html#save(S)>) method of the `AirlineRepository` to update the airline information in the Couchbase database.
- Inside the `AirlineService`, the incoming data is validated to ensure it meets the required criteria.
- The `AirlineService` updates the airline record in the Couchbase database using the `AirlineRepository`.
- If the airline is found and updated successfully, the `AirlineService` returns the updated airline object.
- The `AirlineController` sends an HTTP response with an HTTP status code of `200` (OK), including the updated airline information in the response body.
- If the airline is not found in the database, the `AirlineService` returns `null`.
- In case of an update to a non-existent airline, the `AirlineController` responds with an HTTP status code of `404` (Not Found).

### DELETE Mapping Workflow

- The client initiates a DELETE request to `/api/v1/airline/{id}`, specifying the unique identifier (`{id}`) of the airline to be deleted.
- The `AirlineController` receives the request and invokes the `deleteAirline(id)` method in the `AirlineService`. The `deleteAirline` method internally calls the [deleteById](<https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html#deleteById(ID)>) method of the `AirlineRepository` to delete the airline from the Couchbase database.
- Inside the `AirlineService`, the service attempts to find and delete the airline record from the Couchbase database using the `AirlineRepository`.
- If the airline is found and successfully deleted, the `AirlineService` completes the operation.
- The `AirlineController` responds with an HTTP status code of `204` (No Content) to indicate a successful deletion.
- If the airline is not found in the database, the `AirlineService` may throw a `DocumentNotFoundException`.
- In case the airline is not found, the `AirlineController` responds with an HTTP status code of `404` (Not Found).

These detailed workflows provide a comprehensive understanding of how each mapping is handled by the controller, service, and repository components in your Spring Data project.

## Custom SQL++ Queries

The `AirlineRepository` interface contains a `@Query` annotation that allows us to create custom N1QL queries. The `@ScanConsistency` annotation allows us to specify the scan consistency for the query. The `@Param` annotation allows us to specify parameters for the query.

```java
@Query("#{#n1ql.selectEntity} WHERE #{#n1ql.filter} AND country = $country")
@ScanConsistency(query = QueryScanConsistency.REQUEST_PLUS)
List<Airline> findByCountry(@Param("country") String country);
```

> _from repository/AirlineRepository.java_

The `findByCountry` method returns a list of airlines by country. It uses the `@Query` annotation to create a custom N1QL query. The `@Param` annotation is used to specify the `country` parameter for the query. The `@ScanConsistency` annotation is used to specify the scan consistency for the query.

```java
@Query("#{#n1ql.selectEntity} WHERE #{#n1ql.filter} AND ANY destination IN routes SATISFIES destination = $airport END")
@ScanConsistency(query = QueryScanConsistency.REQUEST_PLUS)
List<Airline> findByDestinationAirport(@Param("airport") String airport);
```

> _from repository/AirlineRepository.java_

The `findByDestinationAirport` method returns a list of airlines by destination airport. It uses the `@Query` annotation to create a custom N1QL query. The `@Param` annotation is used to specify the `airport` parameter for the query. The `@ScanConsistency` annotation is used to specify the scan consistency for the query.

<!-- Link to docs -->

For more information, see the [Couchbase Java SDK documentation](https://docs.couchbase.com/java-sdk/current/howtos/n1ql-queries-with-sdk.html).

## Running The Tests

To run the tests, execute `./gradlew test` (`./gradlew.bat test` on Windows).

```sh
./gradlew test
```

## Project Setup Notes

This project was created using the [Spring Initializr](https://start.spring.io/) with the following options:

- Project: Gradle Project
- Language: Java
- Spring Boot: 2.7.18
- Packaging: Jar
- Java: 8
- Dependencies: Spring Web, Spring Data Couchbase, Springdoc OpenAPI UI

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please fork the repository and create a pull request.

## Appendix

### Extending API by Adding New Entity

If you would like to add another entity to the APIs, these are the steps to follow:

- Create the new entity (collection) in the Couchbase bucket. You can create the collection using the [SDK](https://docs.couchbase.com/sdk-api/couchbase-java-client-3.5.2/com/couchbase/client/java/Collection.html#createScope-java.lang.String-) or via the [Couchbase Server interface](https://docs.couchbase.com/cloud/n1ql/n1ql-language-reference/createcollection.html).
- Define the mappings in a new file in the `controllers` folder similar to the existing mappings like `AirportController.java`.
- Define the service in a new file in the `services` folder similar to the existing services like `AirportService.java`.
- Define the repository in a new file in the `repositories` folder similar to the existing repositories like `AirportRepository.java`.

### Running Self Managed Couchbase Cluster

If you are running this quickstart with a self managed Couchbase cluster, you need to [load](https://docs.couchbase.com/server/current/manage/manage-settings/install-sample-buckets.html) the travel-sample data bucket in your cluster and generate the credentials for the bucket.

You need to update the connection string and the credentials in the [`src/main/resources/application.properties`](https://github.com/couchbase-examples/java-springboot-quickstart/blob/main/src/main/resources/application.properties) file.

> **NOTE:** Couchbase must be installed and running prior to running the Spring Boot app.

### Swagger Documentation

Swagger documentation provides a clear view of the API including endpoints, HTTP methods, request parameters, and response objects.

Click on an individual endpoint to expand it and see detailed information. This includes the endpoint's description, possible response status codes, and the request parameters it accepts.

#### Trying Out the API

You can try out an API by clicking on the "Try it out" button next to the endpoints.

- Parameters: If an endpoint requires parameters, Swagger UI provides input boxes for you to fill in. This could include path parameters, query strings, headers, or the body of a POST/PUT request.

- Execution: Once you've inputted all the necessary parameters, you can click the "Execute" button to make a live API call. Swagger UI will send the request to the API and display the response directly in the documentation. This includes the response code, response headers, and response body.

#### Models

Swagger documents the structure of request and response bodies using models. These models define the expected data structure using JSON schema and are extremely helpful in understanding what data to send and expect.
