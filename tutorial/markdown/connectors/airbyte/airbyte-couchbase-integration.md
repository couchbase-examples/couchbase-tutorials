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
- **Data ingestion**: Load data from SaaS applications, databases, or APIs into Couchbase
- **Change data capture**: Track and replicate document changes with periodic syncs

> **Note**: Airbyte is designed for batch/periodic data synchronization, not sub-second real-time change tracking. Sync intervals vary based on your Airbyte deployment type and plan. For true real-time CDC, consider Couchbase's built-in XDCR or Eventing services.

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
- Document handling: Automatic collection creation

## Prerequisites

Before starting this tutorial, ensure you have:

### Couchbase Capella Setup

1. **Active Capella Account**: Sign up at [cloud.couchbase.com](https://cloud.couchbase.com) if you don't have an account
2. **Running Cluster**: At least one operational cluster
3. **Bucket Created**: One or more buckets with scopes and collections
4. **Database User**: Users with appropriate permissions:
   - **For Source**: Read access
   - **For Destination**: Read/Write access
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
   - **Access**: Select "Read" access for the bucket
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

1. In Airbyte, go to **Sources** on the left sidebar.
2. Click **+ New Source**.
3. Search for **Couchbase** and select it.
4. Fill in the configuration fields:

   - **Source Name**: Give your source a descriptive name, e.g. `Couchbase Production`.
   - **Connection String**: Enter your Capella connection string, e.g.
     ```
     couchbases://cb.xxxxxx.cloud.couchbase.com
     ```
   - **Username**: Enter your database username (e.g., `airbyte_source_user`).
   - **Password**: Enter the corresponding password.
   - **Bucket**: Specify the source bucket name (e.g., `travel-sample`).
   - **Start Date** (Optional): For incremental syncs, provide a UTC date in ISO 8601 format (e.g.,
     ```
     2025-01-01T00:00:00Z
     ```
     )
     - Only documents modified after this date will be included in the first sync.
     - Leave empty to sync all documents.

5. Click **Set up source**.

Airbyte will test the connection and automatically discover available streams.

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

**When to use**:
- Large collections
- When you want to reduce data transfer
- When tracking changes over time

**Requirements**:
- Couchbase automatically maintains the `last_modified` xattr on all documents

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
   - **Access**: Select "Read/Write" access for the bucket
4. Save the credentials

**Note**: These Database Access credentials are used for cluster connections via the SDK, distinct from Capella API credentials which would be used for Capella management operations.

#### Ensure Network Access

If using the same cluster as your source, network access is already configured. Otherwise, follow the same IP allowlisting steps from Part 1.

### Step 2: Configure the Destination in Airbyte

1. In Airbyte, go to the **Destinations** tab in the left navigation.
2. Click **+ New Destination**.
3. Search for **Couchbase** and select it from the list.
4. Complete the destination configuration form:
   - **Destination Name**: Enter a descriptive name (e.g., `Couchbase Destination`).
   - **Connection String**: Enter your Capella endpoint, for example:
     ```
     couchbases://cb.xxxxxx.cloud.couchbase.com
     ```
   - **Username**: Enter your destination database username (e.g., `airbyte_dest_user`).
   - **Password**: Enter your destination database user's password.
   - **Bucket**: Specify the destination bucket name (e.g., `staging`).
   - **Scope** (Optional): Enter the scope name if needed (defaults to `_default`), for example:
     ```
     _default
     ```
5. Click **Set up destination** to save and test the connection.

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

> The `stream_name::` prefix ensures document ID uniqueness when multiple Airbyte streams write to the same Couchbase collection, preventing ID collisions between different source streams.
>
> **Example**: Without prefix, two streams with `id=123` would both create document `123` (collision). With prefix: `streamA::123` and `streamB::123` remain separate.

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
  "_airbyte_extracted_at": 1642526400000,
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
- `_airbyte_extracted_at`: Unix timestamp (milliseconds) when Airbyte extracted the record from source
- `data`: The actual record data from the source
- `_ab_sync_mode`: Which sync mode was used
- `namespace`: Optional logical grouping

### Collection Management

**Automatic Collection Creation**: If a collection doesn't exist, the connector creates it automatically.

**Collection Naming**: Stream names are sanitized:
- Invalid characters replaced with underscores
- Must start with a letter
- Maximum 251 characters

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
Production to Staging - Incremental Sync
```

**Namespace Configuration**:
- **Source namespace**: Destination uses source-defined namespace
- **Custom format**: Define your own namespace pattern
- **Destination default**: Use destination's default namespace

**Namespace Example**:
```
source_namespace: inventory
destination: staging bucket, inventory scope
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
- Data is written to destination in batches

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

## Part 4: Common Integration Patterns

### Pattern 1: Couchbase to Couchbase (Cross-Bucket Replication)

Use Airbyte to replicate data between different Couchbase buckets within the same cluster or across different clusters. This pattern is useful for creating staging environments, maintaining backup copies, or distributing data across geographic regions. Configure the source connector to read from one bucket and the destination connector to write to another bucket using appropriate sync modes based on your requirements.

### Pattern 2: External Sources to Couchbase (Data Ingestion)

Use Airbyte to consolidate data from multiple external sources into Couchbase. By centralizing data in Couchbase, you benefit from its flexible JSON document model, powerful N1QL query capabilities, and built-in full-text search. This pattern is ideal for building unified data platforms where Couchbase serves as your operational data store.

### Pattern 3: Couchbase to External Destinations (Data Export)

Use Airbyte to share Couchbase data with downstream systems for specialized workloads like reporting or archival. While Couchbase can handle most operational and analytical needs directly, this pattern enables integration with legacy systems or specialized tools that require data feeds from your Couchbase cluster.

## Performance and Best Practices

### Source Performance Optimization

#### 1. Incremental vs Full Refresh

**Use Incremental When**:
- Collections are large
- Changes are a small percentage of total data
- Network bandwidth is limited

**Use Full Refresh When**:
- Collections are small
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

#### 1. Collection Pre-creation

For large initial syncs, pre-create collections to avoid collection creation overhead during sync.

#### 2. Sync Scheduling

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

The connector uses configurable timeout settings for key-value and query operations.

If you experience timeouts, consider:
- Scaling up Capella cluster
- Reducing sync frequency

### Capella-Specific Optimizations

#### 1. Bucket Configuration

**Replicas**: Consider replica count for destination buckets
- Production: 2 replicas
- Staging: 1 replica (acceptable for non-critical data)

**Compression**: Enable compression for large documents
- Reduces storage costs
- Minimal CPU overhead

#### 3. Monitoring Metrics

Track these Capella metrics during syncs:
- Operations per second (ops/sec)
- Disk write queue
- Memory usage percentage
- Network bytes in/out

Set up alerts for high CPU, memory, and disk queue thresholds based on your cluster's normal operating levels.

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
Source User: Read access
Destination User: Read/Write access
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

The destination connector converts nulls to empty strings.

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

3. **Query Performance** (Query → Workbench): Monitor query execution times during sync periods

### Common Issues and Solutions

#### Connection Issues

**"Connection check failed"**: Verify IP is allowlisted in Capella, connection string format is correct (`couchbases://cb.xxxxx.cloud.couchbase.com`), and credentials are valid.

**"Network timeout"**: Check firewall rules and ensure Airbyte can reach Capella on port 11207.

#### Source Connector Issues

**"No streams discovered"**: Ensure bucket has collections with documents and user has read permissions.

**"Incremental sync not detecting changes"**: Reset connection state in Airbyte (Connection Settings → Advanced → Reset Data).

#### Destination Connector Issues

**"Collection creation failed"**: Verify user has Read/Write access and scope exists.

**"Batch write timeout"**: Scale up Capella cluster or reduce sync frequency.

#### Sync Performance Issues

**"Syncs are very slow"**: Switch to Incremental mode, disable unused streams, and ensure Airbyte and Capella are in the same region.

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

After a sync, spot-check data in Couchbase via the Capella console Documents browser.

#### 4. Reset Connection State

If incremental sync is stuck or behaving incorrectly:

1. Navigate to Connection in Airbyte
2. Go to Settings → Advanced
3. Click "Reset Data"
4. Confirm the reset
5. Next sync will be a full refresh, then resume incrementally

**Warning**: This clears sync state and forces a complete re-sync.

#### 5. Check Couchbase System Tables

Query system tables for diagnostic info via the Capella Query Workbench to check active queries during sync operations.

### Getting Help

**Airbyte Community**:
- [Airbyte Slack Community](https://airbyte.com/community)
- [GitHub Issues](https://github.com/airbytehq/airbyte/issues)
- Tag: `connector: source-couchbase` or `connector: destination-couchbase`

**Couchbase Community**:
- [Couchbase Forums](https://forums.couchbase.com/)
- [Discord Server](https://discord.gg/couchbase)
- Category: Data Integration / ETL

