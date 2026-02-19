---
path: "/retail-demo-peer-to-peer-sync"
title: Peer-to-Peer Sync Between Mobile Devices
short_title: Peer-to-Peer Sync
description:
  - Learn how Couchbase Lite enables direct device-to-device synchronization
  - Understand P2P sync architecture without requiring cloud connectivity
  - Configure and test peer-to-peer sync between iOS and Android devices
content_type: tutorial
filter: mobile
technology:
  - mobile
tags:
  - Android
  - iOS
  - P2P
sdk_language:
  - kotlin
  - swift
length: 30 Mins
exclude_tutorials: true
---

## Introduction

Peer-to-peer (P2P) sync is a powerful feature of Couchbase Lite Enterprise Edition that enables direct synchronization between devices on the same local network, without requiring cloud connectivity. This is particularly useful for:

* **Offline collaboration** - Employees can sync data even when internet is unavailable
* **Demo scenarios** - Showcase real-time sync between multiple devices
* **Reduced latency** - Direct device communication is faster than going through the cloud
* **Bandwidth savings** - Keep data local when cloud sync isn't needed

In this tutorial, you will learn:

* How P2P sync works in Couchbase Lite
* The listener and replicator architecture
* How to configure and test P2P sync between iOS and Android devices

## Prerequisites

* Couchbase Lite **Enterprise Edition** (P2P is not available in Community Edition)
* Two or more devices (iOS and/or Android)
* All devices connected to the **same Wi-Fi network**
* The retail demo app installed on each device

> **NOTE**: P2P sync is only available on iOS and Android. The web app does not support P2P sync.

## How P2P Sync Works

### Architecture

P2P sync uses a **listener/replicator** model:

```
Device A (Listener)              Device B (Replicator)
┌─────────────────────┐         ┌─────────────────────┐
│   Couchbase Lite    │◄───────►│   Couchbase Lite    │
│   + URL Listener    │   P2P   │   + Replicator      │
└─────────────────────┘  Sync   └─────────────────────┘
         ▲                               │
         │      Same Wi-Fi Network       │
         └───────────────────────────────┘
```

1. **Listener**: One device acts as a "server", exposing an endpoint on the local network
2. **Replicator**: Other devices connect to the listener's endpoint and sync data
3. **Discovery**: Devices use Bonjour/mDNS to discover each other automatically

### Peer Group ID

All devices that want to sync together use the same **Peer Group ID**. This ensures:

* Only devices in the same group discover each other
* Data isolation between different groups/stores

In the retail demo, the peer group ID is configured in the app settings.

## Understanding the Code

### iOS Implementation

The iOS app uses `GroceryMultipeerSyncManager.swift` for P2P sync:

**Starting the Listener:**
```swift
// Create listener configuration
let config = URLEndpointListenerConfiguration(collections: collections)
config.port = 4985
config.disableTLS = true  // For demo purposes; use TLS in production

// Create and start listener
listener = URLEndpointListener(config: config)
try listener.start()

// Advertise service via Bonjour
let service = NetService(domain: "local.", type: "_cblp2p._tcp.", name: peerGroupId, port: 4985)
service.publish()
```

**Connecting as Replicator:**
```swift
// Create endpoint URL from discovered peer
let endpoint = URLEndpoint(url: URL(string: "ws://\(peer.hostname):\(peer.port)/")!)

// Configure replicator
var config = ReplicatorConfiguration(target: endpoint)
config.addCollections(collections, config: nil)
config.continuous = true
config.replicatorType = .pushAndPull

// Start replication
let replicator = Replicator(config: config)
replicator.start()
```

### Android Implementation

The Android app uses `MultipeerSyncManager.kt`:

**Starting the Listener:**
```kotlin
// Create listener configuration
val config = URLEndpointListenerConfiguration(collections)
config.port = 4985
config.isTlsDisabled = true  // For demo purposes

// Create and start listener
listener = URLEndpointListener(config)
listener.start()

// Advertise via Network Service Discovery
val serviceInfo = NsdServiceInfo().apply {
    serviceName = peerGroupId
    serviceType = "_cblp2p._tcp."
    port = 4985
}
nsdManager.registerService(serviceInfo, NsdManager.PROTOCOL_DNS_SD, registrationListener)
```

**Discovering and Connecting:**
```kotlin
// Discover peers via NSD
nsdManager.discoverServices("_cblp2p._tcp.", NsdManager.PROTOCOL_DNS_SD, discoveryListener)

// When peer discovered, connect
val endpoint = URLEndpoint(URI("ws://${peer.host}:${peer.port}/"))
val config = ReplicatorConfiguration(endpoint)
    .addCollections(collections, null)
    .setType(ReplicatorType.PUSH_AND_PULL)
    .setContinuous(true)

replicator = Replicator(config)
replicator.start()
```

## Configuration

### Enabling P2P Sync

P2P sync is controlled by configuration flags in each app:

**iOS** (`AppConfig.swift`):
```swift
static let enableP2PSync = true
static let p2pPeerGroupId = "retail-demo-group"
```

**Android** (`AppConfig.kt`):
```kotlin
const val ENABLE_P2P_SYNC = true
const val P2P_PEER_GROUP_ID = "retail-demo-group"
```

### Important Settings

| Setting | Description | Value |
|---------|-------------|-------|
| `enableP2PSync` | Toggle P2P functionality | `true` / `false` |
| `p2pPeerGroupId` | Identifier for peer discovery | Must match across devices |
| `port` | Listener port number | Default: `4985` |

> **IMPORTANT**: The `p2pPeerGroupId` must be identical on all devices that should sync together.

## Try It Out

### Demo Video

Watch P2P sync in action between two Android devices and an iPhone:

![P2P Demo](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/P2P_demo_android-android-ios.mp4)

### Step-by-Step Testing

#### Step 1: Prepare Your Devices

1. Ensure all devices are connected to the **same Wi-Fi network**
2. Install the retail demo app on each device
3. Verify P2P sync is enabled in the app configuration

#### Step 2: Start the First Device (Listener)

1. Launch the app on Device A
2. Log in with store credentials
3. The app will automatically start the P2P listener
4. Note: The device is now advertising its presence on the network

#### Step 3: Connect Additional Devices

1. Launch the app on Device B (and C, etc.)
2. Log in with the same or compatible store credentials
3. The app will discover Device A automatically
4. Sync begins when the connection is established

#### Step 4: Test Synchronization

1. On **Device A**: Update an inventory item (e.g., change stock quantity)
2. On **Device B**: Observe the change appear within seconds
3. Reverse the test: Make a change on Device B and watch it sync to Device A

### Expected Behavior

When P2P sync is working correctly:

| Action | Result |
|--------|--------|
| Device comes online | Automatically discovers other peers |
| Data changes locally | Syncs to all connected peers |
| Device goes offline | Changes queue and sync when reconnected |
| Network changes | Automatic reconnection and re-discovery |

## Cross-Platform P2P

One powerful feature of the retail demo is **cross-platform P2P sync**:

* iOS devices can sync directly with Android devices
* All use the same Couchbase Lite protocol
* Data model is identical across platforms

### Testing iOS ↔ Android Sync

1. Start the retail demo on an **iOS device**
2. Start the retail demo on an **Android device**
3. Ensure both are on the same Wi-Fi network
4. Log in to both with the same store credentials
5. Make changes on one device and verify they appear on the other

## P2P vs App Services Sync

The retail demo supports both sync methods, which can be used independently or together:

| Feature | P2P Sync | App Services Sync |
|---------|----------|-------------------|
| **Connectivity** | Local network only | Internet required |
| **Latency** | Very low | Depends on network |
| **Offline support** | Yes (within LAN) | Yes (changes queued) |
| **Cloud backup** | No | Yes |
| **Cross-location** | No (same LAN only) | Yes |
| **Web support** | No | Yes |

### Combined Usage

When both are enabled:

1. P2P syncs data between nearby devices instantly
2. App Services syncs data to the cloud for backup and cross-location access
3. Changes flow through both channels

## Troubleshooting

### Devices Not Discovering Each Other

**Check network:**
* Verify all devices are on the same Wi-Fi network
* Some networks block mDNS/Bonjour traffic (common in corporate networks)
* Try using a mobile hotspot for testing

**Check configuration:**
* Verify `p2pPeerGroupId` is identical on all devices
* Ensure P2P sync is enabled in app configuration

**Check permissions:**
* iOS: Allow local network access when prompted
* Android: Ensure location permission is granted (required for NSD)

### P2P Sync Slow or Unreliable

* Check Wi-Fi signal strength on all devices
* Move devices closer together
* Reduce interference from other wireless devices

### Connection Drops Frequently

* Disable battery optimization for the app
* Keep the app in the foreground during testing
* Check for Wi-Fi power-saving settings

### Only One-Way Sync

* Verify `replicatorType` is set to `.pushAndPull`
* Check that both devices have write access to the collections

## Security Considerations

The demo disables TLS for simplicity, but in production you should:

1. **Enable TLS** on the listener
2. **Use authentication** for connections
3. **Restrict peer group IDs** to authorized groups

```swift
// Production configuration with TLS
let config = URLEndpointListenerConfiguration(collections: collections)
config.disableTLS = false
config.tlsIdentity = myTLSIdentity
config.authenticator = ListenerPasswordAuthenticator { username, password in
    // Validate credentials
    return username == validUsername && password == validPassword
}
```

## Enterprise Edition Requirement

P2P sync requires **Couchbase Lite Enterprise Edition**. If you're using Community Edition:

* P2P sync features will not be available
* The `URLEndpointListener` class is not included
* App Services sync still works normally

To use the Community Edition, you would need to:

1. Remove or comment out P2P-related code
2. Update dependencies to use Community Edition packages
3. Set `ENABLE_P2P_SYNC = false`

## Learn More

### References

* [Peer-to-Peer Sync Documentation](https://docs.couchbase.com/couchbase-lite/current/swift/p2psync.html)
* [URL Endpoint Listener](https://docs.couchbase.com/couchbase-lite/current/swift/p2psync-listener.html)
* [Network Service Discovery (Android)](https://developer.android.com/training/connect-devices-wirelessly/nsd)
* [Bonjour/mDNS (iOS)](https://developer.apple.com/bonjour/)

