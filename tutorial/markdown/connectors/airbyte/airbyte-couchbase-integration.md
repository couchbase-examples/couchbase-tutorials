---
path: "/tutorial-airbyte-couchbase"
title: Using Airbyte with Couchbase as Source and Destination
short_title: Airbyte Integration
description:
  - Learn to configure Airbyte with Couchbase as both source and destination
  - Understand sync modes and data replication strategies
  - Set up bidirectional data pipelines with Couchbase
content_type: tutorial
filter: connectors
technology:
  - server
  - query
tags:
  - Airbyte
  - Connector
  - Data Ingestion
  - Best Practices
sdk_language:
  - python
length: 35 Mins
---

## Overview

Airbyte is an open-source data integration platform that enables you to move data between various sources and destinations. With Airbyte's Couchbase connectors, you can use Couchbase as both a data source and destination, enabling powerful data integration scenarios including:

- **Cross-bucket replication**: Sync data between buckets within the same or different Couchbase clusters
- **Analytics pipelines**: Extract data from Couchbase to data warehouses or analytics platforms
- **Data ingestion**: Load data from SaaS applications, databases, or APIs into Couchbase
- **Change data capture**: Track and replicate document changes with periodic syncs

> **Note**: Airbyte is designed for batch/periodic data synchronization (typically 5-60 minute intervals), not sub-second real-time change tracking. For true real-time CDC, consider Couchbase's built-in XDCR or Eventing services.

This tutorial will guide you through setting up Airbyte with Couchbase Capella (cloud-hosted) as both source and destination, covering configuration, sync modes, common patterns, and best practices.

### What You'll Learn

- How to configure Couchbase as an Airbyte source
- How to configure Couchbase as an Airbyte destination
- Understanding different sync modes and when to use them
- Creating and managing data pipelines
- Performance optimization and troubleshooting

### About the Connectors

**Couchbase Source Connector**:
- Version: 0.1.8 (Community support)
- Minimum Couchbase version: 7.0+
- Supported sync modes: Full Refresh, Incremental (Append)
- Change tracking: Based on document `last_modified` xattr

**Couchbase Destination Connector**:
- Version: 0.1.9 (Community support)
- Minimum Couchbase version: 7.0+
- Supported sync modes: Overwrite, Append, Append Dedup
- Document handling: Automatic collection creation and indexing

## Prerequisites

Before starting this tutorial, ensure you have:

### Couchbase Capella Setup

1. **Active Capella Account**: Sign up at [cloud.couchbase.com](https://cloud.couchbase.com) if you don't have an account
2. **Running Cluster**: At least one operational cluster
3. **Bucket Created**: One or more buckets with scopes and collections
4. **Database User**: Users with appropriate permissions:
   - **For Source**: Data Reader, Query Select roles
   - **For Destination**: Data Reader, Data Writer, Query Manager roles
5. **Network Access**: IP allowlist configured (we'll cover this in setup)

### Airbyte Setup

You'll need access to one of the following:

- **Airbyte Cloud**: Managed service at [cloud.airbyte.com](https://cloud.airbyte.com) (recommended for beginners)
- **Airbyte Open Source**: Self-hosted instance following the [Airbyte deployment guide](https://docs.airbyte.com/deploying-airbyte/)

### Network Requirements

- Network connectivity between Airbyte and your Couchbase cluster
- For Capella: Airbyte's IP address(es) added to the allowlist
- Ports: 11207 (for couchbases://) or 11210 (for couchbase://)

### Knowledge Prerequisites

This tutorial assumes you have:

- Basic familiarity with Couchbase concepts (buckets, scopes, collections)
- Understanding of JSON data structures
- Basic knowledge of data synchronization concepts
- Access to the Airbyte user interface

## Part 1: Configuring Couchbase as a Source

The Couchbase source connector allows Airbyte to extract data from your Couchbase buckets. It automatically discovers all collections within a bucket and creates individual streams for each.

> **What is a stream?** In Airbyte, a stream represents a single data source (in this case, a Couchbase collection) that can be synced to a destination. Each stream has its own schema, sync mode, and cursor configuration. Learn more in [Airbyte's documentation](https://docs.airbyte.com/understanding-airbyte/connections/).

### Step 1: Prepare Your Couchbase Source

#### Create a Database User

1. Log in to your Couchbase Capella console
2. Navigate to **Settings** → **Database Access**
3. Click **Create Database Access**
4. Configure the user:
   - **Username**: `airbyte_source_user` (or your preferred name)
   - **Password**: Generate a secure password
   - **Bucket Access**: Select the source bucket
   - **Permissions**: Assign "Data Reader" and "Query Select" roles
5. Save the credentials securely

#### Configure Network Access

1. In Capella, go to **Settings** → **Allowed IP Addresses**
2. Click **Add Allowed IP**
3. Add your Airbyte instance IP address:
   - For Airbyte Cloud: Check [Airbyte's IP addresses documentation](https://docs.airbyte.com/cloud/getting-started-with-airbyte-cloud#allowlist-ip-addresses)
   - For self-hosted: Add your Airbyte server's public IP
4. Save the configuration

#### Get Your Connection String

1. In Capella, navigate to your cluster
2. Click **Connect**
3. Copy the connection string (format: `couchbases://cb.xxxxxx.cloud.couchbase.com`)
4. Keep this handy for the next step

### Step 2: Configure the Source in Airbyte

1. In Airbyte, click **Sources** in the left navigation
2. Click **+ New Source**
3. Search for "Couchbase" in the connector list
4. Select **Couchbase** from the results

Fill in the configuration:

**Source Name**: Give it a descriptive name (e.g., "Couchbase Production")

**Connection String**: Your Capella endpoint
```
couchbases://cb.xxxxxx.cloud.couchbase.com
```

**Username**: Your database user (e.g., `airbyte_source_user`)

**Password**: Your database user's password

**Bucket**: The bucket name to sync from (e.g., `travel-sample`)

**Start Date** (Optional): For incremental syncs, specify a starting point
```
2025-01-01T00:00:00Z
```
- Use ISO 8601 format
- Only documents modified after this date will be included in the first sync
- Leave empty to sync all documents initially

5. Click **Set up source**

Airbyte will now test the connection and discover available streams.

### Step 3: Understanding Stream Discovery

After successful connection, Airbyte discovers all collections in your bucket and creates a stream for each.

**Stream Naming Convention**: `bucket.scope.collection`

Example streams from a `travel-sample` bucket:
- `travel-sample.inventory.airline`
- `travel-sample.inventory.airport`
- `travel-sample.inventory.hotel`
- `travel-sample.inventory.route`

**Stream Schema**: Each stream includes:

```json
{
  "_id": "string",              // Document key
  "_ab_cdc_updated_at": "integer",  // Modification timestamp (for incremental sync)
  "bucket": {                   // Bucket name
    // Original document fields
  }
}
```

### Understanding Source Sync Modes

The Couchbase source connector supports two sync modes:

#### Full Refresh

Syncs all documents from the collection every time.

**How it works**:
```sql
SELECT META().id as _id,
       TO_NUMBER(meta().xattrs.$document.last_modified) as _ab_cdc_updated_at,
       c AS `bucket`
FROM `bucket`.`scope`.`collection` AS c
```

**When to use**:
- Small collections that change frequently
- When you need a complete snapshot every time
- When incremental tracking is not required

**Performance note**: Transfers all data on each sync, regardless of changes

#### Incremental (Append)

Syncs only new or modified documents since the last sync.

**How it works**:
- Uses the `_ab_cdc_updated_at` cursor field
- Tracks the last synced timestamp
- Queries only documents modified after that timestamp

```sql
SELECT META().id as _id,
       TO_NUMBER(meta().xattrs.$document.last_modified) as _ab_cdc_updated_at,
       c AS `bucket`
FROM `bucket`.`scope`.`collection` AS c
WHERE TO_NUMBER(meta().xattrs.$document.last_modified) > {last_cursor_value}
ORDER BY TO_NUMBER(meta().xattrs.$document.last_modified) ASC
```

**When to use**:
- Large collections
- When you want to reduce data transfer
- When tracking changes over time

**Requirements**:
- Couchbase automatically maintains the `last_modified` xattr on all documents
- Primary index on the collection (created automatically by the connector)

### Important Notes About the Source Connector

**Index Creation**: The connector automatically creates primary indexes on collections. For large collections, this may take time on the first run.

**Performance**: Consider creating custom secondary indexes for better query performance on large collections.

**Change Detection**: The connector uses Couchbase's built-in `last_modified` xattr, which is automatically maintained by the server.

## Part 2: Configuring Couchbase as a Destination

The Couchbase destination connector allows Airbyte to load data into your Couchbase buckets from various sources.

### Step 1: Prepare Your Couchbase Destination

#### Create a Database User

1. In Couchbase Capella, navigate to **Settings** → **Database Access**
2. Click **Create Database Access**
3. Configure the user:
   - **Username**: `airbyte_dest_user` (or your preferred name)
   - **Password**: Generate a secure password
   - **Bucket Access**: Select the destination bucket
   - **Permissions**: Assign "Data Reader", "Data Writer", and "Query Manager" roles
4. Save the credentials

**Note**: Query Manager role is required for automatic collection and index creation. These Database Access credentials are used for cluster connections via the SDK, distinct from Capella API credentials which would be used for Capella management operations.

#### Ensure Network Access

If using the same cluster as your source, network access is already configured. Otherwise, follow the same IP allowlisting steps from Part 1.

### Step 2: Configure the Destination in Airbyte

1. In Airbyte, click **Destinations** in the left navigation
2. Click **+ New Destination**
3. Search for "Couchbase"
4. Select **Couchbase** from the results

Fill in the configuration:

**Destination Name**: Descriptive name (e.g., "Couchbase Analytics")

**Connection String**: Your Capella endpoint
```
couchbases://cb.xxxxxx.cloud.couchbase.com
```

**Username**: Your destination database user (e.g., `airbyte_dest_user`)

**Password**: Your destination database user's password

**Bucket**: The destination bucket name (e.g., `analytics`)

**Scope** (Optional): Scope name, defaults to `_default`
```
_default
```

5. Click **Set up destination**

Airbyte will test the connection by creating a temporary collection and performing a test write.

### Step 3: Understanding Destination Sync Modes

The Couchbase destination connector supports three sync modes:

#### Overwrite

Clears the destination collection before each sync and replaces with new data.

**How it works**:
1. Deletes all existing documents: `DELETE FROM bucket.scope.collection`
2. Inserts new documents from the sync

**Document ID format**:
- If primary key is set: `{stream_name}::{primary_key_value}`
- If no primary key: `{stream_name}::{uuid4()}`

**When to use**:
- When the destination should mirror the source exactly
- For small datasets
- When historical data is not needed

**Warning**: All existing data in the collection is deleted on each sync!

#### Append

Adds all synced records as new documents, never updating existing ones.

**How it works**:
- Always generates new UUID for each document
- Never overwrites existing documents

**Document ID format**: `{stream_name}::{uuid4()}`

**When to use**:
- When you need complete history of all syncs
- For audit trails
- When duplicate records are acceptable

**Note**: This mode will continuously grow your collection with every sync.

#### Append Dedup

Maintains unique records per primary key, updating existing documents when the same key is synced again.

**How it works**:
- Uses primary key to generate deterministic document IDs
- Upserts documents (insert if new, update if exists)

**Document ID format**: `{stream_name}::{primary_key_values_joined}`

Example with primary key `["id"]`:
- Document with `id=123` → Document ID: `airline::123`

**When to use**:
- When you want the latest version of each record (most common use case)
- For maintaining a live replica of source data
- When combined with incremental source sync

**Requirements**: Primary key must be configured in the connection settings.

### Understanding Document Structure

All documents written to Couchbase by Airbyte follow this structure:

```json
{
  "id": "stream_name::key_value",
  "type": "airbyte_record",
  "stream": "source_stream_name",
  "emitted_at": 1642526400000,
  "data": {
    // Original record data from source
  },
  "_ab_sync_mode": "append_dedup",
  "namespace": "optional_namespace"
}
```

**Fields Explained**:
- `id`: Composite document ID (based on sync mode and primary key)
- `type`: Always "airbyte_record"
- `stream`: Name of the source stream
- `emitted_at`: Unix timestamp (milliseconds) when record was synced
- `data`: The actual record data from the source
- `_ab_sync_mode`: Which sync mode was used
- `namespace`: Optional logical grouping

### Collection Management

**Automatic Collection Creation**: If a collection doesn't exist, the connector creates it automatically.

**Collection Naming**: Stream names are sanitized:
- Invalid characters replaced with underscores
- Must start with a letter
- Maximum 251 characters

**Primary Index Creation**: The connector automatically creates primary indexes on collections with retry logic and exponential backoff.

## Part 3: Creating Connections

Now that you've configured both source and destination, let's create a connection to sync data.

### Step 1: Create a New Connection

1. In Airbyte, click **Connections** in the left navigation
2. Click **+ New Connection**
3. **Select Source**: Choose your Couchbase source (or any other configured source)
4. **Select Destination**: Choose your Couchbase destination (or any other configured destination)
5. Click **Set up connection**

### Step 2: Configure Streams

Airbyte displays all discovered streams from your source. For each stream:

#### Enable/Disable Streams

- Toggle the checkbox next to each stream
- Only enabled streams will be synced
- Start with a small test stream to verify configuration

#### Choose Sync Mode

For each enabled stream, select the appropriate sync mode combination:

**Sync Mode Matrix**:

| Source Mode | Destination Mode | Result | Use Case |
|------------|------------------|--------|----------|
| Full Refresh | Overwrite | Complete replacement each sync | Mirror source exactly |
| Full Refresh | Append | Multiple complete snapshots | Historical snapshots |
| Incremental | Append | All changes tracked | Complete audit trail |
| Incremental | Append Dedup | Current state maintained | Live replica |

#### Configure Cursor Field

For incremental syncs:
- **Cursor Field**: Automatically set to `_ab_cdc_updated_at`
- This field tracks when documents were last modified
- Do not change this unless you have a custom cursor field

#### Set Primary Key

Primary keys are required for "Append Dedup" destination mode:

**Single Field Primary Key**:
```
[["_id"]]
```

**Composite Primary Key** (multiple fields):
```
[["country"], ["city"]]
```

**For Couchbase → Couchbase**:
- Use `_id` as primary key to maintain document key consistency
- Or use business keys from your data model

**Example Configuration**:
- Stream: `travel-sample.inventory.airline`
- Sync Mode: Incremental | Append Dedup
- Cursor: `_ab_cdc_updated_at`
- Primary Key: `[["_id"]]`

### Step 3: Configure Sync Schedule

Choose when syncs should run:

#### Manual
- Syncs only when manually triggered
- Good for testing and one-time migrations

#### Scheduled (Cron)
Custom cron expression:
```
0 */4 * * *    # Every 4 hours
0 2 * * *      # Daily at 2 AM
0 0 * * 0      # Weekly on Sunday
```

#### Basic Schedule
Predefined intervals:
- Every hour
- Every 6 hours
- Every 12 hours
- Every 24 hours

### Step 4: Advanced Configuration

**Connection Name**: Give your connection a descriptive name
```
Production to Analytics - Incremental Sync
```

**Namespace Configuration**:
- **Source namespace**: Destination uses source-defined namespace
- **Custom format**: Define your own namespace pattern
- **Destination default**: Use destination's default namespace

**Namespace Example**:
```
source_namespace: inventory
destination: analytics bucket, inventory scope
```

**Normalization**: Not supported for Couchbase destination

**Data Transformation**: dbt transformations not available for Couchbase destination

### Step 5: Test and Activate

1. Review your configuration summary
2. Click **Test connection** to verify settings
3. Once successful, click **Set up connection**
4. The connection is now created but not yet run

### Step 6: Run Your First Sync

#### Manual Trigger

1. Navigate to your connection
2. Click **Sync now** button
3. Monitor the sync progress in real-time

**What Happens During First Sync**:
- For Full Refresh: All documents are extracted
- For Incremental: All documents are extracted (initial sync)
- Primary indexes are created on destination collections
- Data is written to destination in batches of 1000 documents

#### Monitor Sync Progress

Watch the sync job status:
- **Running**: Sync in progress
- **Succeeded**: Sync completed successfully
- **Failed**: Check logs for errors
- **Cancelled**: Manually stopped

**Sync Statistics**:
- Records synced
- Data volume
- Sync duration
- Records committed

#### Verify Data in Couchbase

After the sync completes:

1. Open Couchbase Capella console
2. Navigate to **Data Tools** → **Documents**
3. Select your destination bucket and scope
4. Browse the synced collections
5. Verify document structure and data

Example query to check synced data:
```sql
SELECT COUNT(*) as doc_count,
       MIN(emitted_at) as first_sync,
       MAX(emitted_at) as last_sync
FROM `analytics`.`_default`.`travel-sample.inventory.airline`
WHERE type = 'airbyte_record'
```

## Part 4: Common Integration Patterns

### Pattern 1: Couchbase to Couchbase (Cross-Bucket Replication)

**Use Case**: Replicate production data to a staging environment for testing and development without impacting production workload.

**Configuration**:

**Source**:
- Connection: `couchbases://production-cluster.cloud.couchbase.com`
- Bucket: `production`
- User: Read-only user

**Destination**:
- Connection: Same cluster or different cluster
- Bucket: `staging`
- Scope: `replicated`
- User: Read-write user

**Sync Mode**: Incremental | Append Dedup
**Primary Key**: `[["_id"]]`
**Schedule**: Every 30 minutes
**Cursor**: `_ab_cdc_updated_at`

**Benefits**:
- Safe testing and development environment
- Automatic propagation of changes
- Isolated workloads

**Example Stream Configuration**:
```
Stream: production.app.users
Destination Collection: staging.replicated.production_app_users
Sync Mode: Incremental | Append Dedup
Primary Key: [["_id"]]
```

**Query Pattern in Staging Bucket**:
```sql
-- Access the original data
SELECT data.*
FROM `staging`.`replicated`.`production_app_users`
WHERE type = 'airbyte_record'
```

### Pattern 2: Couchbase to Data Warehouse

**Use Case**: Extract Couchbase data to Snowflake, BigQuery, or Redshift for advanced analytics and BI tools.

**Configuration**:

**Source**:
- Connection: Couchbase Capella
- Bucket: `production`
- Collections: `users`, `orders`, `products`

**Destination**:
- Platform: Snowflake (or BigQuery, Redshift)
- Schema: `couchbase_analytics`

**Sync Mode**: Incremental | Append Dedup
**Schedule**: Every 1 hour
**Primary Key**: Business key (e.g., `[["data", "order_id"]]`)

**Benefits**:
- Enable business intelligence and cross-source analytics
- Centralized data warehousing
- Historical trend analysis

**Transformation Example** (dbt):
```sql
-- Flatten Airbyte structure to access original data
SELECT
  data:order_id::STRING as order_id,
  data:customer_id::STRING as customer_id,
  data:total::NUMBER as total,
  TO_TIMESTAMP(emitted_at / 1000) as synced_at
FROM {{ source('airbyte', 'production_app_orders') }}
WHERE type = 'airbyte_record'
```

### Pattern 3: SaaS/Database to Couchbase

**Use Case**: Ingest data from Salesforce, PostgreSQL, or APIs into Couchbase for operational applications.

**Example: PostgreSQL → Couchbase**

**Source**:
- Connection: PostgreSQL database
- Tables: `customers`, `transactions`

**Destination**:
- Connection: Couchbase Capella
- Bucket: `operational_data`
- Scope: `postgres_sync`

**Sync Mode**: Incremental | Append Dedup
**Primary Key**: `[["data", "id"]]` (from PostgreSQL primary key)
**Schedule**: Every 15 minutes

**Benefits**:
- Consolidate data from multiple sources
- Build unified customer profiles
- Enable real-time operational analytics

**Access Pattern in Couchbase**:
```sql
-- Create index for efficient queries
CREATE INDEX idx_customer_id
ON `operational_data`.`postgres_sync`.`customers`(data.customer_id)

-- Query synced data
SELECT data.*
FROM `operational_data`.`postgres_sync`.`customers`
WHERE data.customer_id = $customer_id
  AND type = 'airbyte_record'
```

### Pattern 4: Multi-Environment Sync

**Use Case**: Keep development/staging environments synchronized with production data.

**Configuration**:

**Source**:
- Connection: Production Capella cluster
- Bucket: `production`

**Destination**:
- Connection: Staging cluster (or local Couchbase Server)
- Bucket: `staging`

**Sync Mode**: Full Refresh | Overwrite
**Schedule**: Daily at 2 AM
**Data Masking**: Consider using Airbyte transformations for PII

**Benefits**:
- Realistic test data in lower environments
- Reproduce production issues
- Safe environment for development

**Security Note**: Implement data masking for sensitive fields:
> Consider using Airbyte's transformation capabilities or custom dbt models
> to mask PII (Personally Identifiable Information, such as names, emails, SSNs) before syncing to non-production environments.

## Performance and Best Practices

### Source Performance Optimization

#### 1. Index Strategy

**Pre-create Indexes**: For large collections, create indexes before the first sync to avoid timeout issues.

```sql
-- Create primary index explicitly
CREATE PRIMARY INDEX ON `bucket`.`scope`.`collection`

-- Or create optimized secondary index
CREATE INDEX idx_last_modified
ON `bucket`.`scope`.`collection`(TO_NUMBER(meta().xattrs.$document.last_modified))
```

#### 2. Incremental vs Full Refresh

**Use Incremental When**:
- Collections have > 10,000 documents
- Changes are less than 20% of total data
- Network bandwidth is limited

**Use Full Refresh When**:
- Collections are small (< 5,000 documents)
- Most documents change frequently
- You need guaranteed consistency

#### 3. Start Date Configuration

For the initial incremental sync, use start_date to limit the data window:

```json
{
  "start_date": "2025-01-01T00:00:00Z"
}
```

Benefits:
- Faster initial sync
- Reduced resource usage
- Can backfill historical data later if needed

### Destination Performance Optimization

#### 1. Batch Size Understanding

The destination connector uses a fixed batch size of 1000 documents.

**Implications**:
- Large batches = fewer network round trips
- Timeout: 2.5 seconds per document in batch
- For 1000 docs: 2500 second (41.6 minute) timeout

**Optimization**: Ensure your cluster has adequate resources during sync windows.

#### 2. Collection Pre-creation

For large initial syncs, pre-create collections and indexes:

```sql
-- Create collection via N1QL
CREATE COLLECTION `analytics`.`replicated`.`large_dataset`

-- Create primary index
CREATE PRIMARY INDEX ON `analytics`.`replicated`.`large_dataset`
```

Benefits:
- Avoids index build during sync
- Better control over index placement
- Predictable performance

#### 3. Sync Scheduling

**Off-Peak Scheduling**: Schedule large syncs during low-traffic periods.

```
# Daily full refresh at 2 AM
0 2 * * *

# Incremental sync every 30 minutes during business hours
*/30 9-17 * * MON-FRI
```

**Parallel Syncs**: Airbyte can sync multiple streams in parallel. Monitor cluster resources:
- CPU utilization
- Memory usage
- Disk I/O
- Network throughput

### Network Optimization

#### 1. Use TLS Connections

Always use `couchbases://` for production:
- Data encrypted in transit
- Required for Capella
- Minimal performance overhead

#### 2. Regional Placement

**For Airbyte Cloud**:
- Choose the Airbyte region closest to your Capella cluster
- Reduces latency and data transfer costs

**For Self-Hosted Airbyte**:
- Deploy in the same cloud region as Capella
- Use private endpoints if available

#### 3. Connection Pooling

The connector uses these timeout settings:
```python
from datetime import timedelta

ClusterTimeoutOptions(
    kv_timeout=timedelta(seconds=5),
    query_timeout=timedelta(seconds=10)
)
```

If you experience timeouts, consider:
- Scaling up Capella cluster
- Reducing sync frequency
- Enabling fewer streams per connection

### Capella-Specific Optimizations

#### 1. Cluster Sizing

**Minimum Recommendations**:
- **Source**: 2 nodes (4 vCPU, 16 GB RAM each)
- **Destination**: 3 nodes (4 vCPU, 16 GB RAM each) for write-heavy workloads

**Scale Up For**:
- > 1 million documents per sync
- < 5 minute sync intervals
- Multiple concurrent connections

#### 2. Bucket Configuration

**Replicas**: Consider replica count for destination buckets
- Production: 2 replicas
- Analytics: 1 replica (acceptable for non-critical data)

**Compression**: Enable compression for large documents
- Reduces storage costs
- Minimal CPU overhead

#### 3. Monitoring Metrics

Track these Capella metrics during syncs:
- Operations per second (ops/sec)
- Disk write queue
- Memory usage percentage
- Network bytes in/out

Set up alerts for:
- CPU > 80%
- Memory > 85%
- Disk queue > 100 items

### Cost Optimization

#### 1. Data Transfer

**For Capella**:
- Incremental syncs reduce data transfer charges
- Same-region syncs minimize egress costs
- Use compression when possible

#### 2. Storage

**Append vs Append Dedup**:
- Append mode grows storage linearly
- Append Dedup maintains constant size per unique record
- Plan for lifecycle policies

**Example Storage Impact**:
```
Initial: 1M documents × 1KB = 1 GB
After 100 syncs with Append: 100 GB
After 100 syncs with Append Dedup: 1 GB (same size)
```

#### 3. Compute

**Optimize Sync Frequency**:
- Not all data needs real-time replication
- Batch less critical syncs to hourly or daily
- Use incremental mode to reduce cluster load

### Security Best Practices

#### 1. Credential Management

**Database Users**:
- Create separate users for source and destination
- Use strong, unique passwords
- Rotate credentials quarterly

**Permissions**:
```
Source User:
- Data Reader (read documents)
- Query Select (run N1QL SELECT)

Destination User:
- Data Reader (verify existing data)
- Data Writer (insert/update documents)
- Query Manager (create collections and indexes)
```

#### 2. Network Security

**IP Allowlisting**:
- Restrict to specific Airbyte IPs only
- Regularly audit allowed IPs
- Remove unused entries

**Connection String**:
- Always use `couchbases://` (TLS encrypted)
- Never use `couchbase://` in production

#### 3. Data Privacy

**For Sensitive Data**:
- Use field-level encryption in Couchbase
- Consider data masking in non-production syncs
- Implement access logging and auditing

**Compliance Considerations**:
- GDPR: Ensure right to deletion is maintained
- HIPAA: Use appropriate network and encryption settings
- SOC 2: Enable audit logging on both Airbyte and Couchbase

### Data Quality Best Practices

#### 1. Schema Consistency

Maintain consistent field types across documents:
```json
// Good - consistent types
{"order_id": "12345", "total": 99.99}
{"order_id": "12346", "total": 149.99}

// Bad - inconsistent types
{"order_id": "12345", "total": 99.99}
{"order_id": 12346, "total": "149.99"}
```

#### 2. Primary Key Selection

**Good Primary Keys**:
- Immutable values (don't change over time)
- Unique across all documents
- Business-meaningful when possible

**Examples**:
- User documents: `user_id`
- Order documents: `order_id`
- Events: Composite key `[["user_id"], ["event_timestamp"]]`

**Avoid**:
- Auto-incrementing integers that may conflict
- Timestamps (not guaranteed unique)
- Fields that can be null

#### 3. Null Handling

The destination connector converts nulls to empty strings. Handle appropriately:

```sql
-- Query pattern to handle converted nulls
SELECT *
FROM `bucket`.`scope`.`collection`
WHERE data.optional_field IS NOT NULL
  AND data.optional_field != ''
```

#### 4. Date/Time Standardization

Use ISO 8601 format for all timestamps:
```json
{
  "created_at": "2025-01-15T14:30:00Z",
  "updated_at": "2025-01-20T09:15:30Z"
}
```

Benefits:
- Sortable
- Timezone-aware
- Widely compatible

## Monitoring and Troubleshooting

### Monitoring Your Syncs

#### Airbyte Dashboard

Monitor sync health in the Airbyte UI:

**Connection Status**:
- Navigate to your connection
- Check "Last Sync Status" badge
- Review sync history for patterns

**Key Metrics to Track**:
- **Success Rate**: Percentage of successful syncs
- **Sync Duration**: Track for performance degradation
- **Records Synced**: Verify expected data volume
- **Data Volume**: Monitor bandwidth usage

**Set Up Alerts**: Configure Airbyte notifications:
- Failed syncs
- Long-running syncs
- Schema changes detected

#### Couchbase Capella Monitoring

**During Active Syncs, Monitor**:

1. **Cluster Metrics** (Settings → Metrics):
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network throughput

2. **Bucket Statistics**:
   - Operations per second
   - Item count
   - Data size
   - Disk usage

3. **Query Performance** (Query → Workbench):
   ```sql
   -- Monitor recent Airbyte writes
   SELECT COUNT(*) as recent_writes,
          MAX(emitted_at) as last_sync
   FROM `bucket`.`scope`.`collection`
   WHERE emitted_at > (UNIX_MILLIS() - 3600000) -- Last hour
     AND type = 'airbyte_record'
   ```

### Common Issues and Solutions

#### Connection Issues

**Issue**: "Connection check failed: Unable to connect to cluster"

**Causes and Solutions**:

1. **IP Not Allowlisted**:
   ```
   Solution: Add Airbyte IP to Capella allowed IP addresses
   Path: Capella → Settings → Allowed IP Addresses
   ```

2. **Incorrect Connection String**:
   ```
   Verify format:
   ✓ couchbases://cb.xxxxx.cloud.couchbase.com
   ✗ https://cb.xxxxx.cloud.couchbase.com
   ✗ cb.xxxxx.cloud.couchbase.com
   ```

3. **Invalid Credentials**:
   ```
   Solution: Verify username and password
   Test: Try connecting via cbshell or SDK with same credentials
   ```

4. **Network Timeout**:
   ```
   Solution: Check firewall rules, VPN connections
   Test: Can Airbyte server reach Capella on port 11207?
   ```

**Issue**: "Bucket not found"

**Solutions**:
- Verify bucket name is spelled correctly (case-sensitive)
- Ensure bucket exists in the cluster
- Check user has permissions for the bucket
- Verify bucket is not paused or in error state

#### Source Connector Issues

**Issue**: "Primary index creation failed"

**Causes and Solutions**:

1. **Insufficient Permissions**:
   ```
   Required: Query Manager role
   Fix: Add role in Capella → Settings → Database Access
   ```

2. **Cluster Resource Constraints**:
   ```
   Solution: Scale up cluster or create index manually before sync

   Manual index creation:
   CREATE PRIMARY INDEX ON `bucket`.`scope`.`collection`
   ```

3. **Index Already Exists with Different Name**:
   ```
   Solution: Drop existing index or let connector use it

   Check existing indexes:
   SELECT * FROM system:indexes
   WHERE keyspace_id = 'collection'
   ```

**Issue**: "No streams discovered"

**Solutions**:
- Ensure bucket has scopes and collections (not just default)
- Verify collections contain documents
- Check user has read permissions
- Refresh source schema in Airbyte

**Issue**: "Incremental sync not detecting changes"

**Causes and Solutions**:

1. **Cursor State Issue**:
   ```
   Solution: Reset connection state in Airbyte
   Path: Connection Settings → Advanced → Reset Data
   ```

2. **Documents Not Actually Changing**:
   ```
   Verify: Check document's last_modified xattr

   SELECT META().xattrs.$document.last_modified
   FROM `bucket`.`scope`.`collection`
   LIMIT 1
   ```

3. **Clock Skew**:
   ```
   Ensure Airbyte server and Couchbase cluster times are synchronized
   ```

#### Destination Connector Issues

**Issue**: "Schema validation failed"

**Causes and Solutions**:

1. **Type Mismatch**:
   ```json
   // Source schema expects string, got number
   Expected: {"id": "123"}
   Actual: {"id": 123}

   Solution: Fix data types in source or use transformation
   ```

2. **Required Field Missing**:
   ```
   Solution: Ensure all required fields are present in source data
   Or: Make fields nullable in source schema
   ```

3. **Data Too Large**:
   ```
   Couchbase document limit: 20 MB
   Solution: Filter or transform large fields before syncing
   ```

**Issue**: "Collection creation failed"

**Solutions**:
- Verify user has Data Writer permissions
- Ensure scope exists (default: `_default`)
- Check bucket has available quota
- Verify collection name is valid (starts with letter, no special chars)

**Issue**: "Batch write timeout"

**Causes and Solutions**:

1. **Network Latency**:
   ```
   Solution: Move Airbyte closer to Couchbase cluster
   Measure: Ping times should be < 50ms
   ```

2. **Cluster Overloaded**:
   ```
   Solution: Scale up cluster or reduce sync frequency
   Monitor: CPU and memory in Capella dashboard
   ```

3. **Large Documents**:
   ```
   Batch timeout: 2.5 seconds × 1000 documents = 2500 seconds

   For documents > 100 KB:
   - Monitor sync duration
   - Consider data transformation to reduce size
   ```

**Issue**: "Duplicate key errors" (in Append Dedup mode)

**Causes and Solutions**:

1. **Primary Key Not Set**:
   ```
   Solution: Configure primary key in stream settings
   Recommended: [["_id"]] for Couchbase sources
   ```

2. **Primary Key Not Unique**:
   ```
   Problem: Multiple source records with same primary key
   Solution: Add additional fields to create composite key
   Example: [["customer_id"], ["order_date"]]
   ```

#### Sync Performance Issues

**Issue**: "Syncs are very slow"

**Solutions**:

1. **Use Incremental Instead of Full Refresh**:
   ```
   Performance gain: 80-95% for most use cases
   Switch: Connection → Stream Settings → Sync Mode
   ```

2. **Too Many Streams Enabled**:
   ```
   Solution: Disable unused streams
   Airbyte syncs enabled streams in parallel
   Start with critical streams, add more gradually
   ```

3. **Network Bottleneck**:
   ```
   Check: Airbyte and Couchbase in same region?
   Optimize: Use Capella private endpoints if available
   Monitor: Network throughput in both systems
   ```

4. **Source Cluster Underpowered**:
   ```
   Signs: High CPU during syncs, slow queries
   Solution: Scale up Capella cluster temporarily
   Consider: Off-peak sync scheduling
   ```

5. **Missing Indexes**:
   ```
   For large collections, create indexes before sync:

   CREATE INDEX idx_last_modified
   ON `bucket`.`scope`.`collection`(
       TO_NUMBER(meta().xattrs.$document.last_modified)
   )
   ```

**Issue**: "High memory usage during syncs"

**Solutions**:
- Reduce number of concurrent stream syncs
- Check document sizes (very large docs use more memory)
- Monitor Airbyte worker resources
- Consider splitting large collections

**Issue**: "Syncs fail intermittently"

**Causes and Solutions**:

1. **Network Instability**:
   ```
   Solution: Enable Airbyte retry logic (enabled by default)
   Monitor: Network error rates
   ```

2. **Cluster Maintenance Windows**:
   ```
   Solution: Avoid syncing during known maintenance windows
   Check: Capella maintenance schedule
   ```

3. **Rate Limiting**:
   ```
   For Capella Free Tier: Check quota limits
   Solution: Upgrade tier or reduce sync frequency
   ```

### Debugging Tips

#### 1. Enable Detailed Logging

In Airbyte:
- Navigate to failing sync job
- Click "View Logs"
- Look for ERROR and WARN level messages
- Check for stack traces

**Common Log Patterns**:
```
ERROR - Failed to connect: timeout
→ Network/connectivity issue

ERROR - Schema validation failed
→ Data type mismatch

WARN - Retrying batch write (attempt 2/3)
→ Temporary issue, may resolve itself
```

#### 2. Test Connectivity

Use Couchbase SDK or cbshell to test connection independently:

```bash
# Using cbshell
cbshell -c couchbases://cb.xxxxx.cloud.couchbase.com \
        -u username -p password
```

If this fails, the issue is with Couchbase access, not Airbyte.

#### 3. Verify Data Manually

After a sync, spot-check data in Couchbase:

```sql
-- Count synced records
SELECT COUNT(*) FROM `bucket`.`scope`.`collection`
WHERE type = 'airbyte_record'

-- View recent syncs
SELECT stream, emitted_at, data
FROM `bucket`.`scope`.`collection`
WHERE type = 'airbyte_record'
ORDER BY emitted_at DESC
LIMIT 10

-- Check for data quality issues
SELECT data.*
FROM `bucket`.`scope`.`collection`
WHERE type = 'airbyte_record'
  AND (data.required_field IS NULL OR data.required_field = '')
```

#### 4. Reset Connection State

If incremental sync is stuck or behaving incorrectly:

1. Navigate to Connection in Airbyte
2. Go to Settings → Advanced
3. Click "Reset Data"
4. Confirm the reset
5. Next sync will be a full refresh, then resume incrementally

**Warning**: This clears sync state and forces a complete re-sync.

#### 5. Check Couchbase System Tables

Query system tables for diagnostic info:

```sql
-- Check active queries (during sync)
SELECT * FROM system:active_requests
WHERE statement LIKE '%airbyte%'

-- View indexes on collections
SELECT name, state, keyspace_id
FROM system:indexes
WHERE keyspace_id IN (
    SELECT RAW name FROM system:keyspaces
)

-- Check bucket stats
SELECT * FROM system:buckets
```

### Getting Help

**Airbyte Community**:
- [Airbyte Slack Community](https://airbyte.com/community)
- [GitHub Issues](https://github.com/airbytehq/airbyte/issues)
- Tag: `connector: source-couchbase` or `connector: destination-couchbase`

**Couchbase Community**:
- [Couchbase Forums](https://forums.couchbase.com/)
- [Discord Server](https://discord.gg/couchbase)
- Category: Data Integration / ETL

**Enterprise Support**:
- Airbyte Cloud customers: In-app support chat
- Capella customers: Support portal at [support.couchbase.com](https://support.couchbase.com)

## Next Steps

Congratulations! You now have a solid understanding of using Airbyte with Couchbase. Here are some next steps to continue your journey:

### Expand Your Integration

1. **Add More Sources**:
   - Integrate SaaS applications (Salesforce, HubSpot, Stripe)
   - Connect databases (PostgreSQL, MySQL, MongoDB)
   - Ingest API data (REST, GraphQL)

2. **Add More Destinations**:
   - Data warehouses (Snowflake, BigQuery, Redshift)
   - Analytics platforms (Databricks, dbt Cloud)
   - Other databases for polyglot persistence

3. **Implement Transformations**:
   - Use dbt for data modeling (when using warehouse destinations)
   - Apply field-level transformations
   - Create aggregated views

### Advanced Patterns

1. **Multi-Hop Pipelines**:
   ```
   Source DB → Couchbase → Data Warehouse
   (operational)  (cache)     (analytics)
   ```

2. **Fan-Out Pattern**:
   ```
   Couchbase Source → Multiple Destinations
   - Warehouse (analytics)
   - Elasticsearch (search)
   - S3 (archival)
   ```

3. **Fan-In Pattern**:
   ```
   Multiple Sources → Couchbase
   - Salesforce (CRM data)
   - PostgreSQL (transactional)
   - REST API (external)
   ```

### Operational Excellence

1. **Set Up Monitoring**:
   - Configure Airbyte webhook notifications
   - Create Capella alerts for resource usage
   - Build dashboards for sync metrics

2. **Implement CI/CD**:
   - Use Airbyte Terraform provider
   - Version control your connection configs
   - Automate deployment across environments

3. **Optimize Costs**:
   - Review sync schedules regularly
   - Disable unused connections
   - Monitor data transfer costs
   - Implement data lifecycle policies

### Learn More

**Airbyte Resources**:
- [Official Documentation](https://docs.airbyte.com/)
- [Connector Catalog](https://docs.airbyte.com/integrations/)
- [Airbyte API](https://reference.airbyte.com/reference/getting-started)
- [Tutorials and Guides](https://airbyte.com/tutorials)

**Couchbase Resources**:
- [Couchbase Capella Documentation](https://docs.couchbase.com/cloud/)
- [N1QL Query Language](https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/index.html)
- [SDK Documentation](https://docs.couchbase.com/sdk-api/index.html)
- [Couchbase Blog](https://blog.couchbase.com/)

**Community Tutorials**:
- [Airbyte Blog - Integration Patterns](https://airbyte.com/blog)
- [Couchbase Developer Portal](https://developer.couchbase.com/)

### Related Tutorials

- [Couchbase Query Fundamentals](https://docs.couchbase.com/tutorials/query-fundamentals.html)
- [Building Real-Time Applications with Couchbase](https://docs.couchbase.com/tutorials/real-time-apps.html)
- [Data Modeling Best Practices](https://docs.couchbase.com/tutorials/data-modeling.html)

### Sample Projects

Try these hands-on projects:

1. **Analytics Pipeline**:
   - Sync Couchbase operational data to BigQuery
   - Build dashboards in Looker or Tableau
   - Create scheduled reports

2. **Multi-Region Replication**:
   - Set up Airbyte in multiple regions
   - Replicate data between Capella clusters
   - Implement geo-distributed application patterns

3. **Data Lake Integration**:
   - Export Couchbase data to S3/GCS
   - Use Parquet format for analytics
   - Query with Athena/BigQuery

## Support

### Community Support

The Couchbase connectors for Airbyte are community-supported. For assistance:

**Airbyte**:
- [Slack Community](https://airbyte.com/community) - Real-time help
- [GitHub Issues](https://github.com/airbytehq/airbyte/issues) - Bug reports and feature requests
- [Community Forum](https://discuss.airbyte.io/) - Discussions and Q&A

**Couchbase**:
- [Forums](https://forums.couchbase.com/) - Community discussions
- [Discord](https://discord.gg/couchbase) - Real-time chat
- [Stack Overflow](https://stackoverflow.com/questions/tagged/couchbase) - Q&A

### Enterprise Support

**Airbyte Cloud**:
- Email support for all paid plans
- SLA-backed support for Enterprise customers
- Priority feature requests

**Couchbase Capella**:
- 24/7 support portal at [support.couchbase.com](https://support.couchbase.com)
- Phone and email support based on plan tier
- Technical Account Managers for Enterprise customers

### Contributing

Both Airbyte and Couchbase welcome contributions:

**Airbyte Connector Contributions**:
- Source code: [GitHub - source-couchbase](https://github.com/airbytehq/airbyte/tree/master/airbyte-integrations/connectors/source-couchbase)
- Source code: [GitHub - destination-couchbase](https://github.com/airbytehq/airbyte/tree/master/airbyte-integrations/connectors/destination-couchbase)
- [Contribution Guide](https://docs.airbyte.com/contributing-to-airbyte/)

**Improvements You Can Make**:
- Add support for certificate-based authentication
- Implement connection pooling configuration
- Add support for collection filtering
- Optimize batch size configuration
- Improve error messages

## Privacy Policy

This tutorial references external services. Please review the privacy policies:

- [Airbyte Privacy Policy](https://airbyte.com/privacy)
- [Couchbase Privacy Policy](https://www.couchbase.com/privacy-policy)

When using these services, you agree to their respective terms and privacy policies. Ensure your use of Airbyte with Couchbase complies with your organization's data governance and privacy requirements.

## Terms of Service

**Airbyte**:
- [Terms of Service](https://airbyte.com/terms)
- [Acceptable Use Policy](https://airbyte.com/acceptable-use-policy)

**Couchbase**:
- [Capella Terms of Service](https://www.couchbase.com/capella-terms-of-service)
- [Service Level Agreement](https://www.couchbase.com/capella-sla)

**Connector Licensing**:
The Couchbase connectors for Airbyte are distributed under the MIT License. See the [Airbyte License](https://github.com/airbytehq/airbyte/blob/master/LICENSE) for details.

## Legal

**Trademarks**:
- Couchbase, Couchbase Capella, and the Couchbase logo are registered trademarks of Couchbase, Inc.
- Airbyte and the Airbyte logo are trademarks of Airbyte, Inc.

**Disclaimer**:
This tutorial is provided for educational purposes. While we strive for accuracy, configurations and features may change. Always refer to official documentation for the most current information.

**Support Status**:
As of the publication date, the Couchbase source and destination connectors are at alpha maturity level with community support. They are not officially supported by Couchbase or Airbyte for production use. Use at your own discretion and thoroughly test before deploying to production environments.

---

**Tutorial Version**: 1.0
**Last Updated**: January 2025
**Couchbase Source Connector Version**: 0.1.8
**Couchbase Destination Connector Version**: 0.1.9
**Minimum Couchbase Version**: 7.0+

For questions, feedback, or contributions to this tutorial, please visit the [Couchbase Tutorials GitHub Repository](https://github.com/couchbase/couchbase-tutorials).
