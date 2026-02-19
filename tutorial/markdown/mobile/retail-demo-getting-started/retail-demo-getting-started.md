---
path: "/retail-demo-getting-started"
title: Getting Started with the Couchbase Lite Retail Demo
short_title: Getting Started
description:
  - Learn about the Couchbase Lite Retail Demo application architecture
  - Understand the offline-first approach with Couchbase Lite
  - Set up your development environment for iOS, Android, or Web
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
length: 15 Mins
exclude_tutorials: true
---

## Introduction

Welcome to the Couchbase Lite Retail Demo! This tutorial series will guide you through building and understanding a retail inventory management application that demonstrates Couchbase Lite's powerful features.

In this first tutorial, you will learn:

* The architecture of the retail demo application
* Key features including offline-first data storage, real-time sync, and peer-to-peer sync
* How to set up your development environment

## Application Overview

The Couchbase Lite Retail Demo is a multi-platform retail inventory management application built for:

* **iOS** (Swift/SwiftUI)
* **Android** (Kotlin/Jetpack Compose)
* **Web** (React/TypeScript)

### Key Features

| Feature | Description |
|---------|-------------|
| **Offline-First** | Full functionality without internet using Couchbase Lite as a local database |
| **Real-Time Sync** | Bidirectional sync with Couchbase Capella via App Services |
| **Peer-to-Peer Sync** | Direct device-to-device sync over local network (iOS & Android) |
| **Multi-Store Support** | Manage inventory across multiple retail locations |

### Architecture Diagram

The complete setup looks like this:

![App Setup Diagram](https://raw.githubusercontent.com/couchbase-examples/couchbase-lite-retail-demo/main/common/assets/app-setup.png)

The architecture consists of:

1. **Couchbase Capella** - Cloud database backend
2. **Capella App Services** - Synchronization layer that connects mobile/web clients to Capella
3. **Mobile/Web Clients** - iOS, Android, and Web applications with embedded Couchbase Lite

## Data Model

The application manages three main types of data:

### Collections

Each store scope contains three collections:

| Collection | Purpose | Example Document Count |
|------------|---------|----------------------|
| `inventory` | Product inventory items | ~80 per store |
| `orders` | Customer orders | ~150 per store |
| `profile` | Store profile information | 1 per store |

### Scopes

Data is organized by store using scopes:

* `AA-Store` - AA Supermarket location
* `NYC-Store` - NYC Supermarket location

### Sample Documents

**Inventory Document:**
```json
{
  "_id": "Inventory_NYCStore_10000",
  "docType": "Inventory",
  "productId": 10000,
  "sku": "NYC-10000",
  "name": "Organic Milk",
  "brand": "BudgetBest",
  "category": "Dairy",
  "price": 29.86,
  "unit": "gallon",
  "stockQty": 71,
  "location": {"aisle": 24, "bin": 7},
  "storeId": "nyc-store-01"
}
```

**Order Document:**
```json
{
  "_id": "order-nyc-store-01-V1StGXR8_Z5jdHi6B-myT",
  "docType": "Order",
  "storeId": "nyc-store-01",
  "orderDate": 1755257767451,
  "orderStatus": "Submitted",
  "productId": 10000,
  "sku": "NYC-10000",
  "unit": "gallon",
  "orderQty": 30
}
```

## Prerequisites

Before you begin, ensure you have the following:

### For All Platforms

* **Couchbase Capella Account** - Sign up for a [free trial](https://cloud.couchbase.com/)
* **curl** or similar HTTP client for testing

### For iOS Development

* **Xcode**: 16.4 or later
* **iOS SDK**: 18.5 or later
* **macOS**: Sonoma or later

### For Android Development

* **Android Studio**: Ladybug (2024.2.1) or later
* **JDK**: 17 or later
* **Android SDK**: Minimum 24, Target 35

### For Web Development

* **Node.js**: Version 18 or higher
* **npm**: Comes with Node.js

## Repository Structure

Clone the repository to get started:

```bash
git clone https://github.com/couchbase-examples/couchbase-lite-retail-demo.git
cd couchbase-lite-retail-demo
```

The repository is organized as follows:

```
couchbase-lite-retail-demo/
├── Android/          # Android app (Kotlin/Jetpack Compose)
├── iOS/              # iOS app (Swift/SwiftUI)
├── web/              # Web app (React/TypeScript)
├── common/           # Shared assets
│   └── assets/       # Images and diagrams
├── tutorials/        # Step-by-step tutorials
├── README.md         # Main project documentation
└── CONTRIBUTING.md   # Development guidelines
```

## Platform-Specific Setup

For detailed setup instructions specific to each platform, see the platform-specific READMEs in the [couchbase-lite-retail-demo repository](https://github.com/couchbase-examples/couchbase-lite-retail-demo):

* [Android README](https://github.com/couchbase-examples/couchbase-lite-retail-demo/blob/main/Android/README.md)
* [iOS README](https://github.com/couchbase-examples/couchbase-lite-retail-demo/blob/main/iOS/README.md)
* [Web README](https://github.com/couchbase-examples/couchbase-lite-retail-demo/blob/main/web/README.md)

## Learn More

### References

* [Couchbase Lite Documentation](https://docs.couchbase.com/couchbase-lite/current/index.html)
* [Couchbase Capella App Services](https://docs.couchbase.com/cloud/app-services/index.html)
* [Couchbase Capella Free Trial](https://cloud.couchbase.com/)
