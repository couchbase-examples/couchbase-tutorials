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

[![Try it now!](https://da-demo-images.s3.amazonaws.com/runItNow_outline.png?couchbase-example=java-springdata-quickstart-repo&source=github)](https://gitpod.io/#https://github.com/couchbase-examples/java-springdata-quickstart)

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Source Code](#source-code)
  - [Install Dependencies](#install-dependencies)
  - [Database Server Configuration](#database-server-configuration)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [What We'll Cover](#what-well-cover)
  - [Document Structure](#document-structure)
  - [Code Organization](#code-organization)
- [Let's Review the Code](#lets-review-the-code)
  - [Integration Tests](#integration-tests)
  - [Repository](#repository)
  - [Model](#model)
  - [Controller](#controller)
  - [Service](#service)
- [Route Specifications](#route-specifications)
  - [GET Route](#get-route)
  - [POST Route](#post-route)
  - [PUT Route](#put-route)
  - [DELETE Route](#delete-route)
- [Route Workflow](#route-workflow)
  - [GET Route Workflow](#get-route-workflow)
  - [POST Route Workflow](#post-route-workflow)
  - [PUT Route Workflow](#put-route-workflow)
  - [DELETE Route Workflow](#delete-route-workflow)
- [Custom SQL++ Queries](#custom-sql-queries)
- [Running The Tests](#running-the-tests)
- [Project Setup Notes](#project-setup-notes)
- [Conclusion](#conclusion)

## Getting Started

### Prerequisites

To run this prebuild project, you will need:

- [Couchbase Capella](https://docs.couchbase.com/cloud/get-started/create-account.html) account or locally installed [Couchbase Server](/tutorial-couchbase-installation-options)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Code Editor or an Integrated Development Environment (e.g., [Eclipse](https://www.eclipse.org/ide/))
- [Java SDK v1.8 or higher installed](https://www.oracle.com/java/technologies/ee8-install-guide.html)
- [Gradle Build Tool](https://gradle.org/install/)

### Source Code

The sample source code used in this tutorial is [published on GitHub](https://github.com/couchbase-examples/java-springboot-quickstart).
To obtain it, clone the git repository with your IDE or execute the following command:

```shell
git clone https://github.com/couchbase-examples/java-springdata-quickstart
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

### Environment Variables

You need to configure the connection details to your Couchbase Server in the application.properties file located in the src/main/resources directory.s

```properties
spring.couchbase.bootstrap-hosts=DB_CONN_STR
spring.couchbase.bucket.user=DB_USERNAME
spring.couchbase.bucket.password=DB_PASSWORD
```

### Running the Application

To install dependencies and run the application on Linux, Unix or OS X, execute `./gradlew bootRun` (`./gradew.bat bootRun` on Windows).

Once the site is up and running, you can launch your browser and go to the [Swagger Start Page](http://localhost:8080/swagger-ui/) to test the APIs.

## What We'll Cover

A simple REST API using Spring Boot and the `Couchbase SDK version 3.x` with the following endpoints:

- Create new airlines with essential information.
- Update airline details.
- Delete airlines.
- Retrieve airlines by ID.
- List all airlines with pagination.
- List airlines by country.
- List airlines by destination airport.

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

## Let's Review the Code

To begin clone the repo and open it up in the IDE of your choice to learn about how to create, read, update and delete documents in your Couchbase Server.

### Integration Tests

`AirlineIntegrationTest.java`
This class contains integration tests for the REST API. It uses the `@SpringBootTest` annotation to load the application context and the `@AutoConfigureMockMvc` annotation to autowire the `MockMvc` object. The `MockMvc` object is used to perform HTTP requests to the REST API.

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

## Route Specifications

### GET Route

`@GetMapping("/{id}")`
This route is used to retrieve an airline by its unique identifier (ID).

- It expects the id of the airline as a path parameter.
- It calls the `getAirlineById` method of the `AirlineService` to retrieve the airline with the specified ID.
- If the airline is found, it returns a `ResponseEntity` with HTTP status `200 OK` and the airline data in the response body.
- If the airline is not found, it returns a `ResponseEntity` with HTTP status `404 Not Found`.
- If any other error occurs, it returns a `ResponseEntity` with HTTP status `500 Internal Server Error`.

### POST Route

`@PostMapping("/{id}")`
This route is used to create a new airline.

- It expects the id of the airline as a path parameter, but this ID is typically generated by the server.
- It receives the airline data in the request body, which should be a valid JSON representation of an airline.
- It calls the `createAirline` method of the `AirlineService` to create the new airline.
- If the airline is created successfully, it returns a `ResponseEntity` with HTTP status `201 Created` and the created airline data in the response body.
- If a conflict occurs (e.g., an airline with the same ID already exists), it returns a `ResponseEntity` with HTTP status `409 Conflict`.
- If any other error occurs, it returns a `ResponseEntity` with HTTP status `500 Internal Server Error`.

### PUT Route

`@PutMapping("/{id}")`
This route is used to update an existing airline by its ID.

- It expects the id of the airline as a path parameter.
- It receives the updated airline data in the request body.
- It calls the `updateAirline` method of the `AirlineService` to update the airline with the specified ID.
- If the airline is updated successfully, it returns a `ResponseEntity` with HTTP status `200 OK` and the updated airline data in the response body.
- If the airline with the specified ID is not found, it returns a `ResponseEntity` with HTTP status `404 Not Found`.
- If any other error occurs, it returns a `ResponseEntity` with HTTP status `500 Internal Server Error`.

### DELETE Route

`@DeleteMapping("/{id}")`
This route is used to delete an airline by its ID.

- It expects the id of the airline as a path parameter.
- It calls the `deleteAirline` method of the `AirlineService` to delete the airline with the specified ID.
- If the airline is deleted successfully, it returns a `ResponseEntity` with HTTP status `204 No Content` (indicating success with no response body).
- If the airline with the specified ID is not found, it returns a `ResponseEntity` with HTTP status `404 Not Found`.
- If any other error occurs, it returns a `ResponseEntity` with HTTP status `500 Internal Server Error`.


## Route Workflow


### GET Route Workflow
- The client initiates a GET request to `/api/v1/airline/{id}`, providing the unique identifier (`{id}`) of the airline they want to retrieve.
- The `AirlineController` receives the request and invokes the `getAirlineById(id)` method in the `AirlineService`.
- Inside the `AirlineService`, the request is processed. The service interacts with the `AirlineRepository`.
- The `AirlineRepository` executes a query against the Couchbase database to retrieve the airline information based on the provided ID.
- If the airline is found, the `AirlineService` returns the retrieved information to the `AirlineController`.
- The `AirlineController` sends an HTTP response with an HTTP status code of `200` (OK) and includes the airline information in the response body.
- If the airline is not found in the database, the `AirlineService` returns `null`.
- The `AirlineController` responds with an HTTP status code of `404` (Not Found) if the airline is not found.

### POST Route Workflow
- The client initiates a POST request to `/api/v1/airline/{id}` with a JSON payload containing the airline's information, including a unique ID.
- The `AirlineController` receives the request and invokes the `createAirline(airline)` method in the `AirlineService`.
- Inside the `AirlineService`, the incoming data is validated to ensure it meets the required criteria.
- The `AirlineService` creates a new `Airline` object and saves it to the Couchbase database using the `AirlineRepository`.
- If the airline is successfully created, the `AirlineService` returns the newly created airline object.
- The `AirlineController` sends an HTTP response with an HTTP status code of `201` (Created), including the newly created airline information in the response body.
- If the airline already exists in the database, a `DocumentExistsException` may be thrown.
- In case of a conflict, the `AirlineController` responds with an HTTP status code of `409` (Conflict).

### PUT Route Workflow
- The client initiates a PUT request to `/api/v1/airline/{id}` with a JSON payload containing the updated airline information and the unique ID of the airline to be updated.
- The `AirlineController` receives the request and invokes the `updateAirline(id, airline)` method in the `AirlineService`.
- Inside the `AirlineService`, the incoming data is validated to ensure it meets the required criteria.
- The `AirlineService` updates the airline record in the Couchbase database using the `AirlineRepository`.
- If the airline is found and updated successfully, the `AirlineService` returns the updated airline object.
- The `AirlineController` sends an HTTP response with an HTTP status code of `200` (OK), including the updated airline information in the response body.
- If the airline is not found in the database, the `AirlineService` returns `null`.
- In case of an update to a non-existent airline, the `AirlineController` responds with an HTTP status code of `404` (Not Found).

### DELETE Route Workflow
- The client initiates a DELETE request to `/api/v1/airline/{id}`, specifying the unique identifier (`{id}`) of the airline to be deleted.
- The `AirlineController` receives the request and invokes the `deleteAirline(id)` method in the `AirlineService`.
- Inside the `AirlineService`, the service attempts to find and delete the airline record from the Couchbase database using the `AirlineRepository`.
- If the airline is found and successfully deleted, the `AirlineService` completes the operation.
- The `AirlineController` responds with an HTTP status code of `204` (No Content) to indicate a successful deletion.
- If the airline is not found in the database, the `AirlineService` may throw a `DocumentNotFoundException`.
- In case the airline is not found, the `AirlineController` responds with an HTTP status code of `404` (Not Found).

These detailed workflows provide a comprehensive understanding of how each route is handled by the controller, service, and repository components in your Spring Data project.

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

## Running The Tests

To run the tests, execute `./gradlew test` (`./gradlew.bat test` on Windows).

## Project Setup Notes

This project was created using the [Spring Initializr](https://start.spring.io/) with the following options:

- Project: Gradle Project
- Language: Java
- Spring Boot: 2.7.18
- Packaging: Jar
- Java: 8
- Dependencies: Spring Web, Spring Data Couchbase, Springdoc OpenAPI UI

## Conclusion

Setting up a basic REST API in Spring Data with Couchbase is fairly simple. This project, when run with Couchbase Server 7 installed creates a collection in Couchbase, an index for our parameterized [N1QL query](https://docs.couchbase.com/java-sdk/current/howtos/n1ql-queries-with-sdk.html), and showcases basic CRUD operations needed in most applications.
