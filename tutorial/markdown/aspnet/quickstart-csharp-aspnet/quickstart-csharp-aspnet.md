---
# frontmatter
path: "/tutorial-quickstart-csharp-aspnet"
title: Quickstart in Couchbase with C# and ASP.NET 
short_title: ASP.NET and C# Start
description:
  - Learn to build a REST API with Couchbase's C# SDK 3.4 and ASP.NET
  - See how you can fetch data from Couchbase using SQL++ queries
  - Explore CRUD operations in action with Couchbase
content_type: quickstart
filter: sdk
technology:
  - kv
  - index
  - query
tags:
  - REST API
  - ASP.NET
sdk_language:
  - csharp
length: 30 Mins
---

<!-- [abstract] -->

In this tutorial, you will learn how to connect to a Couchbase Capella cluster to create, read, update, and delete documents and how to write simple parametrized SQL++ queries.

## Prerequisites
To run this prebuilt project, you will need:

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded.
    - To run this tutorial using a self managed Couchbase cluster, please refer to the [appendix](#running-self-managed-couchbase-cluster).
- [.NET SDK v6+](https://dotnet.microsoft.com/en-us/download/dotnet) installed.
    - Ensure that the .Net version is [compatible](https://docs.couchbase.com/dotnet-sdk/current/project-docs/compatibility.html#dotnet-compatibility) with the Couchbase SDK.
- Code Editor installed (Visual Studio Professional, Visual Studio Code, or JetBrains Rider)
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
git clone https://github.com/couchbase-examples/aspnet-quickstart.git
```

### Install Dependencies

```sh
cd src/Org.Quickstart.API
dotnet restore
```

#### Dependency Injection Nuget package

The Couchbase SDK for .NET includes a nuget package called `Couchbase.Extensions.DependencyInjection` which is designed for environments like ASP.NET that takes in a configuration to connect to Couchbase and automatically registers interfaces that you can use in your code to perform full `CRUD (create, read, update, delete)` operations and queries against the database.

### Setup Database Configuration

To know more about connecting to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

All configuration for communication with the database is stored in the [appsettings.Development.json](https://github.com/couchbase-examples/aspnet-quickstart/blob/main/src/Org.Quickstart.API/appsettings.Development.json) file.  This includes the connection string, username, password, bucket name and scope name.  The default username is assumed to be `Administrator` and the default password is assumed to be `P@$$w0rd12`.  If these are different in your environment you will need to change them before running the application.

```json
  "Couchbase": {
    "BucketName": "travel-sample",
    "ScopeName": "inventory",
    "ConnectionString": "couchbases://yourassignedhostname.cloud.couchbase.com",
    "Username": "Administrator",
    "Password": "P@ssw0rd12",
    "IgnoreRemoteCertificateNameMismatch": true,
    "HttpIgnoreRemoteCertificateMismatch": true,
    "KvIgnoreRemoteCertificateNameMismatch": true
  }

```

> Note: The connection string expects the `couchbases://` or `couchbase://` part.

## Running The Application

### Directly on Machine

At this point, we have installed the dependencies, loaded the travel-sample data and configured the application with the credentials. The application is now ready and you can run it.

```shell 
cd src/Org.Quickstart.API
dotnet run
```

### Using Docker

- Build the Docker image
```shell 
cd aspnet-quickstart
docker build -t couchbase-aspnet-quickstart . 
```

- Run the docker image
```shell 
cd aspnet-quickstart
docker run -d -p 8080:8080 --name couchbase-dotnet-container couchbase-aspnet-quickstart
```

You can access the Application on http://localhost:8080/index.html

>**Note:** Make the configuration changes inside `appsettings.json` file while running using docker.

### Verifying the Application

Once the application starts, you can see the details of the application on the logs.

![Application Startup](app_startup.png)

The application will run on port 8080 of your local machine (http://localhost:8080/index.html). You will find the Swagger documentation of the API if you go to the URL in your browser.
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
│   ├── Org.Quickstart.API
│   │   ├── Controllers
│   │   │   ├── AirlineController.cs
│   │   │   ├── AirportController.cs
│   │   │   └── RouteController.cs
│   │   ├── Models
│   │   │   ├── Airline.cs
│   │   │   ├── Airport.cs
│   │   │   └── Route.cs
│   │   ├── Properties
│   │   │   └── launchSettings.json
│   │   ├── Services
│   │   │   └── InventoryScopeService.cs
│   │   ├── Couchbase.TravelSample.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.Development.json
│   │   └── appsettings.json  
│   └── Org.Quickstart.IntegrationTests
│       ├── ControllerTests
│       │   ├── AirlineTests.cs
│       │   ├── AirportTests.cs
│       │   └── RouteTests.cs  
│       └── Org.Quickstart.IntegrationTests.csproj
├── Org.Quickstart.sln
└── Dockerfile
```

`Org.Quickstart.API.Program:`


In order to use the `Couchbase.Extensions.DependencyInjection` framework, we must first register the service.  The Couchbase Services requires the database configuration information, which can be provided by reading the database configuration from the `appsettings.json` file.

```csharp
 builder.Services.Configure<CouchbaseConfig>(config);
 builder.Services.AddCouchbase(config);
```

The services are added to the DI container. CORS policy is defined to allow specific origins. HttpClient, Controllers, Endpoints API Explorer, and Swagger are also added here. The Swagger setup includes a detailed description of the API.

```csharp
builder.Services.AddCors(options =>
{
    // ...
});

builder.Services.AddHttpClient();
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // ...
});

```

The InventoryScopeService is registered as a singleton service in the DI container.

```csharp
builder.Services.AddSingleton<IInventoryScopeService, InventoryScopeService>();
```

ASP.NET has an interface called `IHostApplicationLifetime` that you can add to your Configure method to help with registration of lifetime events. The Couchbase SDK provides the `ICouchbaseLifetimeService` interface for handling closing the database connections when the application closes.
It's best practice to register for the ASP.NET `ApplicationStop` lifetime event and call the `ICouchbaseLifetimeService` Close method so that the database connection and resources are closed and removed gracefully.
The program logs the Swagger UI address when the application starts. 

```csharp
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();

lifetime.ApplicationStarted.Register(() =>
{
    // ...
});

app.Lifetime.ApplicationStopped.Register(() =>
{
    var cls = app.Services.GetRequiredService<ICouchbaseLifetimeService>();
    cls.Close();
});

```

The program sets up the middleware pipeline for the application. This includes Swagger, CORS, HTTPS redirection, routing, authorization, and endpoint mapping.

```csharp
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Couchbase Quickstart API v1"); 
    c.RoutePrefix = string.Empty;
});

if (app.Environment.EnvironmentName == "Testing")
{
    app.UseCors("_devAllowSpecificOrigins");
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});
```
The Couchbase .NET SDK will handle all communications to the database cluster, so you shouldn't need to worry about creating a pool of connections.

This `InventoryScopeService` class is a service that provides a convenient way to fetch a specific scope from a specific bucket, handling all the necessary validation and error checking. 

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

## POST Airport

Open the `AirportController.cs` file  and navigate to the `Post` method.

It takes an `id` and a `request` as parameters, where `id` is the unique identifier for the airport and `request` contains the data for the new airport. The method extracts the `airport` object from the `request` and attempts to insert it into the collection using the `InsertAsync` method of the Couchbase SDK. If the insertion is successful, it returns a `Created` result. However, if a document with the same id already exists in the collection, the method catches a `DocumentExistsException` and returns a `Conflict` result. For any other exceptions, it logs the error message and returns an `InternalServerError` result. 

```csharp
public async Task<IActionResult> Post(string id, AirportCreateRequestCommand request)
{
    try
    {
        var collection = await _inventoryScope.CollectionAsync(CollectionName);
        var airport = request.GetAirport();
        await collection.InsertAsync(id, airport);
        return Created($"/api/v1/airport/{id}", airport);
    }
    catch (DocumentExistsException)
    {
        return Conflict($"A document with the ID '{id}' already exists.");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex.Message);
        return StatusCode(StatusCodes.Status500InternalServerError, $"Error: {ex.Message} {ex.StackTrace} {Request.GetDisplayUrl()}");
    }
}

```

## GET Airport

Open the `AirportController.cs` file  and navigate to the `GetById` method.

This method retrieves an airport document from a collection using its `id`. It uses the `GetAsync` method of the Couchbase SDK to fetch the document. If the document exists, it returns the document; otherwise, it returns a `NotFound` result. Any other exceptions are caught, logged, and an `InternalServerError` result is returned.

```csharp
public async Task<IActionResult> GetById(string id)
{
    try
    {
        var collection = await _inventoryScope.CollectionAsync(CollectionName);
        var result = await collection.GetAsync(id);
        var resultAirport = result.ContentAs<Airport>();
        if (resultAirport != null)
        {
            return Ok(resultAirport);
        }
    }
    catch (DocumentNotFoundException)
    {
        return NotFound();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex.Message);
        return StatusCode(StatusCodes.Status500InternalServerError, $"Error: {ex.Message} {ex.StackTrace} {Request.GetDisplayUrl()}");
    }
    return NotFound();
}
```

## PUT Airport

Open the `AirportController.cs` file  and navigate to the `Update` method.

This method is used to update an existing airport document in the collection. It uses the `GetAsync` and `ReplaceAsync` methods from the Couchbase SDK. If the document with the specified `id` exists, it replaces the document with the new data from the `request`. If the document does not exist, it returns a `NotFound` result. Any other exceptions are caught, logged, and an `InternalServerError` result is returned.

```csharp
public async Task<IActionResult> Update(string id, AirportCreateRequestCommand request)
{
    try
    {
        var collection = await _inventoryScope.CollectionAsync(CollectionName);
        if (await collection.GetAsync(id) is { } result)
        {
            result.ContentAs<Airport>();
            await collection.ReplaceAsync(id, request.GetAirport());
            return Ok(request);
        }
        else
        {
            return NotFound();
        }
    }
    catch (DocumentNotFoundException)
    {
        return NotFound();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex.Message);
        return StatusCode(StatusCodes.Status500InternalServerError, $"Error: {ex.Message} {ex.StackTrace} {Request.GetDisplayUrl()}");
    }
    return NotFound();
}
```

## DELETE Airport

Open the `AirportController.cs` file  and navigate to the `Delete` method.

This method used to delete an existing airport document from a Couchbase collection. It uses the `GetAsync` and `RemoveAsync` methods from the Couchbase SDK. If the document with the specified `id` exists, it removes the document from the collection. If the document does not exist, it returns a `NotFound` result. Any other exceptions are caught, logged, and an `InternalServerError` result is returned.

```csharp
public async Task<IActionResult> Delete(string id)
{
    try
    {
        var collection = await _inventoryScope.CollectionAsync(CollectionName);
        var result = await collection.GetAsync(id);
        var resultAirport = result.ContentAs<Airport>();
        if (resultAirport != null)
        {
            await collection.RemoveAsync(id);
            return Ok(id);
        }
        else
        {
            return NotFound();
        }
    }
    catch (DocumentNotFoundException)
    {
        return NotFound();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex.Message);
        return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
    }
    return NotFound();
}

```
### List Airport

This endpoint retrieves the list of airports in the database. The API has options to specify the page size for the results and country from which to fetch the airport documents.

[SQL++](https://docs.couchbase.com/dotnet-sdk/current/howtos/n1ql-queries-with-sdk.html) is a powerful query language based on SQL, but designed for structured and flexible JSON documents. We will use a SQL+ query to search for airports with Limit, Offset, and Country option.

Open the `AirportController.cs` file  and navigate to the `Delete` method. This endpoint is different from the others we have seen before because it makes the SQL++ query rather than a key-value operation. This usually means more overhead because the query engine is involved. For this query, we are using the predefined indices in the `travel-sample` bucket. We can create an additional [index](https://docs.couchbase.com/server/current/learn/services-and-indexes/indexes/indexing-and-query-perf.html) specific for this query to make it perform better.

We need to get the values from the query string for country, limit, and Offset that we will use in our query. These are pulled from the `queryParameters.Parameter` method.

This end point has two queries depending on the value for the country parameter. If a country name is specified, we retrieve the airport documents for that specific country. If it is not specified, we retrieve the list of airports across all countries. The queries are slightly different for these two scenarios.

We build our SQL++ query using the [parameters](https://docs.couchbase.com/dotnet-sdk/current/howtos/n1ql-queries-with-sdk.html#parameterized-queries) specified by `$` symbol for both these scenarios. The difference between the two queries is the presence of the `country` parameter in the query. Normally for the queries with pagination, it is advised to order the results to maintain the order of results across multiple queries.

Next, we pass that `query` to the `QueryAsync` method. We save the results in a list, `items`.

This endpoint calls the `QueryAsync` method defined in the [Scope](https://docs.couchbase.com/dotnet-sdk/current/howtos/n1ql-queries-with-sdk.html#querying-at-scope-level) by the Couchbase SDK.

```csharp
           
           var queryParameters = new Couchbase.Query.QueryOptions();
		   queryParameters.Parameter("limit", limit ?? 10);
		   queryParameters.Parameter("offset", offset ?? 0);

		   string query;
		   if (!string.IsNullOrEmpty(country))
		   {
			   query = $@"SELECT airport.airportname,
                          airport.city,
                          airport.country,
                          airport.faa,
                          airport.geo,
                          airport.icao,
                          airport.tz
                        FROM airport AS airport
                        WHERE lower(airport.country) = $country
                        ORDER BY airport.airportname
                        LIMIT $limit
                        OFFSET $offset";
                    
			   queryParameters.Parameter("country", country.ToLower());
		   }
		   else
		   {
			   query = $@"SELECT airport.airportname,
                              airport.city,
                              airport.country,
                              airport.faa,
                              airport.geo,
                              airport.icao,
                              airport.tz
                            FROM airport AS airport
                            ORDER BY airport.airportname
                            LIMIT $limit
                            OFFSET $offset";
		   }

		   var results = await _inventoryScope.QueryAsync<Airport>(query, queryParameters);
		   var items = await results.Rows.ToListAsync();

		   return items.Count == 0 ? NotFound() : Ok(items);
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

We have defined unit tests using the [xunit](https://xunit.net/) nuget package for all the API end points. The unit tests use the same database configuration as the application. For the unit tests, we perform the operation using the API and confirm the results by checking the documents in the database. For example, to check the creation of the document by the API, we would call the API to create the document and then read the same document from the database and compare them. After the tests, the documents are cleaned up by calling the DELETE endpoint

To run the standard integration tests, use the following commands:

```sh
cd ../Org.Quickstart.IntegrationTests/
dotnet restore 
dotnet build
dotnet test
```

## Appendix

### Extending API by Adding New Entity

If you would like to add another entity to the APIs, these are the steps to follow:

- Create the new entity (collection) in the Couchbase bucket. You can create the collection using the [SDK](https://docs.couchbase.com/sdk-api/couchbase-net-client/api/Couchbase.Management.Collections.ICouchbaseCollectionManager.html#Couchbase_Management_Collections_ICouchbaseCollectionManager_CreateCollectionAsync_Couchbase_Management_Collections_CollectionSpec_Couchbase_Management_Collections_CreateCollectionOptions_) or via the [Couchbase Server interface](https://docs.couchbase.com/cloud/n1ql/n1ql-language-reference/createcollection.html).
- Define the routes inside a new file in the `Controllers` folder similar to the existing ones like `AirportController.cs`.
- Add the tests for the new routes in a new file in the `ControllerTests` folder similar to `AirportTests.cs`.

### Running Self Managed Couchbase Cluster

If you are running this quickstart with a self managed Couchbase cluster, you need to [load](https://docs.couchbase.com/server/current/manage/manage-settings/install-sample-buckets.html) the travel-sample data bucket in your cluster and generate the credentials for the bucket.

You need to update the connection string and the credentials in the [appsettings.Development.json](https://github.com/couchbase-examples/aspnet-minapi-quickstart-travelsample/blob/main/src/Couchbase.TravelSample/appsettings.Development.json) file in the source folder.

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

