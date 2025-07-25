---
# frontmatter
path: "/tutorial-couchbase-edge-server-demo"
title: "Explore Couchbase Edge Server with Offline-First Meal Application"
short_title: "Couchbase Edge Server Demo"
description:
  - Learn how to set up Couchbase Edge Server
  - Explore seatback meal-application showcasing Couchbase Edge Server capabilities
  - Configure bidirectional sync between Edge Server and Capella App Services
content_type: tutorial
filter: mobile
technology:
  - edge-server
  - app-services
  - react
  - mobile
sdk_language: 
  - any
tags:
  - Couchbase Edge Server
  - App Services
length: 45 Mins
---

## Introduction

Imagine you’re on a 10-hour international flight. Passengers want to order meals, but the plane has unstable internet connection. How do you ensure orders are captured reliably and synced to the cloud? This is where Couchbase Edge Server shines.

In this tutorial, you’ll build a flight meal ordering system that:

- Works offline using Edge Server, a lightweight database for edge devices.
- Syncs seamlessly with the cloud via Capella App Services when connectivity resumes.
- Uses a React frontend to simulate seatback screens for business/economy classes.

What You’ll Learn?

- How to set up Couchbase Edge Server on your local machine.
- How to configure it to synchronize data with a remote Capella App Services instance.
- How to deploy and run a React-based seatback meal-ordering web application that communicates with Couchbase Edge Server over a REST API.
- Observe how the application continues to function and store data offline even when there is no internet connectivity, and then automatically syncs changes once the connection returns.
> **Disclaimer**: "American Airlines" is used generally to refer to any airline and does not reflect a specific use case with American Airlines or any specific airliner.

## Architecture Overview

- Couchbase Edge Server
   - Lightweight (~10MB) database for edge devices (e.g., aircraft servers).
   - Provides REST APIs for web/mobile apps.
   - Stores data locally and syncs with the cloud when online.
- Capella App Services
   - Manages secure sync between Edge Server and the cloud.
   - Acts as the "source of truth" for meal inventory and orders.
- React Web App
   - Simulates seatback ordering screens.
   - Talks directly to Edge Server via REST.

## Setup & Technology Stack

The setup would be as follows:

![](./edge-sample-app-setup.png)

* Capella / Capella App Services
* Couchbase Edge Server
* Sample web application

## Installation Instructions
### Capella Cluster Setup
Although instructions are specified for Capella, equivalent instructions apply to self-managed Couchbase Server as well. 

* Sign up for Capella Free Tier and [follow the steps](https://docs.couchbase.com/cloud/get-started/create-account.html) to deploy a free tier cluster. 
* Follow [instructions to create a bucket](https://docs.couchbase.com/cloud/clusters/data-service/manage-buckets.html#add-bucket) to create a *bucket* named "mealordering". 
* Follow [scope creation instructions](https://docs.couchbase.com/cloud/clusters/data-service/about-buckets-scopes-collections.html#scopes) to create a *scope* named "AmericanAirlines" and follow the [instructions to create a collection](https://docs.couchbase.com/cloud/clusters/data-service/about-buckets-scopes-collections.html#collections) to create a *collection* named "AA234".

   ![](./edge-sample-create-doc.png)
* Download **"mealordering.zip"** sample data set from [this location](https://edge-server-tutorial-data.s3.us-east-2.amazonaws.com/mealordering.zip). It includes 4 documents:
    - businessinventory.json
    - businessmeal.json
    - economyinventory.json
    - economymeal.json

* Follow [instructions](https://docs.couchbase.com/cloud/clusters/data-service/manage-documents.html#create-documents) to create sample documents corresponding to each of the documents above. Add them to specified bucket named "mealordering", scope named "AmericanAirlines", and collection named "AA234" created in the previous step. For example, create a document with docId of "businessinventory" and copy the contents of the sample JSON file to the document body.

   ![](./create-new-document.png)

At the end of the setup, your Capella Setup looks like this:
![](./edge-sample-cluster.png)

### Capella App Services
App Services acts as our cloud sync layer - it will validate and route data between Edge Server and Capella while enforcing security rules. Although instructions are specified for Capella App Services, equivalent instructions apply to self-managed Sync Gateway as well. 

* Follow [instructions](https://docs.couchbase.com/cloud/get-started/create-account.html#app-services) to create a free tier App Services that links to the free tier cluster created in previous step.
* Create an *App Endpoint* named "american234" by following these [instructions](https://docs.couchbase.com/cloud/get-started/configuring-app-services.html#create-app-endpoint). When you create the App Endpoint, link it to the bucket named "mealordering", the scope named "AmericanAirlines", and the collection named "AA234".

   The configuration should look something like this:
   ![](./edge-sample-appendpoint.png)

* Create an App User named "edgeserver234". Remember the password you use as you will need to configure your Edge Server later. 
      - Set up the access grant so the App User is granted access to the channel named "AA234" in the corresponding collection.

   The configuration of App User should look something like this:

   ![](./edge-sample-app-user.png)

* Go to the "connect" tab and record the public URL endpoint. You will need it when you configure your Edge Server.

   ![](./edge-sample-connect.png)

### Couchbase Edge Server Setup
The instructions below describe how to deploy and run edge server on your local Mac machine. The equivalent instructions should apply to Linux-based machines as well.

* Download Edge Server binary from the [downloads page](https://www.couchbase.com/downloads?family=edge-server).
* Download the associated configuration .zip file named **"config-edge-server.zip"** from this [location](https://edge-server-tutorial-data.s3.us-east-2.amazonaws.com/config-edge-server.zip).
* Unzip the contents of the package and place them in the same directory as your Edge Server executable. It will include the following:
      - **usersfile**: This includes the list of web users who can access data from Edge Server. These are the credentials with which the web app authenticates with the server.
         - [Optional] If you are interested in learning about how to generate your own users, run `./couchbase-edge-server --help` command to get more details.
      - **certfile.pem** and **keyfile**: The edge server is configured to start up with an anonymous self-signed certificate with a "common name" of localhost. This is the cert file and private key corresponding to that. 
         - [Optional] If you are interested in how you can generate your own anonymous self-signed certfile and keyfile, run the `./couchbase-edge-server --help` command to get more details. We'd recommend you follow the Edge Server documentation to generate your own certificate and private key.
* Open the config file named "config-tls-replication-sync.json" and edit the file as follows:
   - In the Replication section, replace these placeholders:

```json
{
   "replications": [
      {
         // setup a bidirectional continuous replication
         "source": "<<REPLACE WITH THE PUBLIC URL FROM CONNECT PAGE>>",
         "target": "american234",
         "bidirectional": true,
         "continuous": true,
         "collections": {
            "AmericanAirlines.AA234": {}
         },
         "auth": {
            "user": "edgeserver234",        // user setup on remote app services/Sync Gateway
            "password": "<<REPLACE WITH PASSWORD OF APP USER>>" // user setup on remote app services/Sync Gateway
         }
      }
   ]
}
```

     - The source should correspond to the public URL that you get from the Connect tab of App Endpoint.
     - The password should be the password corresponding to the App User that you created on App Endpoint.

* Start the edge server. It will start listening for incoming connections on port 60000 (you can change that in your config file):

      ```bash
         ./couchbase-edge-server --verbose config-tls-replication-sync.json
      ```

      If everything is set up properly, the Edge Server will sync down documents from remote App Services.

### Web App Setup 

Follow these steps to set up and run the application locally on the same machine as the Edge Server:

* **Clone the Repository**:
   ```bash
   git clone https://github.com/couchbase-examples/edge-server-meal-order-sample-app
   cd edge-server-sko-demo
   ```

* **Install Dependencies**:
   Ensure you have **Node.js** (version 16 or later) installed. Then, install the required dependencies by running:
   ```bash
   npm install
   ```

* **Create .env File**:
   Create a .env file in the project root and define the URL to the Edge Server:
   ```bash
   EDGE_SERVER_BASE_URL="https://localhost:60000"
   ```

* **Edge Server REST Calls in React**:
In the web app, you might see code making REST requests to the Edge Server base URL. For example, to fetch the meal of business class:
   ```js
   export const fetchBusinessMeal = async () => {
      try {
         const response = await api.fetch("/american234.AmericanAirlines.AA234/businessmeal");
         if (!response) {
            const errorData = await response.text();
            throw new Error(errorData || "Failed to fetch businessmeal data");
         }
         return response as MealDoc;
      } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to fetch businessmeal data: ${error.message}`);
         }
         throw new Error("An unknown error occurred");
      }
   }
   ```

To place an Order:
   ```js
   const updateInventoryData = async (
      inventory: InventoryDoc,
      revId: string
   ): Promise<InventoryDoc> => {
      return api.fetch(
         `/american234.AmericanAirlines.AA234/businessinventory?rev=${revId}`,
         {
            method: "PUT",
            body: JSON.stringify(inventory),
         }
      );
   };
   ```


The web app uses Edge Server's real-time _changes API to instantly reflect inventory updates across all seats. When business class seat 4A orders steak, other seats see the remaining count update without refreshing:

```js
        const response = await fetch(
          `/american234.AmericanAirlines.AA234/_changes?feed=continuous&include_docs=true&heartbeat=600&since=now&filter=doc_ids&doc_ids=businessinventory`,
          {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Accept': 'application/json'
            },
            signal: abortController.signal
          }
        );
```

* **Start the Development Server**:
   Launch the application in development mode using:
   ```bash
   npm run dev -- --host
   ```
   The application will be available at `http://localhost:5173` (or at an IP Address that can be accessible over local network).

## Run the demo
* Open the web app in a browser. It can be on a local machine or remote. 
   - `http://localhost:5173` will open up the business version of the app.
   - `http://localhost:5173/economy` will open up the economy version of the app.

* Disconnect the local machine from the Internet so it cannot access the remote App Services. In this scenario, the Edge Server and the web app are disconnected from Internet.

   ![](./edge-sample-app-business.png)

* Place some orders via the app. 

   ![](./edge-sample-app-place-order.png)

You will see corresponding requests show up in the console output of the Edge Server, similar to ones below:
```bash
2025-02-24T20:04:08.756-0500	127.0.0.1:61556 PUT /american234.AmericanAirlines.AA234/economyinventory?rev=5-3ad339cd20ca9f04874bf62e45c95eac8bcc0689 -> 201 Created  [282.551ms]
2025-02-24T20:04:08.756-0500	(Listener) Obj=/RESTConnection#107/ End of socket connection from 127.0.0.1:61556 (Connection:close) 
2025-02-24T20:04:08.769-0500	(Listener) Incoming TLS connection from 127.0.0.1:61558 -- starting handshake
2025-02-24T20:04:08.799-0500	(Listener) Accepted connection from 127.0.0.1:61558
2025-02-24T20:04:08.800-0500	(Listener) {RESTConnection#108}==> litecore::edge_server::RESTConnection from 127.0.0.1:61558 @0x600003d08650
2025-02-24T20:04:08.800-0500	(Listener) Obj=/RESTConnection#108/ Handling GET /american234.AmericanAirlines.AA234/economyinventory 
2025-02-24T20:04:09.078-0500	127.0.0.1:61558 GET /american234.AmericanAirlines.AA234/economyinventory -> 200   [278.044ms]
2025-02-24T20:04:09.078-0500	(Listener) Obj=/RESTConnection#108/ End of socket connection from 127.0.0.1:61558 (Connection) 
```
* You can also use any HTTP client to fetch a document and verify that it's updated:

```bash
curl --location 'https://localhost:60000/american234.AmericanAirlines.AA234/businessinventory' \
--header 'Authorization: Basic c2VhdHVzZXI6cGFzc3dvcmQ='
```

## Conclusion
By walking through this tutorial, you have explored not just how to run the application, but also why Couchbase Edge Server plays a crucial role in offline-first scenarios. You have seen how integrating Edge Server on the aircraft side and using Capella App Services  allows you to elegantly synchronize data once connectivity is restored. You also saw how the seatback React app, using the Edge Server’s REST API, can continue to function even without an internet connection.

## Reference Documentation
- [Couchbase Edge Server](https://docs.couchbase.com/couchbase-edge-server/current/get-started/get-started-landing.html)
- [Capella](https://docs.couchbase.com/cloud/get-started/intro.html)