---
# frontmatter
path: "/tutorial-quickstart-java-springboot"
# title and description do not need to be added to markdown, start with H2 (##)
title: Start with Java and Spring Boot
short_title: Java and Spring Boot
description:
  - Learn how to configure Spring Data with Couchbase
  - Explore key-based operations and SQL++ querying using Spring Data Couchbase repositories
  - Build a simple REST APIs that stores user profiles on a Couchbase cluster
content_type: quickstart
filter: sdk
technology:
  - kv
  - query
tags:
  - REST API
  - Spring Boot
  - Spring Data
sdk_language:
  - java
length: 30 Mins
---

<!--
  The name of this file does not need to be `tutorial-quickstart-java-springboot` because it is in the `tutorials/java/markdown` directory, so we can just call it `spring-boot`. The idea is that we can leave off `tutorial-quickstart` as a prefix.
-->

<!-- TODO:  Figure out how to add width to image size in try it now links -->

[![Try it now!](https://da-demo-images.s3.amazonaws.com/runItNow_outline.png?couchbase-example=java-springboot-quickstart-repo&source=github)](https://gitpod.io/#https://github.com/couchbase-examples/java-springboot-quickstart)

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Source Code](#source-code)
  - [Install Dependencies](#install-dependencies)
  - [Database Server Configuration](#database-server-configuration)
  - [Environment Variables](#environment-variables)
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

To run this prebuilt project, you will need:

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance (at least Couchbase Server 7)
- Java SDK v1.8 or higher installed
- Code Editor installed (IntelliJ IDEA, Eclipse, or Visual Studio Code)
- Maven command line

### Source Code

```shell
git clone https://github.com/couchbase-examples/java-springboot-quickstart
```

### Install Dependencies

```shell
mvn package
```

> Note: Maven packages auto restore when building the project in IntelliJ IDEA or Eclipse depending on IDE configuration.

### Database Server Configuration

the `CouchbaseConfig` class is a Spring configuration class responsible for setting up the connection to a Couchbase database in a Spring Boot application. It defines two beans:

`getCouchbaseCluster()`: This bean creates and configures a connection to the Couchbase cluster using the provided hostname, username, and password.

`getCouchbaseBucket(Cluster cluster)`: This bean creates a Couchbase bucket within the cluster if it doesn't already exist and returns the Bucket object associated with the specified bucket name.

Additionally, the class includes optional code for enabling `TLS (Transport Layer Security)` to secure communication between the application and the Couchbase server if required.

### Environment Variables

You need to configure the connection details to your Couchbase Server in the application.properties file located in the src/main/resources directory.

```properties
spring.couchbase.bootstrap-hosts=DB_CONN_STR
spring.couchbase.bucket.user=DB_USERNAME
spring.couchbase.bucket.password=DB_PASSWORD
```

## Running The Application

At this point the application is ready, and you can run it via your IDE or from the terminal:

```shell
mvn spring-boot:run -e -X
```

> Note: Couchbase Server 7 must be installed and running on localhost (http://127.0.0.1:8091) prior to running the Spring Boot app.

Once the site is up and running you can launch your browser and go to the Swagger Start Page]: `http://localhost:8080/swagger-ui/` to test the APIs.

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
- `src/main/java/org/couchbase/quickstart/springboot/repositories`: Contains the repository implementation.
- `src/main/java/org/couchbase/quickstart/springboot/models`: Contains the data model.
- `src/main/java/org/couchbase/quickstart/springboot/controllers`: Contains the RESTful API controllers.
- `src/main/java/org/couchbase/quickstart/springboot/services`: Contains the service classes.

## Let's Review the Code

To begin clone the repo and open it up in the IDE of your choice to learn about how to create, read, update and delete documents in your Couchbase Server.

### Integration Tests

`AirlineIntegrationTest.java`
This class contains integration tests for the application. It tests various functionalities like getting, creating, updating, and deleting airlines, as well as listing airlines by country and destination airport.

### Repository

`AirlineRepositoryImpl.java`
This class implements the AirlineRepository interface. It interacts with the Couchbase database to perform CRUD operations on airline documents. It uses the Couchbase Java SDK to execute queries and operations.

### Model

`Airline.java`
This class represents the data model for an airline. It contains fields such as ID, type, name, IATA code, ICAO code, callsign, and country. The class uses annotations for validation.

### Controller

`AirlineController.java`
This class defines the RESTful API endpoints for managing airlines. It handles HTTP requests for creating, updating, deleting, and retrieving airlines. It also provides endpoints for listing airlines by various criteria.

### Service

`AirlineServiceImpl.java`
This class implements the AirlineService interface. It acts as an intermediary between the controller and repository, providing business logic for managing airlines.

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

These routes together provide the basic CRUD (Create, Read, Update, Delete) operations for managing airlines via the RESTful API. The `AirlineService` contains the business logic for these operations, and the `AirlineRepository` interacts with the database to perform the actual data operations.

## Route Workflow

### GET Route Workflow

`@GetMapping("/{id}")`

The GET route is triggered when a client sends an HTTP GET request to `/api/v1/airline/{id}` where `{id}` is the unique identifier of the airline.

1. The `AirlineController` receives the request and extracts the `id` from the URL path.
2. It then calls the `getAirlineById` method of the `AirlineService`, passing the extracted `id` as a parameter.
3. The `AirlineService` interacts with the database through the `AirlineRepository` to find the airline with the specified `id`.
4. If the airline is found, the `AirlineService` returns it as a response.
5. The `AirlineController` constructs an HTTP response with a status code of 200 OK and includes the airline data in the response body as a JSON object.
6. The response is sent back to the client with the airline data if found, or a 404 Not Found response if the airline does not exist.

### POST Route Workflow

`@PostMapping("/{id}")`

The POST route is triggered when a client sends an HTTP POST request to `/api/v1/airline/{id}`, where `{id}` is typically a unique identifier generated by the server (not provided by the client).

1. The client includes the data of the new airline to be created in the request body as a JSON object.
2. The `AirlineController` receives the request and extracts the `id` from the URL path, but this `id` is not used for creating the airline; it's often generated by the server.
3. The `AirlineController` calls the `createAirline` method of the `AirlineService`, passing the airline data from the request body.
4. The `AirlineService` is responsible for creating a new airline and saving it to the database using the `AirlineRepository`.
5. If the airline is created successfully, the `AirlineService` returns the newly created airline.
6. The `AirlineController` constructs an HTTP response with a status code of 201 Created and includes the created airline data in the response body as a JSON object.
7. The response is sent back to the client with the newly created airline data.

### PUT Route Workflow

`@PutMapping("/{id}")`

The PUT route is triggered when a client sends an HTTP PUT request to `/api/v1/airline/{id}`, where `{id}` is the unique identifier of the airline to be updated.

1. The client includes the updated data of the airline in the request body as a JSON object.
2. The `AirlineController` receives the request, extracts the `id` from the URL path, and retrieves the updated airline data from the request body.
3. The `AirlineController` calls the `updateAirline` method of the `AirlineService`, passing the `id` and updated airline data.
4. The `AirlineService` is responsible for updating the airline in the database using the `AirlineRepository`.
5. If the airline is updated successfully, the `AirlineService` returns the updated airline.
6. The `AirlineController` constructs an HTTP response with a status code of 200 OK and includes the updated airline data in the response body as a JSON object.
7. The response is sent back to the client with the updated airline data if found, or a 404 Not Found response if the airline with the specified ID does not exist.

### DELETE Route Workflow

`@DeleteMapping("/{id}")`

The DELETE route is triggered when a client sends an HTTP DELETE request to `/api/v1/airline/{id}`, where `{id}` is the unique identifier of the airline to be deleted.

1. The `AirlineController` receives the request and extracts the `id` from the URL path.
2. The `AirlineController` calls the `deleteAirline` method of the `AirlineService`, passing the `id` of the airline to be deleted.
3. The `AirlineService` is responsible for deleting the airline from the database using the `AirlineRepository`.
4. If the airline is deleted successfully, the `AirlineService` performs the deletion operation without returning any response data.
5. The `AirlineController` constructs an HTTP response with a status code of 204 No Content, indicating that the request was successful, but there is no content to return in the response body.
6. The response is sent back to the client to indicate the successful deletion of the airline.

These workflows illustrate how each HTTP method interacts with the `AirlineService` and the underlying database through the `AirlineRepository` to perform various operations on airline data.

## Custom SQL++ Queries

1. Get all airlines by country

```java

    @Override
    public List<Airline> findByCountry(String country, int limit, int offset) {
      String statement = "SELECT airline.id, airline.type, airline.name, airline.iata, airline.icao, airline.callsign, airline.country FROM `"
                + dbProperties.getBucketName() + "`.`inventory`.`airline` WHERE country = '" + country + "' LIMIT "
                + limit + " OFFSET " + offset;
        return cluster
                .query(statement, QueryOptions.queryOptions().scanConsistency(QueryScanConsistency.REQUEST_PLUS)
                        .parameters(JsonObject.create().put("country", country)))
                .rowsAs(Airline.class);

    }
```

<!-- Explaination -->

In the above example, we are using the `QueryOptions` class to set the `scanConsistency` to `REQUEST_PLUS` to ensure that the query returns the latest data. We are also using the `JsonObject` class to set the `country` parameter in the query.

Finally, we are using the `rowsAs` method to return the query results as a list of `Airline` objects.

In the query, we are using the `country` parameter to filter the results by country. We are also using the `limit` and `offset` parameters to limit the number of results returned and to implement pagination.

Once the query is executed, the `AirlineController` constructs an HTTP response with a status code of 200 OK and includes the list of airlines in the response body as a list of JSON objects.

2. Get all airlines by destination airport

```java
    @Override
    public List<Airline> findByDestinationAirport(String destinationAirport, int limit, int offset) {
        String statement = "SELECT air.callsign, air.country, air.iata, air.icao, air.id, air.name, air.type " +
                "FROM (SELECT DISTINCT META(airline).id AS airlineId " +
                "      FROM `" + dbProperties.getBucketName() + "`.`inventory`.`route` " +
                "      JOIN `" + dbProperties.getBucketName() + "`.`inventory`.`airline` " +
                "      ON route.airlineid = META(airline).id " +
                "      WHERE route.destinationairport = $1) AS subquery " +
                "JOIN `" + dbProperties.getBucketName() + "`.`inventory`.`airline` AS air " +
                "ON META(air).id = subquery.airlineId LIMIT " + limit + " OFFSET " + offset;

        return cluster.query(
                statement,
                QueryOptions.queryOptions().parameters(JsonArray.from(destinationAirport))
                        .scanConsistency(QueryScanConsistency.REQUEST_PLUS))
                .rowsAs(Airline.class);
    }
```

<!-- Explaination -->

In the above example, we are using the `QueryOptions` class to set the `scanConsistency` to `REQUEST_PLUS` to ensure that the query returns the latest data. We are also using the `JsonArray` class to set the `destinationAirport` parameter in the query.

Finally, we are using the `rowsAs` method to return the query results as a list of `Airline` objects.

In the query, we are using the `destinationAirport` parameter to filter the results by destination airport. We are also using the `limit` and `offset` parameters to limit the number of results returned and to implement pagination.

We are performing a `JOIN` operation between the `route` and `airline` documents to get the airlines that fly to the specified destination airport. We are using the `META` function to get the ID of the airline document.

Once the query is executed, the `AirlineController` constructs an HTTP response with a status code of 200 OK and includes the list of airlines in the response body as a list of JSON objects.

## Running The Tests

To run the standard integration tests, use the following commands:

```shell
mvn test
```

## Project Setup Notes

This project was based on the standard [Spring Boot project](https://spring.io/guides/gs/rest-service/). The HealthCheckController is provided as a santity check and is used in unit tests.

A full list of packages are referenced in the pom.xml file.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please fork the repository and create a pull request.

## Conclusion

Congratulations! You have successfully created a REST API using Spring Boot and the Couchbase SDK. You have also learned how to configure Spring Boot with Couchbase.
