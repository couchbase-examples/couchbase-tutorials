---
path: "/retail-demo-app-services-sync"
title: Real-Time Sync with Couchbase Capella App Services
short_title: App Services Sync
description:
  - Learn how Couchbase Lite syncs data with Capella App Services
  - Understand the replication architecture and configuration
  - Configure and test bidirectional sync in the retail demo
content_type: tutorial
filter: mobile
technology:
  - mobile
  - capella
  - app-services
tags:
  - Android
  - iOS
  - App Services
sdk_language:
  - kotlin
  - swift
length: 30 Mins
exclude_tutorials: true
---

## Introduction

In this tutorial, you will learn how the Couchbase Lite Retail Demo implements real-time data synchronization with Couchbase Capella App Services. This enables your inventory data to stay synchronized across all devices and the cloud backend.

You will learn:

* How Couchbase Lite replication works
* The sync flow for login, profile fetch, and continuous replication
* How to configure sync in the iOS, Android, and Web apps
* How to test and verify synchronization

## Prerequisites

Before starting this tutorial, ensure you have:

* Completed the [Capella Setup tutorial](/retail-demo-capella-setup)
* Your App Services Public Connection URL
* User credentials created in App Services
* The retail demo app built and running on your platform

## How Sync Works

### Replication Architecture

Couchbase Lite uses a **replicator** to synchronize data between the local database and a remote endpoint (App Services). The replicator supports:

| Mode | Description |
|------|-------------|
| **Push** | Send local changes to the server |
| **Pull** | Receive server changes locally |
| **Push and Pull** | Bidirectional synchronization |

### Sync Flow in the Retail Demo

When a user logs in, the app follows this sync flow:

```
1. User Login
   └── Authenticate with App Services endpoint

2. Profile Fetch (One-Shot Pull)
   └── Pull store profile document
   └── Update UI with store information

3. Continuous Replication (Push & Pull)
   └── Sync inventory collection
   └── Sync orders collection
   └── Real-time updates across all devices
```

## Understanding the Code

### iOS Implementation

In the iOS app, sync is managed by `AppServicesSyncManager.swift`:

```swift
// Configure the replicator
var config = ReplicatorConfiguration(target: URLEndpoint(url: syncURL))
config.continuous = true
config.replicatorType = .pushAndPull

// Add collections to sync
config.addCollections([inventoryCollection, ordersCollection, profileCollection])

// Set authentication
config.authenticator = BasicAuthenticator(username: username, password: password)

// Create and start replicator
let replicator = Replicator(config: config)
replicator.start()
```

Key configuration options:

| Property | Value | Description |
|----------|-------|-------------|
| `continuous` | `true` | Keeps replicating until stopped |
| `replicatorType` | `.pushAndPull` | Bidirectional sync |
| `authenticator` | `BasicAuthenticator` | Username/password auth |

### Android Implementation

In the Android app, sync is managed by `AppServicesSyncManager.kt`:

```kotlin
// Create endpoint
val endpoint = URLEndpoint(URI(syncUrl))

// Configure replicator
val config = ReplicatorConfiguration(endpoint)
    .addCollections(listOf(inventoryCollection, ordersCollection, profileCollection), null)
    .setType(ReplicatorType.PUSH_AND_PULL)
    .setContinuous(true)
    .setAuthenticator(BasicAuthenticator(username, password.toCharArray()))

// Create and start replicator
replicator = Replicator(config)
replicator.start()
```

### Web Implementation

The web app uses `couchbase-lite-js` for sync:

```typescript
// Configure replicator
const config = new ReplicatorConfiguration(database, new URLEndpoint(syncUrl));
config.continuous = true;
config.replicatorType = ReplicatorType.PUSH_AND_PULL;
config.authenticator = new BasicAuthenticator(username, password);

// Add collections
config.addCollections([inventoryCollection, ordersCollection, profileCollection]);

// Start replication
const replicator = new Replicator(config);
await replicator.start();
```

## Configuring Sync in the Apps

### iOS Configuration

1. Open `LiquorApp/Info.plist` or set environment variables:

```bash
export CBL_BASE_URL="wss://your-endpoint.apps.cloud.couchbase.com:4984"
export CBL_AA_DB="supermarket-aa"
export CBL_NYC_DB="supermarket-nyc"
export CBL_AA_USER="aa-store-01@supermarket.com"
export CBL_NYC_USER="nyc-store-01@supermarket.com"
export CBL_PASSWORD="P@ssword1"
```

2. The app reads these values in `AppConfig.swift` and uses them to configure the replicator.

### Android Configuration

1. Set environment variables before launching Android Studio:

```bash
export CBL_BASE_URL="wss://your-endpoint.apps.cloud.couchbase.com:4984"
export CBL_AA_DB="supermarket-aa"
export CBL_NYC_DB="supermarket-nyc"
export CBL_AA_USER="aa-store-01@supermarket.com"
export CBL_NYC_USER="nyc-store-01@supermarket.com"
export CBL_PASSWORD="P@ssword1"
```

2. Or add to `gradle.properties`:

```properties
CBL_BASE_URL=wss://your-endpoint.apps.cloud.couchbase.com:4984
CBL_AA_DB=supermarket-aa
CBL_NYC_DB=supermarket-nyc
```

### Web Configuration

1. Copy the environment example and edit:

```bash
cd web
cp .env.example .env
```

2. Set the sync URL in `.env`:

```env
VITE_APP_SERVICES_URL=wss://your-endpoint.apps.cloud.couchbase.com:4984/supermarket-nyc
```

## Try It Out

### Step 1: Start the App

1. Launch the retail demo app on your platform
2. The login screen should appear

### Step 2: Log In

Log in with your App Services credentials:

* **Email**: `nyc-store-01@supermarket.com`
* **Password**: `P@ssword1`

The app will:
1. Authenticate with App Services
2. Pull the store profile
3. Start continuous replication

### Step 3: View Inventory

Navigate to the Inventory screen. You should see items synced from your Capella cluster.

### Step 4: Make a Change

1. Select an inventory item
2. Update the stock quantity
3. Save the change

The change is:
1. Saved locally to Couchbase Lite
2. Pushed to App Services
3. Synced to Capella and other connected devices

### Step 5: Verify in Capella

1. Log into [Couchbase Capella](https://cloud.couchbase.com/)
2. Navigate to your cluster > Tools > Documents
3. Browse the `inventory` collection in the appropriate scope
4. Find your updated document and verify the change

## Testing Multi-Device Sync

To see real-time sync in action:

1. **Run two instances** of the app (different emulators, devices, or platforms)
2. **Log in as the same store** on both (e.g., `nyc-store-01@supermarket.com`)
3. **Update inventory** on one device
4. **Observe the change** appear on the other device

This demonstrates the continuous bidirectional sync capability.

## Handling Sync Status

The demo apps display sync status to help you understand what's happening:

| Status | Meaning |
|--------|---------|
| **Connecting** | Establishing connection to App Services |
| **Busy** | Actively syncing data |
| **Idle** | Connected, waiting for changes |
| **Offline** | No network connection (changes queued locally) |
| **Stopped** | Replication manually stopped |

### Monitoring Sync Events

In the code, you can listen to replicator status changes:

```swift
// iOS
replicator.addChangeListener { change in
    print("Status: \(change.status.activity)")
    print("Progress: \(change.status.progress.completed)/\(change.status.progress.total)")
}
```

```kotlin
// Android
replicator.addChangeListener { change ->
    Log.d("Sync", "Status: ${change.status.activityLevel}")
    Log.d("Sync", "Progress: ${change.status.progress.completed}/${change.status.progress.total}")
}
```

## Conflict Resolution

When the same document is modified on multiple devices before syncing, a conflict occurs. Couchbase Lite provides automatic conflict resolution:

* **Default**: Last-write-wins based on revision history
* **Custom**: You can implement custom conflict resolvers

For the retail demo, the default conflict resolution is used. Learn more in the [conflict handling documentation](https://docs.couchbase.com/couchbase-lite/current/swift/conflict.html).

## Troubleshooting

### Sync Not Starting

* Verify your `CBL_BASE_URL` includes `wss://` protocol
* Check that credentials match those in App Services
* Ensure App Services endpoint is running

### Authentication Failures

* Verify username format: `store-id@supermarket.com`
* Check password matches exactly (case-sensitive)
* Confirm user exists in the correct App Endpoint

### Data Not Appearing

* Verify collections are linked in your App Endpoint
* Check that data was imported into the correct scope
* Look for errors in app console/logs

### Connection Timeouts

* Check network connectivity
* Verify App Services URL is accessible
* Try pinging the endpoint from your development machine

## Exercise: Create and Sync an Order

1. Log into the app as `nyc-store-01@supermarket.com`
2. Navigate to an inventory item
3. Create a new order for that item
4. Open Capella and navigate to the `orders` collection
5. Verify the new order document appears
6. Change the order status in Capella to "Processing"
7. Return to the app and verify the status update synced

## Learn More

### References

* [Couchbase Lite Replication](https://docs.couchbase.com/couchbase-lite/current/swift/replication.html)
* [App Services Documentation](https://docs.couchbase.com/cloud/app-services/index.html)
* [Conflict Resolution](https://docs.couchbase.com/couchbase-lite/current/swift/conflict.html)
* [Replicator Configuration](https://docs.couchbase.com/couchbase-lite/current/swift/replication.html#lbl-cfg-repl)
