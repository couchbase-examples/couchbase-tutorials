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

## Data Retrieval

- Only the fields requested by Looker Studio are returned. Nested values are extracted using dot paths where possible.
- Row limits:
  - Collection mode: `Maximum Rows` controls the `LIMIT` (default 100).
  - Custom query mode: You control `LIMIT` inside your query.

## Tips and Best Practices

- Prefer `Query by Collection` for quick starts and simpler schemas.
- Always add a `LIMIT` when exploring with custom queries.
- Ensure your user has at least query and read access on the target collections.

## Troubleshooting

- Authentication error: Check host/port, credentials, and that the Data API is reachable from Looker Studio.
- Empty schema or no fields: Ensure the collection has data; for custom queries, verify the statement and add `LIMIT` to improve sampling.
- Query errors from the service: Review the error text surfaced in Looker Studio; fix syntax, permissions, or keyspace names.

## Next Steps

- Create charts and tables in Looker Studio from the exposed fields.
- Iterate on custom SQL++ queries to shape the dataset for your dashboards.


