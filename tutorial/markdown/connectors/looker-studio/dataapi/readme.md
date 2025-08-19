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

## Overview

Use this connector to build Looker Studio reports directly on Couchbase via the Data API. You can:

- Query by selecting a specific `bucket.scope.collection`.
- Or run a custom SQL++ query.

Behind the scenes, the connector authenticates with Basic Auth and talks to the Data API endpoints for caller identity checks and to the Query Service for SQL++ execution. Schema is inferred automatically from sampled data to make fields available in Looker Studio.

## Prerequisites

- A Couchbase Capella cluster or a self-managed cluster with the Query Service reachable from Looker Studio.
- A database user with permissions to read the target collections and run queries.
- Network access from Looker Studio to your cluster host.

## Authentication

When you add the data source in Looker Studio, you will be prompted for:

- Path: The cluster host (optionally with port). Examples:
  - Capella: `cb.<your-host>.cloud.couchbase.com`
  - Self-managed: `my.host:18095` (specify a non-443 port explicitly)
- Username and Password: Database credentials.

The connector validates credentials against the Data API (`/v1/callerIdentity`). If validation fails, verify host, port, credentials, and network access.

## Configuration

After authentication, choose a configuration mode:

- Configuration Mode: `Query by Collection` or `Use Custom Query`.

### Mode: Query by Collection

- Couchbase Collection: Pick a `bucket > scope > collection` from the dropdown. The connector discovers collections for you.
- Maximum Rows: Optional limit for returned rows (default 100).

What runs:

- Data: `SELECT RAW collection FROM \`bucket\`.\`scope\`.\`collection\` LIMIT <maxRows>`
- Schema: `INFER \`bucket\`.\`scope\`.\`collection\` WITH {"sample_size": 100, "num_sample_values": 3, "similarity_metric": 0.6}`

### Mode: Use Custom Query

- Custom SQL++ Query: Paste any valid SQL++ statement. Include a `LIMIT` for performance.

What runs:

- Schema inference first attempts to run `INFER` on your query (a `LIMIT 100` is added if absent): `INFER (<yourQuery>) WITH {"sample_size": 10000, "num_sample_values": 2, "similarity_metric": 0.1}`
- If that fails, it runs your query with `LIMIT 1` and infers the schema from one sample document.

## Schema and Field Types

- Fields are inferred from sampled data. Types map to Looker Studio as:
  - NUMBER → metric
  - BOOLEAN → dimension
  - STRING (default for text, objects, arrays) → dimension
- Nested fields use dot notation (for example, `address.city`). Arrays and objects not expanded become stringified values.
- If the collection has no documents or your query returns no rows, schema inference will fail.

> **⚠️ Schema Inference Limitations**: Field types are inferred from sampled data and may not capture all variations in your dataset. Common issues include:
> - **Mixed data types**: Fields containing both numbers and text will be typed as STRING
> - **Incomplete sampling**: Fields present only in unsampled documents may not be detected
> - **Array complexity**: Arrays of objects become stringified JSON rather than individual fields
> - **Nested object depth**: Very deep object hierarchies may not be fully expanded
> - **Empty or null values**: Fields with only null values may not be detected or may be typed incorrectly

## Data Retrieval

- Only the fields requested by Looker Studio are returned. Nested values are extracted using dot paths where possible.
- Row limits:
  - Collection mode: `Maximum Rows` controls the `LIMIT` (default 100).
  - Custom query mode: You control `LIMIT` inside your query.

## Tips and Best Practices

- **Prefer `Query by Collection` for quick starts and simpler schemas**: Collection mode provides more predictable schema inference than custom queries.
- **Always add a `LIMIT` when exploring with custom queries**: Use `LIMIT 100-1000` for initial testing to ensure fast schema inference and data retrieval.
- **Ensure your user has at least query and read access** on the target collections and system catalogs for metadata discovery.
- **For consistent schema inference**: Structure your data with consistent field types across documents. Avoid mixing numbers and strings in the same field.
- **Handle complex nested data**: Consider flattening deeply nested objects in your SQL++ queries for better Looker Studio compatibility.
- **Test schema inference separately**: Use small LIMIT clauses first to verify schema detection before processing large datasets.

## Troubleshooting

### Authentication and Connection Issues
- **Authentication error**: Check host/port, credentials, and that the Data API is reachable from Looker Studio.
- **Timeout or network errors**: Verify network connectivity and firewall settings between Looker Studio and your Couchbase cluster.

### Schema Inference Problems
- **Empty schema or no fields detected**: 
  - Ensure the collection contains documents and is not empty
  - For custom queries, verify the statement returns results and add appropriate `LIMIT` clauses
  - Check that your user has permissions to read the collection and execute queries
  
- **INFER statement failures**:
  - The connector first attempts `INFER collection` or `INFER (customQuery)` with sampling options
  - If INFER fails, it falls back to executing your query with `LIMIT 1` and inferring from a single document
  - INFER may fail on very large collections or complex queries - the fallback usually resolves this
  
- **Fields appear as STRING when they should be NUMBER**:
  - Your data has mixed types (some documents have numbers, others have strings) in the same field
  - The connector defaults to STRING for safety when types are inconsistent
  - Consider data cleanup or use SQL++ functions to cast types consistently
  
- **Missing fields that exist in your data**:
  - Schema inference is sample-based - fields present only in unsampled documents may not be detected
  - Try increasing the collection size or adjusting your query to ensure representative sampling
  - For custom queries, ensure your query includes all the fields you want to expose
  
- **Nested fields not working correctly**:
  - Very deep object hierarchies may not be fully expanded by the INFER process
  - Arrays of objects become stringified JSON instead of individual fields
  - Consider flattening complex structures in your SQL++ query for better field detection
  
- **"No properties in any INFER flavors" error**:
  - The INFER statement succeeded but found no recognizable field structures
  - This typically happens with collections containing only primitive values or very inconsistent document structures
  - Try a custom query that shapes the data into a more consistent structure

### Query and Data Issues  
- **Query errors from the service**: Review the error text surfaced in Looker Studio; fix syntax, permissions, or keyspace names.
- **Permission errors during schema inference**: Ensure your user can execute INFER statements and read from system catalogs.
- **Performance issues**: Add appropriate `LIMIT` clauses and avoid very complex JOINs for better connector performance.

## Next Steps

- Create charts and tables in Looker Studio from the exposed fields.
- Iterate on custom SQL++ queries to shape the dataset for your dashboards.


