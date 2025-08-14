---
# frontmatter
path: "/tutorial-looker-studio-columnar"
# title and description do not need to be added to markdown, start with H2 (##)
title: Looker Studio with Couchbase Columnar (Views-only)
short_title: Columnar (Views-only)
description:
  - Connect Google Looker Studio to Couchbase Columnar using views only
  - Create views in Capella and use them as stable, optimized datasets
  - Learn authentication, configuration, schema inference, and troubleshooting
content_type: tutorial
filter: connectors
technology:
  - server
  - query
tags:
  - Looker Studio
  - Couchbase Columnar
  - Connector
  - Views-only
sdk_language:
  - javascript
length: 20 Mins
---

<!-- [abstract] -->

## Overview

This is a views-only connector for Google Looker Studio and Couchbase Columnar. It exclusively accesses data through views in Couchbase Capella. Create one or more views first, then connect Looker Studio to those views for analysis.

The connector authenticates with Basic Auth to the Columnar API (`/api/v1/request`) and infers schema automatically using `array_infer_schema` so Looker Studio fields are created with reasonable types.

## Prerequisites

- A Couchbase Columnar deployment reachable from Looker Studio.
- A database user with permissions to read from the target Views/Collections and execute queries.
- Network access from Looker Studio to your Columnar host.

## Authentication

When adding the data source, provide:

- Path: The Columnar host (optionally with port). Examples:
  - Capella-style host: `cb.<your-host>.cloud.couchbase.com`
  - Self-managed: `my.host:18095` (port recommended if not 443)
- Username and Password: Database credentials.

The connector validates credentials by running a lightweight test query (`SELECT 1 AS test;`).

## Create Views in Capella (Required)

Before connecting, create views in Capella Columnar Workbench:

1. Open Capella, navigate to the Columnar tab, and launch the Workbench for your cluster.
2. Create a view using SQL++:

```sql
CREATE VIEW my_airports AS
SELECT airportname, city, country
FROM `travel-sample`.`inventory`.`airport`
WHERE country = 'United States';
```

- Replace names as needed. Views are stable datasets optimized for BI.
- For more, see the Couchbase docs on [Views and Tabular Views](https://docs.couchbase.com/columnar/sqlpp/5a_views.html) and on [Buckets, Scopes, and Collections](https://docs.couchbase.com/cloud/clusters/data-service/about-buckets-scopes-collections.html).

## Configuration

Choose your mode in the configuration screen:

- Configuration Mode: `By View` (views-only connector).

### Mode: By View

- Couchbase Database, Scope, View: Selected from dropdowns populated from metadata.
- Maximum Rows: Optional limit for returned rows; leave blank for no limit.

What runs:

- Data: `SELECT <requested fields or *> FROM \`database\`.\`scope\`.\`view\` [LIMIT n]`
- Schema: `SELECT array_infer_schema((SELECT VALUE t FROM \`database\`.\`scope\`.\`view\` [LIMIT n])) AS inferred_schema;`

> Note: This connector does not query collections directly and does not accept custom queries. It reads through views only.

## Schema and Field Types

- The connector converts inferred types to Looker types:
  - number → NUMBER (metric)
  - boolean → BOOLEAN (dimension)
  - string/objects/arrays/null → STRING/TEXT (dimension)
- Nested fields are flattened using dot and array index notation where possible (for example, `address.city`, `schedule[0].day`). Unstructured values may be stringified.

## Data Retrieval

- Only requested fields are projected. For nested fields, the connector fetches the required base fields and extracts values client-side.
- Row limits:
  - View mode: `Maximum Rows` controls `LIMIT` (blank = no limit).

## Tips and Best Practices

- Prefer views for BI tooling; they offer a stable, optimized interface.
- Keep datasets scoped and use `LIMIT` while exploring.

## Troubleshooting

- Authentication failure: Check host/port, credentials, and network reachability to Columnar.
- Schema inference errors: Ensure your entity or query returns rows; consider adding `LIMIT` for faster sampling.
- API error from Columnar: Review the response message surfaced in Looker Studio and verify entity names, permissions, and syntax.

## Future Scope (Prototype)

- Collections and custom query support are in prototype and not available in this views-only connector. As support expands, you’ll be able to query collections directly from Looker Studio in addition to views.

## Next Steps

- Build charts in Looker Studio using your View- or Collection-backed fields.
- Iterate on Views/queries to shape the dataset for analytics.


