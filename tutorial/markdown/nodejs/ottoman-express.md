---
# frontmatter
path: "/tutorial-quickstart-ottomanjs"
# title and description do not need to be added to markdown, start with H2 (##)
title: Using Ottoman.js and Express
short_title: Ottoman.js and Express
description: 
  - Build a REST API with Couchbase's proprietary Ottoman.js ODM
  - See how you can fetch data from Couchbase using SQL++ queries
  - Explore CRUD operations in action with Couchbase
content_type: quickstart
filter: sdk
technology:
  - connectors
tags:
  - Ottoman
  - Express
  - REST API
sdk_language:
  - nodejs
length: 30 Mins
---


In this article, you will learn how to connect to a Couchbase cluster using [Ottoman JS](https://ottomanjs.com/) instead of the NodeJS SDK to create, read, update, and delete documents, and write simple parametrized SQL++ queries.


## Prerequisites

To run this prebuilt project, you will need:

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [travel-sample](https://docs.couchbase.com/nodejs-sdk/current/ref/travel-app-data-model.html) bucket loaded.
  - To run this tutorial using a self managed Couchbase cluster, please refer to the [appendix](#running-self-managed-couchbase-cluster).
- NodeJS & NPM 
- Loading Travel Sample Bucket
  If travel-sample is not loaded in your Capella cluster, you can load it by following the instructions for your Capella Cluster:

  - [Load travel-sample bucket in Couchbase Capella](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html#import-sample-data)

> Note that this tutorial is designed to work with the latest Ottoman version (2) for Couchbase. It will not work with the older Ottoman versions  for Couchbase without adapting the code.

### Couchbase Capella Configuration

When running Couchbase using [Capella](https://cloud.couchbase.com/), the following prerequisites need to be met.

- The application requires the travel-sample bucket to be [loaded](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html#import-sample-data) in the cluster from the Capella UI.
- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.
## App Setup
### Cloning Repo

```shell
git clone https://github.com/couchbase-examples/ottomanjs-quickstart
```

### Install Dependencies

Any dependencies will be installed by running the npm install command from the root directory of the project.

```shell
npm install
```
### Setup Database Configuration

To know more about connecting to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

All configuration for communication with the database is read from the environment variables. We have provided a convenience feature in this quickstart to read the environment variables from a local file, `dev.env` in the `config` folder.

Add the values for the Couchbase connection in the config/dev.env file.


```sh
CONNECTION_STRING=<connection_string>
USERNAME=<user_with_read_write_permission_to_travel-sample_bucket>
PASSWORD=<password_for_user>
```
> Note: The connection string expects the `couchbases://` or `couchbase://` part.
## Running the Application

### Directly on Local Machine

At this point, we have installed the dependencies, loaded the travel-sample data and configured the application with the credentials. The application is now ready and you can run it.

The application will run on port 3000 of your local machine (http://localhost:3000). You will find the Swagger documentation of the API which you can use to try the API endpoints.

```sh
# Execute this command in the project's root directory
npm start
```
### Docker

If you prefer to run this quick start using Docker, we have provided the Dockerfile which you can use to build the image and run the API as a container.

- Build the Docker image

```sh
cd src
docker build -t couchbase-ottoman-quickstart .
```

- Run the Docker image

```sh
docker run -it --env-file config/dev.env -p 3000:3000 couchbase-ottoman-quickstart
```

> Note: The `config/dev.env` file has the connection information to connect to your Capella cluster. With the `--env-file`, docker will inject those environment variables to the container.

Once the app is up and running, you can launch your browser and go to the [Swagger documentation](https://localhost:3000/) to test the APIs.

### Verifying the Application

Once the application starts, you can see the details of the application on the logs.

![Application Startup](ottoman_app_startup.png)

The application will run on port 3000 of your local machine (http://localhost:3000). You will find the interactive Swagger documentation of the API if you go to the URL in your browser. Swagger documentation is used in this demo to showcase the different API end points and how they can be invoked. More details on the Swagger documentation can be found in the [appendix](#swagger-documentation).

![Swagger Documentation](ottoman_swagger_documentation.png)

## Data Model

For this tutorial, we use three collections, `airport`, `airline` and `route` that contain sample airports, airlines and airline routes respectively. The route collection connects the airports and airlines as seen in the figure below. We use these connections in the quickstart to generate airports that are directly connected and airlines connecting to a destination airport. Note that these are just examples to highlight how you can use SQL++ queries to join the collections.
![img](travel_sample_data_model.png)

## Let Us Review the Code

To begin this tutorial, clone the repo and open it up in the IDE of your choice. Now you can learn about how to create, read, update and delete documents in Couchbase Server.

### Code Layout

```
├── src/controllers
│   ├── airlineController.js
│   ├── airportController.js
│   └── routeController.js
├── db
│   ├── ottomanConnection.js
├── src/routes
│   ├── airline.js
│   ├── airport.js
│   ├── route.js
├── src/shared
│   ├── makeResponse.js
├── src/app.js
├── src/server.js
├── Dockerfile
└── __test__


```

We have separated out the  code into separate files by the entity (collection) in the `controllers` folder. The tests for the  project are present in the `__test__` folder.

### Airport Entity

For this tutorial, we will focus on the airport entity. The other entities are similar.

We will be setting up a REST API to manage airport documents.

- [POST Airport](#post-airport) – Create a new airport
- [GET Airport](#get-airport) – Read specified airport
- [PUT Airport](#put-airport) – Update specified airport
- [DELETE Airport](#delete-airport) – Delete airport
- [Airport List](#list-airport) – Get all airports. Optionally filter the list by country
- [Direct Connections](#direct-connections) - Get a list of airports directly connected to the specified airport

For CRUD operations, we will use the [Ottoman JS](https://ottomanjs.com), an object-document mapping built on top of the [Couchbase NodeJS SDK v3.x](https://docs.couchbase.com/nodejs-sdk/current/hello-world/start-using-sdk.html) to create, read, update, and delete a document. Every document will need an ID (similar to a primary key in other databases) to save it to the database. For other end points, we will use [Ottoman Query API](https://ottomanjs.com/docs/quick-start#write-a-query-with-ottomans-query-api) to query for documents.

## Document Structure

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


## Creating an Ottoman Schema and Model for our Airport documents

To work with documents in Ottoman we must first set up our `Schema` and `model`, let's take a look at the `/models/airportModel.js` before moving onto the `App.js` and related code:

```js
import { model, Schema } from 'ottoman'

// Geo sub-schema
const GeoSchema = new Schema({
  alt: { type: Number },
  lat: { type: Number },
  lon: { type: Number },
});

const AirportSchema = new Schema({
  airportName: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  faa: { type: String, required: true },
  geo: GeoSchema,
  icao: { type: String, required: false },
  tz: { type: String, required: false },
});
```

And finally we define our `model` using this `Schema` where we  specify `collectionName` and [`keyGeneratorDelimiter`](https://ottomanjs.com/docs/advanced/how-ottoman-works#keygenerator-function) as we do not plan on using the default which is `::` on travel-sample bucket :

```js
const AirportModel = model("airport", AirportSchema, {
  modelKey: "type",
  collectionName: "airport",
  keyGeneratorDelimiter: "_",
});

module.exports = {
  AirportModel,
};
```


Let's go over the `server.js` and the `App.js` files located in the `/src` directory. Let's open the `server.js` file first to see how it kicks off the application server and then the `App.js` file to learn about how we create, read, update and delete documents in our database.

**`src/server.js`:**

The `server.js` file bootstraps our application, it imports some definitions from our `app.js` file, and connects to our server through [`ottoman.connect()`](https://ottomanjs.com/docs/api/modules#connect). The call to [`ottoman.start()`](https://ottomanjs.com/docs/api/modules#start) method is just a shortcut to run `ensureCollections` and `ensureIndexes` (Ottoman's methods ensuring collections and indexes exist or get created by Ottoman).

Next, we start up the express application by listening to our desired port.

```js
import { app, ottoman } from './app.js'

const startApiServer = async() => {
  try {
    await ottoman.connect({
      bucketName: process.env.CB_BUCKET,
      connectionString: process.env.CB_URL,
      username: process.env.CB_USER,
      password: process.env.CB_PASS,
    })
    // By default start function will wait for indexes, but you can disable it setting ignoreWatchIndexes to true. 
    // It's not required to execute the start method in order for Ottoman work.
    await ottoman.start()
    
    const port = process.env.APP_PORT
    app.listen(port, () => {
      console.log(`API started at http://localhost:${port}`)
      console.log(`API docs at http://localhost:${port}/api-docs/`)
    })
  } catch (e) {
    console.log(e)
  }
}

startApiServer()
```

**`src/app.js`:**

We import our dependencies and database connection:

```js
import express from "express";
import cors from "cors";
import { ottoman, Query } from "../db/ottomanConnection";
import airlineRoutes from "./routes/airline";
import airportRoutes from "./routes/airport";
import route from "./routes/route";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
```

<hr class="mb-3"/>  

One of our import statements in this file pulls in: [`/db/ottomanConnection.js`](https://github.com/couchbase-examples/ottomans-quickstart/blob/master/db/ottomanConnection.js). This gives us access to some of the Ottoman resources we need for our endpoints to persist data to Couchbase.

```js
import { Ottoman, getOttomanInstances, getDefaultInstance, ValidationError, FindOptions, SearchConsistency,Query } from 'ottoman'

const ottoman = new Ottoman({
  modelKey: 'type',
  scopeName: 'inventory'
})

module.exports = { ottoman, getOttomanInstances, getDefaultInstance, ValidationError, FindOptions, SearchConsistency,Query }
```

In the `ottomanConnection.js` file in the `db` folder, we forward the assets from Ottoman that we will use in `App.js`.

<hr class="mb-3"/>  

After we have our configuration for database connection in place, we can create our express app:

```js
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
```


## Shared Directory

Open the `src/shared` folder and navigate to the `makeResponse.js` which contains a asynchronous function `makeResponse` for handling Express responses, executing provided actions, and managing errors. It specifically logs errors, sets appropriate HTTP status codes, and responds with a JSON object containing the error message. The status code is determined based on whether the error is a ValidationError or contains the string "not found."


```js
import { ValidationError} from '../../db/ottomanConnection'

async function makeResponse(res, action) {
  try {
    const result = await action()
    res.json(result)
  } catch (e) {
    const status = e.message !== undefined && e.message.indexOf('not found') !== -1 ? 404 : 500
    res.status(e instanceof ValidationError ? 400 : status)
    res.json({ message: e.message })
  }
}

module.exports = {
  makeResponse
}
```

### POST Airport

To insert a new airport document, locate the createAirline method within the `airportController` file found in the `controllers` package. This expects a POST request with the airport data provided in the request body.
We extract this airport ID from the airport data, check if there is a document with the same key, and create a airport document using Ottoman's [`.save()`](https://ottomanjs.com/docs/basic/model#constructing-documents) method and our model named: `AirlineModel`.

```js
  try {
    // Try to find an existing document with the given ID
    const existingAirline = await AirlineModel.findById(req.body.id);

    if (existingAirline) {
      // Document with the same id already exists
      return res.status(409).json({ message: "Duplicate key error" });
    }
  } catch (error) {
    // Ignore the error (i.e document with key not found, proceed to create)
  }
  await makeResponse(res, async () => {
    const airline = new AirlineModel(req.body);
    await airline.save();
    res.status(201);
    return airline;
  });
```

Let's break this code down.


After we check for required body parameters, we create a call to the `makeResponse()` to handle a call to ottoman's `save()`. We create a airport document with `airport.save()` and the airport it uses confirms to its Ottoman model called `airportModel`.

## GET Airport

To fetch a airport document, locate the getAirport method within the `airportController.js` file found in the `controllers` package. This expects a GET request with the airport document ID (id) specified in the URL path.
We extract this airport document ID from the URL and retrieve a Airport document using Ottoman's [`.findById()`](https://ottomanjs.com/docs/api/interfaces/imodel.html#findbyid) method using the `AirportModel`.

```js
  await makeResponse(res, async () => {
    const airline = await AirlineModel.findById(req.params.id);
    return airline;
  });
```

We only need the airport ID from the user to retrieve a particular airport document using a basic key-value operation. We catch the error if the key-value operation fails and return an error message.

## PUT Airport

To update a airport document, locate the updateAirline method within the `airportController.js` file found in the `controllers` package.
This expects a PUT request with the airport ID (id) specified in the URL path and the airport data to be updated provided in the request body.

```js
  await makeResponse(res, async () => {
    const airline = AirlineModel.replaceById(req.body.id, req.body);
    return airline;
  });
```


The `UpdateAirport` method calls the [`replaceyId()`](https://ottomanjs.com/docs/api/interfaces/imodel.html#replacebyid) method.

## DELETE Airport

To delete a airport document, locate the DeleteDocumentForAirport method within the `airportController.js` file found in the `controllers` package.
This expects a DELETE request with the airport document ID (id) specified in the URL path.
 We just need to supply the `id` of the document we want to remove.

```js
  await makeResponse(res, async () => {
    await AirlineModel.removeById(req.params.id);
    res.status(204);
  });
```

Delete Airport by Airport ID by using Ottoman's [`removeById()`](https://ottomanjs.com/docs/api/interfaces/imodel.html#removebyid) method on the `AirportModel` and returns a 404 if the document is not found.

## List Airport

This endpoint retrieves the list of airports in the database. The API has options to specify the page size for the results and country from which to fetch the airport documents.

[SQL++](https://docs.couchbase.com/nodejs-sdk/current/howtos/n1ql-queries-with-sdk.html) is a powerful query language based on SQL, but designed for structured and flexible JSON documents. We will use a SQL+ query to search for airports with Limit, Offset, and Country option. The SQL++ query is built using the models [find method](https://ottomanjs.com/docs/basic/query-builder#query-builder--model-find-method)

Navigate to the `listAirports` method in the `airportController.js` file. This endpoint is different from the others we have seen before because it makes the SQL++ query rather than a key-value operation. This usually means more overhead because the query engine is involved. For this query, we are using the predefined indices in the `travel-sample` bucket. We can create an additional [index](https://docs.couchbase.com/server/current/learn/services-and-indexes/indexes/indexing-and-query-perf.html) specific for this query to make it perform better.

First, we need to get the values from the query string for country, limit, and Offset that we will use in our query. These are pulled from the `request.query` method.

This end point has two queries depending on the value for the country parameter. If a country name is specified, we retrieve the airport documents for that specific country. If it is not specified, we retrieve the list of airports across all countries. The queries are slightly different for these two scenarios.

The Ottoman's [`find()`](https://ottomanjs.com/docs/basic/query-builder#query-builder--model-find-method) method takes the paramters we received from the user as options.

```js
  const country = req.query.country || "";
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  let filter = {};
  if (country) {
    filter.country = country;
  }

  const options = { limit: limit, offset: offset };
  await makeResponse(res, async () => {
    const airports = await AirportModel.find(filter, options);
    return airports.rows;
  });
```

### Direct Connections

This endpoint fetches the airports that can be reached directly from the specified source airport code. This uses the query builder to create the SQL++ query and fetch the results simlar to the List Airport endpoint but uses the ottoman instance to query the result via the [query builder](https://ottomanjs.com/docs/basic/query-builder#query-builder--model-find-method) by first creating the sub query and then using the build method on it.

Let us look at the sub query being created here:

```js
  const airport = req.query.airport;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  // Subquery to get distinct airline IDs
  const subquery = new Query({}, "travel-sample.inventory.route")
    .select([{ $field: "DISTINCT route.destinationairport" }])
    .plainJoin(
      "JOIN `travel-sample`.inventory.airport AS airport ON route.sourceairport = airport.faa",
    )
    .where({
      "airport.faa": { $eq: airport },
      "route.stops": { $eq: 0 },
    })
    .orderBy({ "route.destinationairport": "ASC" })
    .limit(limit)
    .offset(offset);

  await makeResponse(res, async () => {
    const result = await ottoman.query(subquery.build());
    return result.rows;
  });
```

We are fetching the direct connections by joining the airport collection with the route collection and filtering based on the source airport specified by the user and by routes with no stops.

### Project Setup Notes

We have set up a `.babelrc` file at the root of our project so that we can use ES6 and imports in our project:

```json
{
  "presets": [
    "@babel/preset-env"
  ]
}
```

We have created a start script in our `package.json` that executes babel-node and the starting point of our application `src/server.js`:

```json
"scripts": {
  "start": "env-cmd ./config/dev.env nodemon --exec babel-node src/server",
},
```

There are other scripts that we have added for our maintenance and testing of the project on GitHub using GitHub actions.

```json
  "scripts": {
    "start": "env-cmd -f ./config/dev.env nodemon --exec babel-node src/server",
    "test": "env-cmd -f ./config/test.env jest --verbose --forceExit --detectOpenHandles",
    "testGA": "jest --verbose --runInBand",
    "clean": "rm -rf dist",
    "build": "npm run clean && babel ./src --out-dir dist --copy-files"
  },
```

## Running Tests

We have defined integration tests using [jest](https://jestjs.io/) for all the API end points. The integration tests use the same database configuration as the application. After the tests, the documents are cleaned up.

The tests are configured in the `__test__` folder.

To run the tests, run the below command after copying the content of the `dev.env` file to the `test.env` to ensure it uses the same database configuration:

```bash
# Execute this command in the project's root directory
npm run test
```

## Appendix

### Extending API by Adding New Entity

If you would like to add another entity to the APIs, these are the steps to follow:

- **Create the New Entity in Couchbase Bucket:**
  - Utilize the [Couchbase Server interface](https://docs.couchbase.com/cloud/n1ql/n1ql-language-reference/createcollection.html) to establish the new collection within the Couchbase bucket.

- **Define the New Route:**
  - Navigate to the `src/routes` folder and create the new route.

- **Controller Configuration:**
  - Develop a new file in the `controllers` folder, mirroring the existing structures (e.g., `airportController.js`). Craft the corresponding method within this file to manage the new entity.


- **Add Tests:**
  - Add the tests for the new routes in a new file in the `__test__` folder similar to other collection tests.

Following these steps ensures a systematic and organized approach to expanding the API functionality with a new entity.
### Running Self Managed Couchbase Cluster

If you are running this quickstart with a self managed Couchbase cluster, you need to [load](https://docs.couchbase.com/server/current/manage/manage-settings/install-sample-buckets.html) the travel-sample data bucket in your cluster and generate the credentials for the bucket.

- Follow [Couchbase Installation Options](/tutorial-couchbase-installation-options) for installing the latest Couchbase Database Server Instance.

You need to update the connection string and the credentials in the `dev.env` file in the `config` folder.

> Note: Couchbase Server must be installed and running prior to running the app.

### Swagger Documentation

Swagger documentation provides a clear view of the API including endpoints, HTTP methods, request parameters, and response objects.

Click on an individual endpoint to expand it and see detailed information. This includes the endpoint's description, possible response status codes, and the request parameters it accepts.

#### Trying Out the API

You can try out an API by clicking on the "Try it out" button next to the endpoints.

- Parameters: If an endpoint requires parameters, Swagger UI provides input boxes for you to fill in. This could include path parameters, query strings, headers, or the body of a POST/PUT request.

- Execution: Once you've inputted all the necessary parameters, you can click the "Execute" button to make a live API call. Swagger UI will send the request to the API and display the response directly in the documentation. This includes the response code, response headers, and response body.

#### Models

Swagger documents the structure of request and response bodies using models. These models define the expected data structure using JSON schema and are extremely helpful in understanding what data to send and expect.