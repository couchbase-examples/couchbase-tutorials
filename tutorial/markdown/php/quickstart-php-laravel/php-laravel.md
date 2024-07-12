---
# frontmatter
path: "/tutorial-quickstart-php-laravel"
# title and description do not need to be added to markdown, start with H2 (##)
title: Quickstart in Couchbase with PHP and Laravel
short_title: PHP and Laravel
description:
  - Learn to build a REST API in PHP using Laravel and Couchbase
  - Explore key-based operations and SQL++ querying using PHP SDK
  - Explore CRUD operations in action with Couchbase
content_type: quickstart
filter: sdk
technology:
  - kv
  - query
tags:
  - REST API
  - Laravel
sdk_language:
  - php
length: 30 Mins
---

<!--
    The name of this file does not need to be `tutorial-quickstart-php-laravel` because it is in the `tutorials/php/markdown` directory, so we can just call it `php-laravel`. The idea is that we can leave off `tutorial-quickstart` as a prefix.
-->

<!-- TODO:  Figure out how to add width to image size in try it now links -->

## Getting Started

### Prerequisites

To run this prebuilt project, you will need:

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded.
    - To run this tutorial using a self managed Couchbase cluster, please refer to the [appendix](#running-self-managed-couchbase-cluster).
- PHP installed
- Code Editor installed (Visual Studio Code, PhpStorm, or Sublime Text)
- Composer command line

### Source Code

```shell
git clone https://github.com/couchbase-examples/php-laravel-quickstart.git
```

### Install Dependencies

```shell
composer install
```

> Note: Composer automatically installs the required dependencies when building the project.

### Database Server Configuration

The `CouchbaseServiceProvider` class is a Laravel service provider class responsible for setting up the connection to a Couchbase database in a Laravel application. It defines the following configurations:

 - `couchbase.cluster`: This configuration specifies the Couchbase cluster connection using the provided hostname, username, and password.
 - `couchbase.bucket`: This configuration specifies the Couchbase bucket connection using the provided bucket name.
 - `couchbase.airlineCollection`: This configuration specifies the airline collection in the Couchbase bucket.
 - `couchbase.airportCollection`: This configuration specifies the airport collection in the Couchbase bucket.
 - `couchbase.routeCollection`: This configuration specifies the route collection in the Couchbase bucket.
 - `couchbase.hotelCollection`: This configuration specifies the hotel collection in the Couchbase bucket.


### Application Environment
You need to configure the connection details to your Couchbase Server in the `config/couchbase.php` file located in the root directory of the project.

In the `config/couchbase.php` file, update the following variables:
- `DB_CONN_STR`: Replace with the connection string of your Couchbase cluster.
- `DB_USERNAME`: Replace with the username of a Couchbase user with access to the bucket.
- `DB_PASSWORD`: Replace with the password of the Couchbase user.

Make sure to save the changes after updating the variables in the `config/couchbase.php` file.

The connection string should be in the following format:

```php
return [
    'host' => env('DB_CONN_STR', 'couchbase://127.0.0.1'),
    'username' => env('DB_USERNAME', 'Administrator'),
    'password' => env('DB_PASSWORD', 'password'),
    'bucket' => env('DB_BUCKET', 'travel-sample'),
];
```

For more information on the Laravel connection string, see the [Database Configuration](https://laravel.com/docs/8.x/database#configuration) documentation.

## Running The Application

### Directly on the machine

At this point the application is ready, and you can run it via the command line:

```shell
php artisan serve
```

> Note: Either the Couchbase Server must be installed and running on localhost or the connection string must be updated in the `config/couchbase.php` file.

### Docker

Build the Docker image

```sh
docker build -t php-laravel-quickstart .
```

Run the Docker image

```sh
docker run -d --name laravel-container -p 8000:8000 php-laravel-quickstart -e DB_CONN_STR=<connection_string> -e DB_USERNAME=<username> -e DB_PASSWORD=<password>
```

Note: The `config/couchbase.php` file has the connection information to connect to your Capella cluster. You can also pass the connection information as environment variables to the Docker container.
If you choose not to pass the environment variables, you can update the `config/couchbase.php` file in the root directory.

Once the application is running, you can access it in your browser at [http://localhost:8000](http://localhost:8000).

### Verifying the Application

Once the application starts, you can see the details of the application on the logs.
![Application Startup](./php-quickstart-app-startup.png)

The application will run on port 8000 of your local machine (http://localhost:8000). You will find the Swagger documentation of the API if you go to the URL in your browser. Swagger documentation is used in this demo to showcase the different API endpoints and how they can be invoked. More details on the Swagger documentation can be found in the [appendix](#swagger-documentation).

![Swagger Documentation](./php-quickstart-swagger.png)

## Data Model

For this tutorial, we use three collections, `airport`, `airline` and `route` that contain sample airports, airlines and airline routes respectively. The route collection connects the airports and airlines as seen in the figure below. We use these connections in the quickstart to generate airports that are directly connected and airlines connecting to a destination airport. Note that these are just examples to highlight how you can use SQL queries to join the collections.

![Data Model](./travel_sample_data_model.png)

## Airline Document Structure

We will be setting up a REST API to manage some airline documents. The `name` field is the name of the airline. The `callsign` field is the callsign of the airline. The `iata` field is the IATA code of the airline. The `icao` field is the ICAO code of the airline. The `country` field is the country of the airline.

Our airline document will have a structure similar to the following example:

```json
{
    "name": "Couchbase Airways",
    "callsign": "Couchbase",
    "iata": "CB",
    "icao": "CBA",
    "country": "United States"
}
```

## Let's Review the Code

To begin, open the repository in an IDE of your choice to learn about how to create, read, update, and delete documents in your Couchbase Server.

### Code Organization

- `tests/Feature`: Contains integration tests.
- `app/Http/Controllers`: Contains the controller classes.
- `app/Models`: Contains the model classes.

## API Endpoints Documentation

### 1. Get List of Airlines

**Endpoint:**

`GET /api/v1/airlines/list`

**Description:**

This endpoint retrieves a list of airlines from the database. Clients can optionally filter the results by country and paginate through the results using the `offset` and `limit` query parameters. This helps in managing large datasets by breaking them into smaller, manageable chunks.

**Steps:**

1. The client sends a GET request to the endpoint `/api/v1/airlines/list`.
2. Optionally, the client includes query parameters:
   - `offset` specifies the number of items to skip before starting to collect the result set.
   - `limit` specifies the number of items to return.
   - `country` filters the results to only include airlines from a specific country.
3. The server processes the request and queries the database for airlines that match the given criteria.
4. The server returns a list of airlines. If no airlines match the criteria, an appropriate error message is returned.

---

### 2. Get Airline by ID

**Endpoint:**

`GET /api/v1/airlines/{id}`

**Description:**

This endpoint retrieves detailed information about a specific airline by its ID. This is useful for getting the full profile of an airline, including its callsign, country, IATA code, ICAO code, and name.

**Steps:**

1. The client sends a GET request to the endpoint `/api/v1/airlines/{id}`.
2. The client includes the airline ID in the path of the request.
3. The server searches the database for an airline with the specified ID.
4. If the airline is found, the server returns the airline's details. If the airline is not found, an error message is returned.

---

### 3. Create a New Airline

**Endpoint:**

`POST /api/v1/airlines/{id}`

**Description:**

This endpoint allows the creation of a new airline with the specified ID. The client must provide all required airline details in the request body, such as callsign, country, IATA code, ICAO code, and name.

**Steps:**

1. The client sends a POST request to the endpoint `/api/v1/airlines/{id}`.
2. The client includes the airline ID in the path and provides the airline details in the request body.
3. The server validates the provided data to ensure all required fields are present and correctly formatted.
4. If validation passes, the server saves the new airline in the database. If validation fails, an error message is returned.

---

### 4. Update an Existing Airline

**Endpoint:**

`PUT /api/v1/airlines/{id}`

**Description:**

This endpoint updates an existing airline or creates a new one if it does not exist. The client must provide the necessary airline details in the request body. This allows updating airline information or adding new airlines to the database.

**Steps:**

1. The client sends a PUT request to the endpoint `/api/v1/airlines/{id}`.
2. The client includes the airline ID in the path and provides the updated airline details in the request body.
3. The server validates the provided data to ensure all required fields are present and correctly formatted.
4. If the airline exists, the server updates the existing record with the new data. If the airline does not exist, the server creates a new airline with the provided details.
5. The server returns a success message indicating whether the airline was updated or created. If validation fails, an error message is returned.

---

### 5. Delete an Airline

**Endpoint:**

`DELETE /api/v1/airlines/{id}`

**Description:**

This endpoint deletes a specific airline from the database by its ID. This is useful for removing outdated or incorrect airline records.

**Steps:**

1. The client sends a DELETE request to the endpoint `/api/v1/airlines/{id}`.
2. The client includes the airline ID in the path of the request.
3. The server searches the database for an airline with the specified ID.
4. If the airline is found, the server deletes the airline from the database. If the airline is not found, an error message is returned.

---

### 6. Get Airlines Flying to a Destination Airport

**Endpoint:**

`GET /api/v1/airlines/to-airport/{destinationAirportCode}`

**Description:**

This endpoint retrieves a list of airlines that fly to a specific destination airport. This can be useful for travelers or systems that need to display available airlines for a particular route.

**Steps:**

1. The client sends a GET request to the endpoint `/api/v1/airlines/to-airport/{destinationAirportCode}`.
2. The client includes the destination airport code in the path of the request.
3. Optionally, the client includes query parameters:
   - `offset` specifies the number of items to skip before starting to collect the result set.
   - `limit` specifies the number of items to return.
4. The server processes the request and queries the database for airlines that fly to the specified airport.
5. The server returns a list of airlines. If no airlines are found, an appropriate error message is returned.

## Running The Tests

This command will execute all the test cases in your project.

```sh
php artisan test
```

### Run Individual Tests:

Additionally, you can run individual test classes or methods using the following commands:

To run the tests for the AirlineTest class:
```sh
php artisan test --filter AirlineTest
```

To run the tests for the AirportTest class:

```sh
php artisan test --filter AirportTest
```

To run the tests for the RouteTest class:

```sh
php artisan test --filter RouteTest
```

## Project Setup Notes

This project was based on the standard [Laravel project](https://laravel.com/docs).

A full list of packages are referenced in the `composer.json` file.


## Contributing

Contributions are welcome! If you'd like to contribute to this project, please fork the repository and create a pull request.

## Appendix

### Extending API by Adding New Entity

If you would like to add another entity to the APIs, follow these steps:

- **Create the new entity (collection) in the Couchbase bucket:** You can create the collection using the [SDK](https://docs.couchbase.com/php-sdk/current/howtos/provisioning-cluster-resources.html#collection-management) or via the [Couchbase Server interface](https://docs.couchbase.com/cloud/n1ql/n1ql-language-reference/createcollection.html).
  
- **Define the model:** Create a new model in the `app/Models` directory, similar to the existing `Airline` model. For example, you can create a file `Hotel.php`:
  ```php
  namespace App\Models;

  use Illuminate\Database\Eloquent\Model;

  class Hotel extends Model
  {
      protected $bucket;

      protected $fillable = [
          'name',
          'address',
          'city',
          'country',
          'stars'
      ];

      public function __construct(array $attributes = [])
      {
          parent::__construct($attributes);
          $this->bucket = app('couchbase.bucket');
      }

      // Add methods for querying, saving, and deleting Hotel data
  }
  ```

- **Define the controller:** Create a new controller in the `app/Http/Controllers` directory, similar to the existing `AirlineController`. For example, you can create a file `HotelController.php`:
  ```php
  namespace App\Http\Controllers;

  use Illuminate\Http\Request;
  use App\Models\Hotel;

  class HotelController extends Controller
  {
      // Add methods for handling HTTP requests for the Hotel entity
  }
  ```

- **Define the routes:** In the `routes/api.php` file, define the routes for the new entity similar to the existing routes for airlines:
  ```php
  Route::prefix('v1/hotels')->group(function () {
      Route::get('list', 'HotelController@index');
      Route::get('{id}', 'HotelController@show');
      Route::post('{id}', 'HotelController@store');
      Route::put('{id}', 'HotelController@update');
      Route::delete('{id}', 'HotelController@destroy');
  });
  ```

- **Integration tests:** Create a new test class in the `tests/Feature` directory, similar to the existing tests. For example, you can create a file `HotelIntegrationTest.php`:
  ```php
  namespace Tests\Feature;

  use Tests\TestCase;

  class HotelIntegrationTest extends TestCase
  {
      // Add test methods for the Hotel endpoints
  }
  ```

### Running Self Managed Couchbase Cluster

If you are running this quickstart with a self-managed Couchbase cluster, you need to [load](https://docs.couchbase.com/server/current/manage/manage-settings/install-sample-buckets.html) the travel-sample data bucket in your cluster and generate the credentials for the bucket.

You need to update the connection string and the credentials in the `config/couchbase.php` file:

```env
DB_CONN_STR_=couchbase://<your-couchbase-server>
DB_USERNAME=<your-username>
DB_PASSWORD=<your-password>
DB_BUCKET=travel-sample
```

Replace `<your-couchbase-server>`, `<your-username>`, and `<your-password>` with your actual Couchbase server details and credentials.
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
