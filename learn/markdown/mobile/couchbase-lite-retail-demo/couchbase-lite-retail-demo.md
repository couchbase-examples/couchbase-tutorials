---
path: "/learn/couchbase-lite-offline-first-retail"
title: Couchbase Lite and Offline First Retail Applications
short_title: Offline First with Couchbase Lite
description:
  - Learn how to build an offline-first retail inventory management application with Couchbase Lite
  - Set up a cloud backend with Couchbase Capella and configure App Services for real-time sync
  - Enable peer-to-peer sync between mobile devices without requiring cloud connectivity
content_type: learn
filter: mobile
technology:
  - mobile
  - capella
  - app-services
tags:
  - Android
  - iOS
  - App Services
  - P2P
tutorials:
  - offline-first-app-getting-started
  - retail-demo-capella-setup
  - retail-demo-app-services-sync
  - retail-demo-peer-to-peer-sync
related_paths:
  - /learn/android-kotlin-app-services
  - /learn/swift
sdk_language:
  - kotlin
  - swift
download_file: null
length: 1 Hour 45 Mins
---

Couchbase Mobile brings the power of NoSQL to the edge, combining Couchbase Lite (an embedded, offline-capable database), Capella App Services (a synchronization layer), and Couchbase Capella (a fully managed cloud database). Together they enable applications that work seamlessly with or without internet connectivity — a pattern known as offline-first.

This learning path walks through a multi-platform retail inventory management application built for iOS (Swift/SwiftUI) and Android (Kotlin/Jetpack Compose). The app demonstrates how a real-world retail solution can store data locally on-device, sync it to the cloud, and even sync directly between nearby devices — all powered by Couchbase Lite.

## Prerequisites

Before starting this learning path, you should have:

* A [Couchbase Capella account](https://cloud.couchbase.com/) (free trial available)
* Familiarity with iOS (Swift) or Android (Kotlin) development
* For iOS: Xcode 16.4+, macOS Sonoma or later
* For Android: Android Studio Ladybug (2024.2.1)+, JDK 17+
* Basic understanding of NoSQL and mobile application architecture

## Retail Demo Application

The sample application is a retail inventory management system for a fictitious supermarket chain with multiple store locations. It demonstrates how Couchbase Lite fits into a production-grade mobile architecture, covering offline data access, cloud synchronization, and direct peer-to-peer sync between devices.

The app uses scopes and collections to isolate data per store location, with three core collections — `inventory`, `orders`, and `profile` — synchronized via Capella App Services.

## Learning Agenda

This learning path covers four modules:

1. **Getting Started** — Understand the application architecture, the offline-first approach, and how to set up your development environment
2. **Capella Setup** — Create a Couchbase Capella cluster, configure buckets, scopes, and collections, set up App Services, and import sample data
3. **App Services Sync** — Learn how Couchbase Lite replicates data bidirectionally with Capella App Services, and test real-time sync across devices
4. **Peer-to-Peer Sync** — Enable direct device-to-device synchronization over a local network without requiring cloud connectivity, using Couchbase Lite's URL Endpoint Listener
