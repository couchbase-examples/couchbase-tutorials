---
# frontmatter
path: "/dart-flutter-replication-app-services"
title:  Couchbase Capella App Services, Dart, and Flutter 
short_title: Data Sync with App Services 
description: 
  - Learn how to set up replication of documents in Couchbase Lite using Capella App Services 
  - Explore the various features of App Services 
content_type: tutorial
filter: mobile
technology: 
  - mobile
  - capella
landing_page: mobile
landing_order: 3
exclude_tutorials: true 
tags:
  - Android
  - iOS
  - Flutter
  - App Services
sdk_language:
  - dart 
length: 30 Mins
---

## Introduction

In this part of our learning path, you will walk through the "Audit Inventory" demo application of using Couchbase Lite with the Replicator, which means the database will sync information using two way replication between the mobile app and Couchbase Capella App Services. 

In previous steps of the learning path we have enabled Live Queries on both the Project Listing screen and the Audit Listing screen.  Once replication is started those screens will update anytime new documents or changes to existing documents are replicated to the mobile device.

> **NOTE**:  This step assumes you completed the all previous steps of the learning path and specifically the `Couchbase Capella App Services Setup` that sets up Capella and App Services for this demo.  **You MUST complete this part of the learning path before moving forward**. 

In this step of the learning path you will learn the fundamentals of:

* Configure your Couchbase Lite clients for replication with Couchbase Capella App Services 

## App Overview

While the demo app has a lot of functionality, this step will walk you through:

* Log in into the application
* Scrolling the list of projects 
* Setting up Replication 
* Starting Replication 
* Reviewing the code
* Validating the data is properly replicated between App Services and mobile device(s)

## Installation

### Fetching App Source Code

#### Clone Source Code

* If you haven't already cloned the repo from the previous step, clone the `Learn Couchbase Lite with Dart and Flutter` repository from GitHub.

```bash
git clone https://github.com/couchbase-examples/flutter_cbl_learning_path.git
```

## Couchbase Capella App Services Connect Hostname

In order to start replication with Couchbase Capella App Services, you will need to know the hostname of the Couchbase Capella App Services instance. You can find this by logging into <a target="_blank" rel="noopener noreferrer" href="https://cloud.couchbase.com/">Couchbase Capella</a>.
 
* Click on `App Services` from the tab navigation menu

* Click on your `Trial - App Services` instance

* Click on the `projects` App Endpoint

* Click on the `Connection` tab

* Copy URL under Public Connection.  This should look something similar to:
  * wss://hostname.apps.cloud.couchbase.com:4984/projects
  * We will use this URL in a later step, so make sure you have it available.

* Under Public Certificate, click the Download button to download the certificate.  This will be used in a later step to enable the mobile app to trust the App Services server.

## Certificate Pinning Setup

The dart/flutter SDK doesn't include the App Services certificate by default.  This means that the mobile app will not trust the App Services server and replication will not work.  To fix this, we need to add the certificate to the mobile app so that it will trust the App Services server.

* Copy the certificate you downloaded from the previous step to the `src` folder in the mobile app.  This is the same folder where the `pubspec.yaml` file is located.

* Open the `pubspec.yaml` file and add the file to the `assets` section.  When completed, it should look something like this:

```yaml
  assets:
    - asset/images/couchbase.png
    - asset/database/startingWarehouses.zip
    - projects.pem
```

## Update the Replication URL in the Audit Inventory Demo App 

In Android Studio navigate to <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/flutter_cbl_learning_path/blob/main/src/lib/features/database/replicator_provider.dart#82">replicator_provider.dart</a> found in the lib -> features -> database.

- Uncomment line 82 that will load the pem file that you added into the prject and put in the YAML file 

- Locate the `var url` definition

- Update the `host` and `path` to match the URL you copied from the Couchbase Capella App Services instance

- You will need to make sure that the path is the information after the port number and slash.  So for example if we were to look at this URL from App Services:  **wss://hostname.apps.cloud.couchbase.com:4984/projects**

  - I would put the following in for the host:
    - **hostname.apps.cloud.couchbase.com**
  - I would the following in for path:
    - **projects**

```dart
// <1>
var url = Uri(scheme: 'wss',
    port: 4984,
    host: 'put_your_url_in_here',             //change this line to match your configuration!!
    path: 'projects',
);

var basicAuthenticator = BasicAuthenticator(username: user.username, password: user.password);
var endPoint = UrlEndpoint(url);

// <2>
_replicatorConfiguration = ReplicatorConfiguration(
    database: db,
    target: endPoint,
    authenticator: basicAuthenticator,
    continuous: true,
    replicatorType: ReplicatorType.pushAndPull,
    heartbeat: const Duration(seconds: 60),
    // **UNCOMMENT** this the line below if you are using App Services or a custom certificate
    pinnedServerCertificate: pem.buffer.asUint8List()
);

//check for nulls
var config = _replicatorConfiguration;
if(config != null) {

  // <3>
  _replicator = await Replicator.createAsync(config);
```
1. It's critical that the URL is correct.  If you have a typo or the URL is incorrect, replication will not work.  Make sure you have the correct URL. 
2. Update the `replicatorConfiguration` to use the `url` you created in the previous step
3. Uncomment out line 103 in order to load tghe PEM file as a pinned certificate. This will allow the device to trust the connection between App Services and the mobile device. Your code should look something like this when done:
4. The replicator is created by passing in the `replicatorConfiguration` object

> **NOTE**:  DO NOT use the url provided in the example as it will not work.  You must use the url you copied from the Couchbase Capella App Services instance.

## Update route_bloc.dart
Finally you will need to update the route_bloc.dart to have replication init after the user logs in. This is done by uncommenting out line 110. 

```dart
await _replicatorProvider.init();
```
## When to Start Replication

Developers need to decide when to start replication.  For some apps it makes sense after the user logs in, while for others it might make more sense once the application is fully loaded.  In this app, two-way Replication between the app and the App Services is enabled from the Replication screen manually.  

## Try it out 

* Log in to the app with any username and password. Let's use the values _"**demo@example.com**"_ and _"**P@ssw0rd12**"_ for username and password fields respectively. 

* In the Demo App the Replicator screen can be found by tapping on the Drawer menu icon (sometimes referred to the Hamburger icon) in the upper left hand corner of the screen and tap on the Replication link.

![Overflow Menu](./replicator_overflow_menu.png '#width=350px')

* The Replication Status screen has buttons on it since a configuration is available to stop, start, and delete the configuration.

![Replicator Start Available](./replicator_status_start_available.png '#width=350px')

> **NOTE**: At this point your Capella App Services should be started and tested, which was covered in the <a target="_blank" rel="noopener noreferrer"  href="app-services-lp-audit-inventory?learningPath=learn/android-kotlin">`Couchbase Capella App Services Setup`</a> step of the learning path. If you start replication and the App Services is not setup properly, you will time out trying to connect to it.
 
* Once replication starts you will see status messages appear in the mobile app.  Replication shouldn't take long and when it's done the replicator status will change to IDLE.

![Replicator Complete](./replicator_status_completed.png '#width=350px')  

## Validate Documents Replicated

Valdiating that the documents replicated from the device and from server can be done from the mobile app and from Couchbase Capella App Services.

### Demo App

* In the Demo App navigate to the Home screen which can be found by tapping on the Drawer menu icon (sometimes referred to the Hamburger icon) in the upper left hand corner of the screen and tap on the Home link.

* Scrolling through the list you should see three new documents starting with the word `Warehouse` and then a number.  The numbers are different for each group of teams.
  * Team1:  Warehouse 100, Warehouse 101, Warehouse 102
  * Team2:  Warehouse 200, Warehouse 201, Warehouse 202
  * Team3:  Warehouse 300, Warehouse 301, Warehouse 302 

![Replicator Warehouse Documents](./replicator_warehouse_documents.png '#width=350px')  

* You can test other team members by logging out and logging in as `demo2@example.com` or `demo4@example.com` with the same password and starting the replicator to see those documents listed above.  Note that these users should have been created in App Services in the previous step.  If you didn't create these users, this will not work as they will not be able to authenticate into App Services.
 
### Couchbase Capella and App Services

* Open your web browser of choice and log into <a target="_blank" rel="noopener noreferrer" href="https://cloud.couchbase.com/">Couchbase Capella</a>. 

* When logged in you should be at the Home tab for Trial accounts and the Database tab for non-trial accounts.

* Click on the `Trial - Cluster`. 

* The Data Tools `Documents` tab should appear by default.

* Switch the bucket to your `prpojects` bucket

* On this screen you can see the number items in the buck should have increased from the the previous step of the learning path.  To view the documents, click on the Documents link to open the Document browser.

* Change the Limit box from the default value to 200 and click the Retrieve Docs button.

* Scrolling through the list you should find your random documents that were created on the mobile device during the Batch operations step of the learning path.  For example - prior to sync we didn't have any documents of documentType='audit' and now the bucket should have MANY audit documents.


## Reviewing the Replicator code

Now that we have tried out replication, let's review how the replicator and replicator configuration code is setup. All code used by the ReplicatorBloc and ReplicatorProvider. 

* Open the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/flutter_cbl_learning_path/blob/main/src/lib/features/database/replicator_provider.dart#82">replicator_provider.dart</a> file.

* As stated earlier, the override of replicatorConfig is used to setup the config with default values that you saw on the Replication Configuration screen.
  
```dart
_replicatorConfiguration = ReplicatorConfiguration(
    database: db,
    target: endPoint,
    authenticator: basicAuthenticator,
    continuous: true,
    replicatorType: ReplicatorType.pushAndPull,
    heartbeat: const Duration(seconds: 60),
    // **UNCOMMENT** this the line below if you are using App Services or a custom certificate
    pinnedServerCertificate: pem.buffer.asUint8List()
);
```

* The <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/flutter_cbl_learning_path/blob/main/src/lib/features/database/replicator_provider.dart#L118"> **startReplicator**</a> function is used to start the replicator.

```dart
  Future<void> startReplicator({
    required Function(ReplicatorChange change)? onStatusChange,
    required Function(DocumentReplication document)? onDocument }) async {

    debugPrint('${DateTime.now()} [ReplicatorProvider] info: starting replicator.');

    var replicator = _replicator;
    if (replicator != null) {

      if(onStatusChange != null) {
        var function = onStatusChange;
        statusChangedToken = await replicator.addChangeListener(function);
      }
      if (onDocument != null) {
        var function = onDocument;
        replicator.addDocumentReplicationListener(function);
      }
      await replicator.start();

      debugPrint('${DateTime.now()} [ReplicatorProvider] info: started replicator.');
    }
    else {
      debugPrint('${DateTime.now()} [ReplicatorProvider] error: cannot start replicator, it is null.');
    }
  }

```

* The <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/flutter_cbl_learning_path/blob/main/src/lib/features/database/replicator_provider.dart#L144"> **stopReplicator**</a> function is used to stop the replicator.

```dart
  Future<void> stopReplicator() async {
    var replicator = _replicator;
    if (replicator != null){

      debugPrint('${DateTime.now()} [ReplicatorProvider] info: stopping replicator.');

      //remove change listeners before stopping replicator, this should
      //automatically be done with stopping, but just to be safe
      await removeDocumentReplicationListener();
      await removeStatusChangeListener();

      await replicator.stop();

      //null out tokens so they can be reused
      statusChangedToken = null;
      documentReplicationToken = null;

      debugPrint('${DateTime.now()} [ReplicatorProvider] info: stopped replicator.');
    } else {
      debugPrint('${DateTime.now()} [ReplicatorProvider] warning: tried to stop replicator but it was null.');
    }
  }
```
## Exercise 

In this exercise, we will observe how changes made on one app are synced across to the other app

1. The app should be running in two emulators side by side
2. Log into one of the emulators with the username **_"demo@example.com"_** and the password **_"P@ssw0rd12"_**.
3. On the other emulator log into the app with the username **_"demo1@example.com"_** and the password **_"P@ssw0rd12"_**.
4. Because demo and demo1 are on the same team - they should be able see changes made to documents by the other user.
5. On one simulator, edit the name and location values of a project.
6. Confirm that changes show up in the app on the other simulator.
7. Similarly, make changes to the app in the other simulator and confirm that the changes are synced over to the first simulator.

## Handling Conflicts during Data Synchronization

Data conflicts are inevitable in an environment where you can potentially have multiple writes updating the same data concurrently. Couchbase Mobile supports **_Automated Conflict Resolution_**.  You can learn more about this in the documentation on <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/couchbase-lite/current/android/conflict.html">Handling Data Conflicts</a>.

## Learn More

Congratulations on completing this step of the learning path!  In this section, we walked through setting up the Replicator Config and started two-way replication between a mobile app and Couchbase Capella App Services. 

### References 

* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/app-services/index.html">Documentation:  App Services</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/couchbase-lite/current/android/query-live.html#using-kotlin-flows-and-livedata">Using Kotlin Flows and LiveData</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/couchbase-lite/current/android/conflict.html">Documentation:  Handling Data Conflicts</a>
