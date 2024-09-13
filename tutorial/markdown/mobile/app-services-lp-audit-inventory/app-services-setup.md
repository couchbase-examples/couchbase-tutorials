---
# frontmatter
path: "/app-services-lp-audit-inventory"
title:  Set up Couchbase Capella and App Services for Audit Inventory Demo App 
short_title: Couchbase Capella App Services Setup 
description: 
  - Learn how to set up Couchbase Capella and App Services to work with a mobile app
  - Explore Capella App Services configuration including security, authentication, and data synchronization
content_type: tutorial
filter: mobile
technology: 
  - mobile
  - capella
landing_page: mobile
landing_order: 3
exclude_tutorials: true 
tags:
  - App Services
sdk_language:
  - kotlin
  - objective-c
  - swift 
  - android-java
  - dart 
  - csharp
length: 45 Mins
---

## Introduction

Couchbase Capella is a fully managed database-as-a-service that makes it easy to deploy a clustered database.  Capella allows you to securely deploy, manage, and monitor database clusters through a single user interface.   Capella App Services is a fully managed and hosted service for synchronizing data between mobile, web and IoT apps. App Services effectively brings mobile support to Capella, combining Couchbase’s traditional strengths in mobile and edge with the scale, performance and convenience of Capella DBaaS. 

App Services also manages secure data access with role-based access control, providing authentication for mobile users. These key capabilities in Capella are offered as a ready-to-use service for mobile and IoT developers, making it faster and easier than ever to build highly performant and reliable applications.


The core functions of Capella App Services include 

* Data Synchronization across devices and the cloud
* Authorization & Access Control

In this part of our learning path, you will walk you through setting up Couchbase Capella and Capella App Services so that in future steps we can replicate documents from the mobile app to Couchbase Capella and vice versa.  You will learn the fundamentals of:

* Setting up Couchbase Capella projects, cluster, and buckets 
* Setting up App Services including security, authentication, and data synchronization 

## Prerequisites

In this step of the learning path, we will be using Couchbase Capella and App Services.  If you don't have an account with either of these services, you can sign up for one <a target="_blank" rel="noopener noreferrer" href="https://cloud.couchbase.com/sign-up">here</a>.  The Developer Portal already has a tutorial for how to setup a Couchbase Capella trial if you run into any issues <a target="_blank" rel="noopener noreferrer" href="https://developer.couchbase.com/tutorial-capella-sign-up-ui-overview">here</a>.


> **NOTE**: This part of the learning path is longer than normal as there are several screens review.  

### Fetching App Source Code

#### Clone Source Code
* This setup is used in several learning paths.

* For Kotlin developers - If you haven't already cloned the repo from the previous steps, clone the `Learn Couchbase Lite with Kotlin and Jetpack Compose` repository from GitHub.  We will need to use several files in the capella folder found in the root directory of the repo.

```bash
git clone https://github.com/couchbase-examples/android-kotlin-cbl-learning-path.git
```

* For Flutter developers - If you haven't already cloned the repo from the previous steps, clone the `Learn Couchbase Lite with Dart and Flutter` repository from GitHub.  We will need to use several files in the capella folder found in the root directory of the repo.

```bash
git clone https://github.com/couchbase-examples/flutter_cbl_learning_path.git
```

## Review Setup Couchbase Capella Projects, Clusters, and Buckets 

### Couchbase Capella Projects and Clusters

When signing up with a Capella Trial you should already have a project setup called Trial - Project and a cluster created for you called Trial - Cluster.  

## Create Bucket Workflow

Couchbase uses Buckets to store JSON documents.  We need a bucket to store not only our JSON documents we want to sync, but also the App Services configuration files.  Follow the steps below to create a bucket. 

* Click on the `Settings` tab on the main navigation bar.

* Click on the `Buckets` link on the left navigation panel under Configuration.  By default the Capella comes with a default bucket called travel sample, but we won't be using that bucket.  Click the `+ Create Bucket` link in the right hand corner.

* In the `Bucket Name` field enter the name `projects` and click the Next button.

* In the `Memory Per Server Node (MiB)` field enter the value `1024` and click the Next button.

* This step is completed when you are returned to the Bucket listing screen and you see your new projects bucket listed.


## Create App Services 

* Click on the `App Services` tab on the top navigation menu.  This will open the App Services page.

* Click the `Create App Service` button. 

* Enter a name for your app service.

* Select your free tier operational cluster to link to your App Service.

* Click on the `Create App Service` button on the bottom right.

* Wait for the App Service to deploy, your Trial App Services should be listed on the screen as Deploying.

## Create App Services Endpoint

Once your App Service is deployed, we will create an App Services endpoint.  This is the endpoint that will be used to sync data between the mobile app and the Couchbase Capella database.

* Click the `Trial - App Service` link under your App Services listing. 

* Click the `Create App Endpoint` button.

* In the `App Endpoint Name` field enter `projects`

* Select the `projects` bucket you created from the `Select a Bucket` list.

* In the scope list, select the `_default` scope.

* Go to the Linked Collections table and link the `_default` collection.

* Click on the `Create App Endpoint` button.

## Configure App Services Projects Endpoint and Security

#### Mobile App Users 

App Services offers authentication via OpenID Connect (OIDC) along with Anonymous and Basic Authentication.  For sake of simplicity we wil use Basic Authentication in this demo.  Our mobile app already defines the usernames and passwords and assigns them to a team.  

For `Kotlin` developers - this is done in the <a target="_blank" rel="noopener noreferrer"  href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/src/app/src/main/java/com/couchbase/learningpath/services/MockAuthenticationService.kt#L36">MockAuthenticationService</a> class.

For `Dart/Flutter` developers - this is done in the <a target="_blank" rel="noopener noreferrer"  href="https://github.com/couchbase-examples/flutter_cbl_learning_path/blob/main/src/lib/features/router/service/auth_service.dart#L67">auth_service.dart</a> class.


> **NOTE**: For the mobile app to function properly with app services, we must also create these same users in App Services using the same username and password and assigning them to the proper team as shown above.  We also must setup these teams and map them to channels using App Roles.

### Configure App Services Projects Endpoint 

The newly created projects endpoint needs to be configured before we can setup security.  To configure it, follow the directions below.

* Click on the `projects` endpoint from the App Endpoints list.

* The Security tab should open by default with the Access and Validation option selected from the left navigation menu.

* Click on the `_default` link.

* Click on the `Import From File` button. 

* Navigate to the directory you stored the code and find the Capella folder.  Select the `sync.js` file.

* Scroll to the buttom and click the `Save` button.

* Now go to the `settings` tab to import filter.

* Click on the `Import Filter` from the left navigation menu and then Enable the Import Filter.

* Click on the `Import From File` button.

* Navigate to the directory you stored the code in for the tutorial that you are working on and find the Capella folder.  Select the import.js file.

* Click on the `Save` button.

* Now go to the `Delta Sync` tab on the left navigation menu to enable Delta sync.

* Click on the `Save` button.

* Now go back to the `Security` tab.

* Click the `Resume App Endpoint` button located below the navigation tabs on the screen.


#### Review How App Roles are Setup using sync.js

App Roles allow us to map a role to a channel in App Services.  In our mobile app we would like to have users assigned to teams which are app roles and then have those roles associated with channels.  Our <a target="_blank" rel="noopener noreferrer"  href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/capella/sync.js#L1">sync.js</a> script will check the file for the team name attribute in any document and then assign it to the proper channel.

To see this in action you can open the <a target="_blank" rel="noopener noreferrer"  href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/capella/sync.js#L1">sync.js</a> file in a text editor of your choice.

```javascript 
function sync(doc, oldDoc) {
 /* Data Validation */
 validateNotEmpty("documentType", doc.documentType);  // <1>

 if (doc.documentType == 'warehouse') {
  console.log("********Processing Warehouse Docs - setting it to global/public");
  channel('!');
 } else {
  console.log("********Processing Team Docs");
	validateNotEmpty("team", doc.team); // <2>
	if (!isDelete()) {  // <3>
	/* Routing  -- add channel routing rules here for document */
	var team = getTeam();  // <4>
  var channelId = "channel." + team;
	console.log("********Setting Channel to " + channelId);  
	channel(channelId); // <5>

	/* Authorization  - Access Control */
	requireRole(team);  // <6>
	access("role:team1", "channel.team1"); // <7>
	access("role:team2", "channel.team2"); // <7>
	access("role:team3", "channel.team3"); // <7>
	access("role:team4", "channel.team4"); // <7>
	access("role:team5", "channel.team5"); // <7>
	access("role:team6", "channel.team6"); // <7>
	access("role:team7", "channel.team7"); // <7>	
	access("role:team8", "channel.team8"); // <7>
	access("role:team9", "channel.team9"); //	<7>
	access("role:team10", "channel.team10"); // <7>
	}
 }
  ...
}
```

1. The `documentType` field is required.  If it is not present, the document will not be processed. 
2. The `team` field is required as we use this for access control.  If it is not present, the document will not be processed. 
3. If the document is not a delete, we need to set the channel.  
4. Get the team associated with the document.
5. Assign the channel to the calculated channelId which is channel dot team number. 
6. The `requireRole` function is used to assign a role to the team.  
7. The `access` function is used to map access for roles to channel.

### Configure App Roles

Now that we understand that App Roles are used to map a team to a channel, we need to create the roles.  

* Once the endpoint starts, click `App Roles` from the navigation menu on the left.

* Click on the `+ Create App Role` button in the right hand corner.

* In the `App Role Name` field enter `team1`

* In the `Admin Chanels` field enter `channel.team1`

* Click the Create App Role button.

* Repeat these steps for team2 - team10 adding them to the appropriate channels.  

> **NOTE**: Note the data sync demo only uses team1 - team3, but the rest of the mobile app has users assigned up to team10.

> **NOTE**: Currently the Create App Role team overlay window remembers the previously used channel name, so you need to make sure you remove the previously used channel before adding a new one.
<br>

### App Services - Configure App Users 

To configure App Users that we will be used by our mobile app to talk to App Services, follow the directions below.

* Click on `App Users` from the navigation menu on the left.

* Click the `+ Create App User` button in the right hand corner.

* In the `Username` field enter `demo@example.com`

* In the `Password` field enter the password `P@ssw0rd12`.  

* Scroll to the App Role section and select `team1` from the `App Roles` dropdown.

* Click the `Create App User` button.

* Repeat these steps for demo1@example.com - demo5@example.com adding them to the appropriate teams.  

For Kotlin Developers, you can reference <a target="_blank" rel="noopener noreferrer"  href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/src/app/src/main/java/com/couchbase/learningpath/services/MockAuthenticationService.kt#L36">MockAuthenticationService</a> for a listing of username, passwords, and team assignments. 

For Dart/Flutter Developers, you can reference <a target="_blank" rel="noopener noreferrer"  href="https://github.com/couchbase-examples/flutter_cbl_learning_path/blob/main/src/lib/features/router/service/auth_service.dart#L67">auth_service.dart</a> for a listing of username, passwords, and team assignments. 

> **NOTE**: Note the data sync demo only uses users assigned from team1 - team3, but the rest of the mobile app has users assigned up to team10.  Optionally you want you can add all the users listed.


### Test App Services

We can use our web browser to test App Services.  To test our App Services setup, make sure you are in one of the App Services -  App Endpoint section of Capella and do the following steps:

* Click the Connect tab

* Copy the URL in the Public Connections field.  This URL should look like something similar to 
  * wss://hostname.apps.cloud.couchbase.com:4984/projects

* Paste this into a new web browser tab.

* Replace the wss: with https:

* Hit enter.  You should be prompted for a username and password.

* In the username field enter `demo@example.com`

* In the password field enter `P@ssw0rd12`

* You should see something similar to this:

```json
{"db_name":"projects","update_seq":4,"committed_update_seq":4,"instance_start_time":1707427508198932,"compact_running":false,"purge_seq":0,"disk_format_version":0,"state":"Online","server_uuid":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
```
> **NOTE**: Keep this URL handy because we will update the mobile app in the next step of the learning path to use this URL in replication. 

## Import Test Sync Data into Capella Projects Bucket

We need to import some data into Capella into the projects bucket that we can then use in the next step of the learning path with replication.  The follow steps will help you import the sample data provided in our repo into Capella.  

* Click on the `Linked Cluster` link located in the upper right corner of the navigation panel.

* Now click on the `Import` from the navigation menu.

* The default source of Load from your browser should be selected

* Click the Upload link and browse to the location of the repo on your computer and go into the `capella` folder and select `sample-data.json`.

* Under Choose your target
  * Click the `Choose a bucket` drop down list and select `projects` from the pop-up menu

* Under Preview Your Data step
  * Select `Custom` from the `Choose How to Generate Key Name` list
  * Click the `Edit` button
  * Enter `"%projectId%"` into the `Pattern` field.  Don't for the the parathesis or this step will fail.
  * Click the `Save` button

* You should be able to preview the data using the Raw File, Parsed Table, and DocIDs and Documents tabs.

* Click the `Import` button

### Validate Import Test Data in Bucket 

We can now validate that the documents were imported and picked up by App Services.  

* While in the `Data Tools` tab, click the `Documents` link from the navigation menu 

* When the documents window appears, you should see a listing of documents.  

* Change the bucket you are viewing to `projects` from the drop down list and the scope and collection to `_default`.

* In the listing of documents look for a document and click on the `ID` link.

* The document viewer moudel window should appear.  

* Click on the `Meta` tab.

* Scroll down to view the various metadata.  About half way through you should see an array called `channels` and a string should be set in this to the channel the document is assigned.  This means App Services has picked up the document and properly assigned it to a team!  

## Learn More

Congratulations on completing this step of the learning path!  In this section, we walked creating a `Bucket` in Capella, then setup `App Services` including an `End Point` and `Security`.  Finally we imported sample data into the Capella `Bucket` to use in future parts of the learning path. 

### References 

* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/app-services/index.html">Documentation: App Services 
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/app-services/deployment/creating-an-app-service.html">Documentation: Creating an App Services</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/app-services/deployment/app-endpoint.html">Documentation:  Creating App Endpoints</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/app-services/user-management/create-user.html">Documentation:  App User Administration</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/app-services/channels/channels.html">Documentation:  App Services Channels</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/clusters/data-service/manage-buckets.html">Documentation:  Capella Managing Buckets</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html">Documentation:  Capella Import Data</a>
