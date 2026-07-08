---
# frontmatter
path: "/tutorial-looker-studio-dataapi"
# title and description do not need to be added to markdown, start with H2 (##)
title: Looker Studio with Couchbase Data API
short_title: Data API Connector
description:
  - Connect Google Looker Studio to Couchbase through the Data API
  - Configure auth, select collections or use custom SQL++ queries
  - Learn schema inference, limits, and troubleshooting tips
content_type: tutorial
filter: connectors
technology:
  - server
  - query
tags:
  - Looker Studio
  - Google Data Studio
  - Data API
  - Connector
sdk_language:
  - nodejs
length: 20 Mins
---

<!-- [abstract] -->

## Introduction

In this tutorial, you'll connect [Google Looker Studio](https://lookerstudio.google.com/) to Couchbase using the Couchbase Data API connector and build reports directly on live data in your cluster — with no ETL and no intermediate storage. You'll authenticate to your cluster, choose the data to visualize (either by selecting a `bucket.scope.collection` or by writing a custom [SQL++](https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/index.html) query), and let the connector infer your schema automatically so fields are ready to drop into charts and tables within minutes. The connector reaches your cluster through the [Couchbase Data API](https://docs.couchbase.com/server/current/rest-api/rest-intro.html) and runs your queries via the Query Service — all from within Looker Studio.

What you'll build: a live Looker Studio data source connected to a Couchbase collection, with fields inferred and ready to use in charts and tables.

## How to run this tutorial

This tutorial runs entirely in the Looker Studio web UI — there is nothing to install locally and no code to write. The only thing you need beforehand is access to a Couchbase cluster with the Data API enabled, covered in [Before you start](#before-you-start).

## Before you start

### Have a Google account

You need a Google account to sign in to [Looker Studio](https://lookerstudio.google.com/).

### Create and Deploy Your Free Tier Operational cluster on Capella

To get started with Couchbase Capella, create an account and use it to deploy a forever free tier operational cluster. This account provides you with an environment where you can explore and learn about Capella with no time constraint.

To know more, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/create-account.html).

#### Capella Configuration

- Create the [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the connector. The user also needs permission to query the system catalogs (`system:buckets`, `system:all_scopes`, `system:keyspaces`) and run `INFER` — these are used for collection discovery and schema inference.
- [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the cluster by adding `0.0.0.0/0` (allow all) under Settings → Networking → Allowed IP Addresses. Looker Studio runs on Google's servers with dynamic IP addresses, so a fixed range cannot be allowlisted.
- [Enable the Data API](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html#enable-the-data-api) on your cluster: go to Connect → Data API and click Enable Data API. Once enabled, copy your Data API endpoint — you'll need it during authentication.
- Load the travel-sample bucket: go to Data Tools → Import and import travel-sample. This is used in the [Build your first report](#build-your-first-report) section.

## Add the connector in Looker Studio

Once the prerequisites above are in place:

1. Open Looker Studio — go to [Looker Studio](https://lookerstudio.google.com/) and sign in.
2. Create or open a report — start a new report or open an existing one.
3. Add a data source — click Add data (or the + button).
4. Find the connector — search for "Couchbase Data API" in the connector gallery and select it.

Next, you'll authenticate and configure the data source.

## Authentication

When prompted, enter your credentials. Note that Looker Studio labels the endpoint field "Path" — this is your Couchbase Data API endpoint.

- Path — Your Data API endpoint. Copy it from Connect → Data API in the Capella UI.
- Username / Password — Your Couchbase database credentials.

Refer to the [Couchbase Data API documentation](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html) for details on locating your endpoint.

## Build your first report

After authenticating, you are taken to the configuration screen. Choose a mode and connect to your data.

### Mode: Query by Collection

Select a `bucket > scope > collection` from the dropdown — the connector discovers them automatically. Use this mode for quick exploration of a single collection.

For this example, select travel-sample → inventory → airline and leave Maximum Rows at the default (100), then click Connect and Add to Report.

<!-- screenshot: collection selector with travel-sample.inventory.airline selected -->

Once added, click Insert → Bar chart. In the Data panel on the right, set Dimension to `country` and leave Metric as `Record Count`. Looker Studio renders a bar chart of airlines grouped by country.

<!-- screenshot: resulting bar chart -->

Every time Looker Studio refreshes, it re-queries the collection live — no cache, no ETL.

### Mode: Use Custom Query

Use this mode to write your own [SQL++](https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/index.html) query. Paste any valid statement — include a `LIMIT` for performance. This gives you full control over filtering, joining, and aggregating before the data reaches Looker Studio.

For example, the same airline count pre-aggregated on the cluster:

```sql
SELECT country, COUNT(*) AS airline_count
FROM `travel-sample`.`inventory`.`airline`
GROUP BY country
ORDER BY airline_count DESC
LIMIT 20
```

Pre-aggregating in SQL++ is more efficient for large collections than pulling all rows into Looker Studio.

## Tips and Best Practices

- Prefer `Query by Collection` for quick starts and simpler schemas: Collection mode provides more predictable schema inference than custom queries.
- Always add a `LIMIT` when exploring with custom queries: Use `LIMIT 100-1000` for initial testing to ensure fast schema inference and data retrieval.
- Ensure your user has at least query and read access on the target collections and system catalogs for metadata discovery.
- For consistent schema inference: Structure your data with consistent field types across documents. Avoid mixing numbers and strings in the same field.
- Handle complex nested data: Consider flattening deeply nested objects in your SQL++ queries for better Looker Studio compatibility.
- Test schema inference separately: Use small LIMIT clauses first to verify schema detection before processing large datasets.

## Troubleshooting

### Authentication and Connection Issues
- Authentication error: Check host/port, credentials, and that the Data API is reachable from Looker Studio.
- Timeout or network errors: Verify network connectivity and firewall settings between Looker Studio and your Couchbase cluster.

### Schema Inference Problems
- Empty schema or no fields detected:
  - Ensure the collection contains documents and is not empty
  - For custom queries, verify the statement returns results and add appropriate `LIMIT` clauses
  - Check that your user has permissions to read the collection and execute queries

- INFER statement failures:
  - The connector first attempts `INFER collection` or `INFER (customQuery)` with sampling options
  - If INFER fails, it falls back to executing your query with `LIMIT 1` and inferring from a single document
  - INFER may fail on very large collections or complex queries - the fallback usually resolves this

- Fields appear as STRING when they should be NUMBER:
  - Your data has mixed types (some documents have numbers, others have strings) in the same field
  - The connector defaults to STRING for safety when types are inconsistent
  - Consider data cleanup or use SQL++ functions to cast types consistently

- Missing fields that exist in your data:
  - Schema inference is sample-based - fields present only in unsampled documents may not be detected
  - Try increasing the collection size or adjusting your query to ensure representative sampling
  - For custom queries, ensure your query includes all the fields you want to expose

- Nested fields not working correctly:
  - Very deep object hierarchies may not be fully expanded by the INFER process
  - Arrays of objects become stringified JSON instead of individual fields
  - Consider flattening complex structures in your SQL++ query for better field detection

- "No properties in any INFER flavors" error:
  - The INFER statement succeeded but found no recognizable field structures
  - This typically happens with collections containing only primitive values or very inconsistent document structures
  - Try a custom query that shapes the data into a more consistent structure

### Query and Data Issues
- Query errors from the service: Review the error text surfaced in Looker Studio; fix syntax, permissions, or keyspace names.
- Permission errors during schema inference: Ensure your user can execute INFER statements and read from system catalogs.
- Performance issues: Add appropriate `LIMIT` clauses and avoid very complex JOINs for better connector performance.

## Conclusion

You've connected Google Looker Studio to Couchbase using the Data API connector and built a live report on travel-sample data. For the connector source code and to report issues, see the [Couchbase Data API Looker Studio connector on GitHub](https://github.com/Couchbase-Ecosystem/couchbase-gcp-lookerstudio-connector).

