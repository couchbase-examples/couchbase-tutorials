---
path: "/retail-demo-capella-setup"
title: Setting Up Couchbase Capella for the Retail Demo
short_title: Capella Setup
description:
  - Create a Couchbase Capella cluster and bucket
  - Configure scopes and collections for multi-store inventory
  - Set up App Services for mobile and web sync
  - Import sample data for testing
content_type: tutorial
filter: mobile
technology:
  - mobile
  - capella
  - app-services
tags:
  - App Services
  - DBaaS
sdk_language:
  - any
length: 30 Mins
exclude_tutorials: true
---

## Introduction

In this tutorial, you will set up the cloud backend required for the Couchbase Lite Retail Demo. This includes creating a Couchbase Capella cluster, configuring the data model with scopes and collections, and setting up App Services for real-time synchronization.

You will learn the fundamentals of:

* Creating a Couchbase Capella cluster
* Configuring buckets, scopes, and collections
* Importing sample data
* Setting up Capella App Services
* Configuring user authentication

> **NOTE**: Although instructions are specified for Capella App Services, equivalent instructions apply to self-managed Sync Gateway as well.

## Prerequisites

* A [Couchbase Capella account](https://cloud.couchbase.com/) (free trial available)
* Basic understanding of NoSQL concepts

## Step 1: Create a Couchbase Capella Cluster

1. Log in to [Couchbase Capella](https://cloud.couchbase.com/)

2. Create a new cluster by following the [official instructions](https://docs.couchbase.com/cloud/get-started/create-account.html)

3. Wait for the cluster to be provisioned (this may take a few minutes)

## Step 2: Create the Supermarket Bucket

1. Navigate to your cluster in the Capella dashboard

2. Create a bucket named **"supermarket"** by following these [instructions](https://docs.couchbase.com/cloud/clusters/data-service/about-buckets-scopes-collections.html#buckets)

3. Use the default bucket settings for this demo

## Step 3: Create Scopes for Each Store

Create two scopes to represent different store locations:

1. Navigate to the **supermarket** bucket

2. Create a scope named **"NYC-Store"** following these [instructions](https://docs.couchbase.com/cloud/clusters/data-service/about-buckets-scopes-collections.html#scopes)

3. Create another scope named **"AA-Store"**

## Step 4: Create Collections

In **each** scope (NYC-Store and AA-Store), create three collections:

| Collection | Purpose |
|------------|---------|
| `inventory` | Product inventory items with stock levels |
| `orders` | Customer orders with status tracking |
| `profile` | Store profile and contact information |

Follow these [instructions](https://docs.couchbase.com/cloud/clusters/data-service/scopes-collections.html#create-collection) to create each collection.

### Expected Data Model

After completing these steps, your cluster configuration should look like this:

![Data Model](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/data-model.png)

```
📦 supermarket (bucket)
├── 📁 AA-Store (scope)
│   ├── 📚 inventory
│   ├── 📚 orders
│   └── 📚 profile
├── 📁 NYC-Store (scope)
│   ├── 📚 inventory
│   ├── 📚 orders
│   └── 📚 profile
├── 📁 _default (system scope)
└── 📁 _system (system scope)
```

## Step 5: Import Sample Data

1. Download and unzip the sample dataset:
   * [demo-dataset.zip](https://cbm-retaildemo-dataset.s3.us-west-1.amazonaws.com/demo-dataset.zip)

2. Follow the [import instructions](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html#how-to-import-data) to import data into each scope/collection using inline mode

3. **Important**: When importing data, select the **Field** option to map the document ID

![Import Data](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/import-data.png)

4. Repeat for each collection in both scopes

## Step 6: Create App Services

Now set up Capella App Services to enable synchronization between mobile/web clients and your Capella cluster.

### Create the App Service

1. Create an App Service named **"supermarket-appservice"** linked to your supermarket cluster

2. Follow these [instructions](https://docs.couchbase.com/cloud/get-started/create-account.html#app-services)

### Create App Endpoints

Create two App Endpoints, one for each store scope:

| App Endpoint Name | Linked Scope | Description |
|-------------------|--------------|-------------|
| `supermarket-aa` | AA-Store | Endpoint for AA store employees |
| `supermarket-nyc` | NYC-Store | Endpoint for NYC store employees |

Follow these [instructions](https://docs.couchbase.com/cloud/get-started/configuring-app-services.html#create-app-endpoint) for each endpoint.

Your App Endpoint configuration should look like this:

![App Endpoint Configuration](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/appendpoint.png)

### Link Collections to App Endpoints

For each App Endpoint, ensure the following collections are linked:

* ✅ `inventory`
* ✅ `orders`
* ✅ `profile`

## Step 7: Create App Users

Create users for each store location. These credentials will be used by the mobile and web applications to authenticate.

### User Configuration

| Store | Username | Password | App Endpoint |
|-------|----------|----------|--------------|
| NYC | `nyc-store-01@supermarket.com` | `P@ssword1` | supermarket-nyc |
| AA | `aa-store-01@supermarket.com` | `P@ssword1` | supermarket-aa |

Follow these [instructions](https://docs.couchbase.com/cloud/app-services/user-management/create-user.html) to create each user.

> **TIP**: If you want the demo apps to work with pre-filled credentials, use exactly the usernames and passwords listed above.

Your App User configuration should look like this:

![App User Configuration](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/appuser.png)

## Step 8: Record Your Connection URL

1. In your App Endpoint, go to the **Connect** tab

2. Copy the **Public Connection URL** - you'll need this when configuring your apps

![Connection URL](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/connectapp.png)

The URL format is:
```
wss://your-endpoint.apps.cloud.couchbase.com:4984/database-name
```

## Step 9: Configure CORS (Web Only)

If you're running the web application, you need to enable CORS on your App Endpoints.

> **Skip this section** if you're only testing mobile apps.

For **each** App Endpoint (supermarket-aa and supermarket-nyc):

1. Enable CORS from the Settings page following these [instructions](https://docs.couchbase.com/cloud/app-services/deployment/cors-configuration-for-app-services.html#about-cors-configuration)

2. Set **Origin** as `http://localhost:8080`

![CORS Origin](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/cors1.png)

3. Set **Login Origin** as `http://localhost:8080`

4. Set **Allowed Headers** as `Authorization`

![CORS Headers](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/cors2.png)

> **NOTE**: If your web app runs on a different port, adjust the CORS settings accordingly.

## Verify Your Setup

Before proceeding, verify:

- [ ] Supermarket bucket exists with NYC-Store and AA-Store scopes
- [ ] Each scope has inventory, orders, and profile collections
- [ ] Sample data is imported into each collection
- [ ] App Services are created with endpoints for each store
- [ ] Users are created for each App Endpoint
- [ ] You have the Public Connection URL saved
- [ ] CORS is configured (if using web app)

## Troubleshooting

### Data Not Appearing After Import

* Verify you selected the correct scope and collection
* Check that the Field option was used for document ID mapping
* Ensure the import completed without errors

### App Services Connection Issues

* Verify the App Endpoint is in "Running" state
* Check that collections are properly linked
* Ensure user credentials match exactly

### CORS Errors (Web)

* Verify Origin matches your development server URL exactly
* Check that Authorization is in Allowed Headers
* Ensure you saved the CORS configuration

## Learn More

### References

* [Couchbase Capella Documentation](https://docs.couchbase.com/cloud/index.html)
* [App Services Documentation](https://docs.couchbase.com/cloud/app-services/index.html)
* [Scopes and Collections](https://docs.couchbase.com/cloud/clusters/data-service/about-buckets-scopes-collections.html)
