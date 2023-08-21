---
# frontmatter
path: "/sync-gateway-setup"
title:  Set up Sync Gateway for use with Inventory Demo App 
short_title: Sync Gateway Setup
description: 
  - Learn how to set up Sync Gateway with Docker and Docker Compose
  - Explore automation of your Couchbase cluster setup and importing of data 
  - Set up a Sync Gateway configuration file
content_type: tutorial
filter: mobile
technology: 
  - mobile
landing_page: mobile
landing_order: 3
exclude_tutorials: true 
tags:
  - Docker
sdk_language:
  - kotlin
  - objective-c
  - android-java
length: 60 Mins
---

## Introduction

Couchbase Sync Gateway is a key component of the Couchbase Mobile stack. It is an Internet-facing synchronization mechanism that securely syncs data across devices as well as between devices and the cloud. Couchbase Mobile uses a websocket based <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/couchbase-lite/current/android/replication.html#replication-protocol ">replication protocol</a>.

The core functions of the Sync Gateway include:

* Data Synchronization across devices and the cloud
* Authorization & Access Control
* Data Validation

In this part of our learning path, you will walk you through setting up Couchbase Server and Sync Gateway so that in future steps we can replicate documents from the mobile app to Couchbase Server and vice versa.  You will learn the fundamentals of:

* Installing Couchbase Server using Docker and Docker Compose
* Automation of Couchbase Server cluster setup and importing of data
* Installing Sync Gateway using Docker and Docker Compose
* Setup of a Sync Gateway configuration file 

## Prerequisites

In this step of the learning path, we will be using docker and docker compose and should have both of these installed  before continuing.  <a target="_blank" rel="noopener noreferrer" href=" https://www.docker.com/products/docker-desktop/">Docker Desktop</a> provides these tools and UI for Mac, Windows, and Linux.  

You might also want a text editor outside of Android Studio to review the docker and docker compose config files.  Any text editor will work including Android Studio, but for many developers Visual Studio Code is a good solution as it provides extensions for Docker config file formatting and YAML support, which is a file format Docker Compose uses.  You can download Visual Studio code <a target="_blank" rel="noopener noreferrer" href="https://code.visualstudio.com/download">here</a>.  If you are using Visual Studio code make sure you install the <a target="_blank" rel="noopener noreferrer" href="https://code.visualstudio.com/docs/containers/overview">Docker extension</a>.  The <a target="_blank" rel="noopener noreferrer" href="https://github.com/redhat-developer/vscode-yaml">YAML Language Support</a> is another great extension that can be a major quality of life improvement if you use YAML files a lot.

> **NOTE**: This part of the learning path is longer than normal as there are several configuration files to review.  For developers looking to try out the containers without reviewing the configuration files, you can skip to the [Try It Out](#try-it-out) section. 

## Review Setup of Docker Containers  

### Fetching App Source Code

#### Clone Source Code

* If you haven't already cloned the repo from the previous steps, clone the `Learn Couchbase Lite with Kotlin and Jetpack Compose` repository from GitHub.

```bash
git clone https://github.com/couchbase-examples/android-kotlin-cbl-learning-path.git
```

### Couchbase Server - Dockerfile  

Docker and Docker Compose will be used to create a Couchbase Server container that has a one node cluster setup with a bucket, a user for sync gateway to perform replication between the sync gateway server and server, and indexes for the bucket.  

This is accomplished by creating a custom Dockerfile that defines the Couchbase Server base image along with a shell scripts to perform the automation of the Couchbase Server cluster setup and importing of sample data.

* Open the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/couchbase-server/Dockerfile">Dockerfile</a> found in the couchbase-server folder in the root of the repo in a text editor of your choice.  

```docker
FROM couchbase:latest AS stage_base 
COPY init-cbserver.sh /opt/couchbase/init/
COPY sample-data.json /opt/couchbase/init/
``` 

1. The first line tells docker which docker container should be used as the `base` image for this container.  We are using the `couchbase:latest` image.  As of Couchbase Server 7.1 - ARM64 and X86 images are provided.    
2. Next it copies the init-cbserver.sh shell script into the containers /opt/couchbase/init folder
3. Finally it copies the sample-data.json file into the containers /opt/couchbase/init folder

#### Automation using Shell Script

Next open the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/couchbase-server/init-cbserver.sh">init-cbserver.sh</a> file found in the same folder as the Dockerfile.  This shell script is well documented with comments before each line, however we will still go through the script from a high level. 

```bash
#!/bin/bash
# used to start couchbase server - can't get around this as docker compose
# only allows you to start one command - so we have to start couchbase like the Dockerfile would 
# https://github.com/couchbase/docker/blob/master/enterprise/couchbase-server/7.1.1/Dockerfile#L88

/entrypoint.sh couchbase-server & 
``` 
 
* The first line starts couchbase server just like the standard docker file would.  We need to do this because docker compose has a limit of only allowing one command/entrypoint to run per container.  We need couchbase server to start before we can do our automated setup steps.

>**NOTE** Sleep statements make sure that things complete before moving on to the next step.  The 10-second delay is set after Couchbase Server is started to make sure the cluster is completely running before moving on to the next command.  The delay is conservative and could be shortened based on the speed of your computer.

```bash
sleep 10s  
/opt/couchbase/bin/couchbase-cli cluster-init -c 127.0.0.1 \
--cluster-username $COUCHBASE_ADMINISTRATOR_USERNAME \
--cluster-password $COUCHBASE_ADMINISTRATOR_PASSWORD \
--services data,index,query \
--cluster-ramsize $COUCHBASE_RAM_SIZE \
--cluster-index-ramsize $COUCHBASE_INDEX_RAM_SIZE \
--index-storage-setting default
``` 

* The couchbase-cli tool is used to initialize the cluster and will set the administration username, password, and services along with the index configuration based on environment variables that are set in the docker compose file we will look at in a bit.

```bash
/opt/couchbase/bin/couchbase-cli bucket-create -c localhost:8091 \
--username $COUCHBASE_ADMINISTRATOR_USERNAME \
--password $COUCHBASE_ADMINISTRATOR_PASSWORD \
--bucket $COUCHBASE_BUCKET \
--bucket-ramsize $COUCHBASE_BUCKET_RAMSIZE \
--bucket-type couchbase 
``` 

* The couchbase-cli tool is used again, but this time to create a bucket bsaed on the environment variables that are set in the docker compose file 

```bash
/opt/couchbase/bin/couchbase-cli user-manage \
--cluster http://127.0.0.1 \
--username $COUCHBASE_ADMINISTRATOR_USERNAME \
--password $COUCHBASE_ADMINISTRATOR_PASSWORD \
--set \
--rbac-username $COUCHBASE_RBAC_USERNAME \
--rbac-password $COUCHBASE_RBAC_PASSWORD \
--roles mobile_sync_gateway[*] \
--auth-domain local
``` 

* The couchbase-cli tool is used to create a new user that can be used for sync gateway to connect to the server and replicate documents.   The roles switch sets the role for sync gateway and the [*] defines that this user has access to all buckets for sync gateway.  Note this could be a security risk in non-development environments and is set like this for sake of simplicity.

```bash
/opt/couchbase/bin/curl -v http://localhost:8093/query/service \
  -u $COUCHBASE_ADMINISTRATOR_USERNAME:$COUCHBASE_ADMINISTRATOR_PASSWORD \
  -d 'statement=CREATE INDEX idx_projects_team on projects(team)'
      
sleep 2s

/opt/couchbase/bin/curl -v http://localhost:8093/query/service \
  -u $COUCHBASE_ADMINISTRATOR_USERNAME:$COUCHBASE_ADMINISTRATOR_PASSWORD \
  -d 'statement=CREATE INDEX idx_projects_type on projects(type)'
      
sleep 2s

/opt/couchbase/bin/curl -v http://localhost:8093/query/service \
  -u $COUCHBASE_ADMINISTRATOR_USERNAME:$COUCHBASE_ADMINISTRATOR_PASSWORD \
  -d 'statement=CREATE INDEX idx_projects_projectId on projects(projectId)'
``` 

* The next three commands use the REST API to add indexes in for queries that you could use in the web console Query.  These aren't required for the mobile app or sync, but are nice to have when validating data.  

```bash
/opt/couchbase/bin/cbimport json --format list \
  -c http://localhost:8091 \
  -u $COUCHBASE_ADMINISTRATOR_USERNAME \
  -p $COUCHBASE_ADMINISTRATOR_PASSWORD \
  -d "file:///opt/couchbase/init/sample-data.json" -b 'projects' -g %projectId%
``` 

* cbimport is used to import data from a file into a bucket.  In this command we are telling it that we are going to use the file we copied into the the container and that the documentId should be set from the projectId property inside the document.  

### Sync Gateway -  Dockerfile  

Now that we have reviewed how the Couchbase Server will be created, let's review how the Sync Gateway server will be created.

* Open the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/sync-gateway/Dockerfile">Dockerfile</a> found in the sync-gateway folder in the root of the repo in a text editor of your choice.  

```bash
FROM couchbase/sync-gateway:latest AS stage_base
COPY sync-gateway.json /etc/sync_gateway/config.json
```
1. The first line tells docker which docker container should be used as the `base` image for this container.  We are using the `sync-gateway:latest` image.    
2. Next it copies the sync-gateway.json config file into the containers /etc/sync_gateway folder and renames it to config.json which Sync Gateway reads in by default when starting.

#### Sync Gateway Config File Overview 

The Sync Gateway server uses a configuration file when it starts to load in all important settings.  In the demo app, this file is setup in <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html">Legacy Pre-3.0 Configuration</a> for sake of simplicity.  Let's review the configuration file by sections.

* Open the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/sync-gateway/sync-gateway.json">sync-gateway.json</a> config file found in the same folder as the Dockerfile.   

```json
	"interface":":4984",
	"adminInterface":":4985",
	"log": ["*"],
	"logging": {
	  "log_file_path": "/var/tmp/sglogs",
	  "console": {
		"log_level": "debug",
		"log_keys": ["*"]
	  },
	  "error": {
		"enabled": true,
		"rotation": {
		  "max_size": 20,
		  "max_age": 180
		}
	  },
	  "warn": {
		"enabled": true,
		"rotation": {
		  "max_size": 20,
		  "max_age": 90
		}
	  },
	  "info": {
		"enabled": false
	  },
	  "debug": {
		"enabled": false
	  }
	},
	"disable_persistent_config":true,
	"server_tls_skip_verify": true,
	"use_tls_server": false,
``` 

1.  <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#Interface ">interface</a> and <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#adminInterface ">adminInterface</a> are used to define which ports that Sync Gateway will run on.  Note if you change the default values, you will also need to update your mobile app's replication configuration.
2. log and <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#logging">logging</a> set up the logging configuration.
3. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#disable_persistent_config">disable_persistent_config</a> is required to run in <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html">Legacy Pre-3.0 Configuration</a> mode  
4. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#server_tls_skip_verify">server_tls_skip_verify</a> is set to true because the Couchbase Server container is not using TLS in it's configuration.  **NOTE**:  DO NOT run with TLS disabled in production!
5. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#use_tls_server">use_tls_server</a> is set to false so that the mobile app can communicate with the Sync Gateway server over HTTP instead of HTTPS.  This is for the sake of simpliciy.  **NOTE**:  DO NOT run with TLS disabled in production!

> **Note**:  To use TLS with something like self-signed certificates would greatly increase the complexity and length of this tutorial.  For this reason the tutorial shows the configuration without certificates.

```json
"databases": {
 "projects": {
  "import_docs": true,
  "bucket":"projects",
  "server": "couchbase://couchbase-server",
  "enable_shared_bucket_access":true,
  "delta_sync": {
    "enabled":false
  },
  "num_index_replicas":0,
  "username": "admin",
  "password": "P@$$w0rd",
 "users": { 
		 "demo@example.com":  { "password": "P@ssw0rd12", "admin_roles": ["team1"] },
		 "demo1@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team1"] },
		 "demo2@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team2"] },
		 "demo3@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team2"] },
		 "demo4@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team3"] },
		 "demo5@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team3"] },
		 "demo6@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team4"] },
		 "demo7@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team4"] },
		 "demo8@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team5"] },
		 "demo9@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team5"] },
		 "demo10@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team6"] },
		 "demo11@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team6"] },
		 "demo12@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team7"] },
		 "demo13@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team8"] },
		 "demo14@example.com": { "password": "P@ssword12", "admin_roles": ["team9"] },
		 "demo15@example.com": { "password": "P@ssw0rd12", "admin_roles": ["team10"] }
		},
		"roles": {
		  "team1": { "admin_channels": [ "channel.team1" ] },
		  "team2": { "admin_channels": [ "channel.team2" ] },
		  "team3": { "admin_channels": [ "channel.team3" ] },
		  "team4": { "admin_channels": [ "channel.team4" ] },
		  "team5": { "admin_channels": [ "channel.team5" ] },
		  "team6": { "admin_channels": [ "channel.team6" ] },
		  "team7": { "admin_channels": [ "channel.team7" ] },
		  "team8": { "admin_channels": [ "channel.team8" ] },
		  "team9": { "admin_channels": [ "channel.team9" ] },
		  "team10": { "admin_channels": [ "channel.team10" ] }
		},

``` 
1. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases">databases</a>  sets up the configuration for communication between Sync Gateway and Couchbase Server.
2. projects is the configuration section for the projects bucket that Sync Gateway will be replicating.
3.  <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases">import_docs</a> set to true allows Sync Gateway to import documents that exists on Couchbase Server. 
4. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-bucket">bucket</a> is the name of the bucket that Sync Gateway will replicate with on Couchbase Server. 
5. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-server">server</a> is the connection string to connect to the Couchbase Server.  The name of the server is defined in the Docker Compose file and dockers internal DNS will handle name resolution to this hostname. 
6. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-enable_shared_bucket_access">enable_shared_bucket_access</a> enables Mobile-Server Data Sync (a.ka. mobile convergence), which will generate the mobile-specific metadata for all the preexisting documents in the Couchbase Server bucket.  You can learn more about this functionality in <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/sync-with-couchbase-server.html">Syncing Mobile and Server</a> documentation.
7. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-delta_sync">delta_sync</a> is an Enterprise Edition feature which requires a license.  Delta Sync allows Sync Gateway to replicate only the parts of the Couchbase Mobile document that have changed.  
8. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-num_index_replicas">num_index_replicas</a> determines the number of index replicas used when creating the core Sync Gateway indexes.  
9. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-replications-this_rep-username">username</a> Sync Gateway uses to connect to the Couchbase Server.  This username was created in the automation shell script step.
10. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-password">password</a> is the password that Sync Gateway will use to communicate with Couchbase Server.
11. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-users">users</a> is a hard coded collection of username, passwords and the role that the user is assigned to.  Roles can be assigned to channels to which documents are assigned to in the sync process, restricting the documents that are replicated.  Note that these username and passwords are the same username and passwords that are hard coded into the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/src/app/src/main/java/com/couchbase/learningpath/services/MockAuthenticationService.kt#L36">MockAuthenticationService</a> in the mobile app.
12. <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html#databases-this_db-roles">roles</a> a collection of roles used to map the roles to the channels they have access to.  This is used in the sync function to map roles to channels.

The next part of the configuration is the import_filter.  The import_filter is a string value of Javascript code that controls whether a document written to the Couchbase Server bucket should be made available to Couchbase Mobile clients.

```javascript
 function(doc){
  console.log("********Processing import filter - documents from couchbase server");
  if (doc.type == 'project' 
    || doc.type == 'location' 
    || doc.type == 'user' 
    || . doc.type == 'audit'){
	 return true;
  }
  return false;
 }
 ```

1.  The function takes the document body as parameter and is expected to return a boolean to indicate whether the document should be imported.
2.  The type attribute is used to only import documents of type: project, location, user, and audit.
3.  Any document without one of these four types set will not be imported from Couchbase Server to Sync Gateway for replication to mobile clients.

The sync section of the configuration is used to define custom business logic.  The sync is a string value of Javascript code that will run every time a new document, revision, or deletion is added to a database.  The sync function will examine the document and custom business logic can then calculate things like access control to limit which users can see which documents.  The demo app is a simple example of custom business logic.  See the <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/sync-function-api.html">Sync Function API</a> and <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/access-control-how.html">Access Control How-To</a> guides for more detailed information and a listing of other API functions available.

```javascript
function sync(doc, oldDoc) {  // <1>
 /* Data Validation */
 validateNotEmpty("type", doc.type);  // <2>

 if (doc.type == 'location'){  // <3>
  console.log("********Processing Location Docs - setting it to global/public");
  channel('!');  // <3>
 } else { // <4>
  console.log("********Processing Team Docs");
  validateNotEmpty("team", doc.team); // <5>
  if (!isDelete()) {  // <6>
   /* Routing  -- add channel routing rules here for document */
   var team = getTeam(); // <7>
   var channelId = "channel." + team; // <8>
   console.log("********Setting Channel to " + channelId);
   channel(channelId);  // <9>

   /* Authorization  - Access Control */
   requireRole(team); // <10>
   access("role:team1", "channel.team1"); // <11>
   access("role:team2", "channel.team2"); // <11>
   access("role:team3", "channel.team3"); // <11>
   access("role:team4", "channel.team4"); // <11>
   access("role:team5", "channel.team5"); // <11>
   access("role:team6", "channel.team6"); // <11>
   access("role:team7", "channel.team7"); // <11>
   access("role:team8", "channel.team8"); // <11>
   access("role:team9", "channel.team9"); // <11>
   access("role:team10", "channel.team10"); // <11>
  }
 }
 // get type property
 function getType() {
  return (isDelete() ? oldDoc.type : doc.type);
 }
 // get email Id property
 function getTeam() {
  return (isDelete() ? oldDoc.team : doc.team);
 }
 // Check if document is being created/added for first time
 function isCreate() {
  // Checking false for the Admin UI to work
  return ((oldDoc == false) || (oldDoc == null || oldDoc._deleted) && !isDelete());
 }
 // Check if this is a document delete
 function isDelete() {
  return (doc._deleted == true);
 }
 // Verify that specified property exists
 function validateNotEmpty(key, value) {
 if (!value) {
  throw({forbidden: key + " is not provided."});
  }
 }
}
 ```
1. The sync function parameters allow acces to the current document and previous document (if it's a revision) and all it's properties.
2. validateNotEmpty is a custom function that is called to inspect the doc and validate a property exists and a value is set in it.  This is used to make sure we always have the "type" attribute that we can run business logic against.
3. The doc.type attribute is checked to filter out documents of type location.  In previous parts of the learning path we used a pre-built database to start the database with location documents.  This allows for new locations to be added from Couchbase Server without having to update the pre-built database.  If the document type is location, passing in a `!` to the channel function will make the document global and giving all users access to the document.
4. The else statement is used to catch all other document types.  
5. The validateNotEmpty function is used again, this time to make sure the document has an assigned team to it.  This attribute will be used to control access to the document. 
6. The isDelete function call checks the document to see if it's mark for deletion and is used to skip those documents.
7.  The getTeam function will get the current team assigned to the document. 
8.  The channelId varible is set to a string value of channel plus the current team assigned to the document.
9. The <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/sync-function-api.html#lbl-channel">channel</a> function is called to route the document to the named channel. 
10. The <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/sync-function-api.html#lbl-require-role">requireRole</a> function is used to reject updates that are not made by user with the specified role or roles.
11.  The <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/sync-function-api.html#lbl-access">access</a> function grants a user access to a given channel.

### Docker Compose YAML file

The <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/docker-compose.yml">docker-compose.yml</a> file is provide to configure and build the Couchbase Server and Sync Gateway containers that we have reviewed.

* Open the <a target="_blank" rel="noopener noreferrer" href="https://github.com/couchbase-examples/android-kotlin-cbl-learning-path/blob/main/docker-compose.yml">docker-compose.yml</a> found in the root of the repo in a text editor of your choice.

```yaml
  couchbase-server:
    build: ./couchbase-server
    ports:
     - 8091-8096:8091-8096
     - 11210:11210
    environment:  
      - CLUSTER_NAME=couchbase-demo
      - COUCHBASE_ADMINISTRATOR_USERNAME=Administrator
      - COUCHBASE_ADMINISTRATOR_PASSWORD=P@$$w0rd12
      - COUCHBASE_BUCKET=projects
      - COUCHBASE_BUCKET_RAMSIZE=512
      - COUCHBASE_RBAC_USERNAME=admin
      - COUCHBASE_RBAC_PASSWORD=P@$$w0rd
      - COUCHBASE_RBAC_NAME=admin
      - COUCHBASE_RAM_SIZE=2048
      - COUCHBASE_INDEX_RAM_SIZE=512
    hostname: couchbase-server
    container_name: couchbase-server
    working_dir: /opt/couchbase
    stdin_open: true
    tty: true      
    networks:
      - workshop
    entrypoint: [""]
    command: sh -c "/opt/couchbase/init/init-cbserver.sh"
```

1. The couchbase-server section is used to define the couchbase server container.
2. The build property defines what directory to look for the Dockerfile in
3. The ports collection defines the ports that Couchbase Server requires to run
4. The environment collection defines a set of environment variables that we use in our automation shell script to setup Couchbase Server
5.  The hostname defines what name should be used for DNS resolution
6.  The working directory will be used for all commands ran.  We default this to /opt/couchbase since our automation script and data import file are located in this directory
7.  The network is set to workshop which will define a bridge or shared network that can be used to allow the Couchbase Server to communicate with the Sync Gateway server
8.  The entrypoint property is set to blank and overridden with a command since we want to run our custom automation script when the container is built. 

```yaml
  sync-gateway:
    build: ./sync-gateway
    ports:
      - 4984-4986:4984-4986
    hostname: sync-gateway
    container_name: sync-gateway
    depends_on:
      - couchbase
    working_dir: /docker-syncgateway
    stdin_open: true
    tty: true      
    networks:
      - workshop
```

1. The sync-gateway section is used to define the sync gateway server container.
2. The build property defines what directory to look for the Dockerfile in
3. The ports collection defines the ports that Sync Gateway requires to run
4.  The hostname defines what name should be used for DNS resolution
5.  The network is set to workshop which will define a bridge or shared network that can be used to allow the Couchbase Server to communicate with the Sync Gateway server

Finally, we define the network configuration and driver to use.

```yaml
networks:
  workshop:
    driver: bridge
```

### Try it out

Now that we have reviewed all the files that are used to create the containers, open a terminal window or command prompt depending on your platform of choice.  

#### Windows, Mac, and Linux users
If you are running in Mac or standard PC laptop with Windows or Linux on it you can follow the directions below:

* Make sure you are in the root directory of the repo 
* Run the docker-compose command
```bash
docker-compose up -d
```

* The docker containers should start downloading, then build, and finally start up 

* You can check the status of docker using either Docker Desktop or the terminal commands.  

* Docker Desktop Users should see a container listing after launching the app.  The group name of the containers is the name of the directory of the code repo on your computer where you ran docker compose of. In the example it's named `android-kotlin-cbl-learning-path`.

![Docker Desktop](docker-desktop.png '#width=600px')

* Terminal users can use the docker-compose command to see the containers status

```bash
docker-compose ls
```

![Docker Compose Terminal ](docker-compose-ls.png '#width=800px')

* To see individual containers you can use the docker command

```bash
docker container ls
```

![Docker Terminal ](docker-ls.png '#width=800px')


#### Validation of Containers

* Docker Desktop Users can select each container in Docker Desktop to get detained information and logs about the container running to validate the containers were built properly or use the terminal to gather information.  

* Docker Desktop Users - select the couchbase-server container.  You should see logging information.

![Docker Desktop](docker-couchbase-server-logs.png '#width=800px')  

* Terminal users can enter the following command
  
```bash
docker container logs couchbase-server
```

* The logs should show the status of cluster initialization, bucket creation, and User admin.  This will be followed by the resutls of the curl commands that create the indexes, and finally a message on the status of importing data.  When the setup is complete, you should see output similar to that shown below:
  
```logs
Administrator : P@$w0rd12
Starting Couchbase Server -- Web UI available at http://<ip>:8091
and logs available in /opt/couchbase/var/lib/couchbase/logs

SUCCESS: Cluster initialized
SUCCESS: Bucket created
SUCCESS: User admin set

*   Trying 127.0.0.1:8093...
* Connected to localhost (127.0.0.1) port 8093 (#0)
* Server auth using Basic with user 'Administrator'
> POST /query/service HTTP/1.1
> Host: localhost:8093
> Authorization: Basic QWRtaW5pc3RyYXRvcjpQQCR3MHJkMTI=
> User-Agent: curl/7.78.0-DEV
> Accept: */*
> Content-Length: 58
> Content-Type: application/x-www-form-urlencoded
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 238
< Content-Type: application/json; version=7.1.0-N1QL
< Date: Thu, 05 May 2022 16:29:41 GMT
< 
{
"requestID": "fd7ead5a-15bb-449b-ae64-c5f416186267",
"signature": null,
"results": [
],
"status": "success",
"metrics": {"elapsedTime": "1.682457959s","executionTime": "1.682413042s","resultCount": 0,"resultSize": 0,"serviceLoad": 5}
}

* Connection #0 to host localhost left intact
*   Trying 127.0.0.1:8093...
* Connected to localhost (127.0.0.1) port 8093 (#0)
* Server auth using Basic with user 'Administrator'
> POST /query/service HTTP/1.1
> Host: localhost:8093
> Authorization: Basic QWRtaW5pc3RyYXRvcjpQQCR3MHJkMTI=
> User-Agent: curl/7.78.0-DEV
> Accept: */*
> Content-Length: 58
> Content-Type: application/x-www-form-urlencoded
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 236
< Content-Type: application/json; version=7.1.0-N1QL
< Date: Thu, 05 May 2022 16:29:46 GMT
< 
{
"requestID": "80880668-04f1-4970-815c-88e533399855",
"signature": null,
"results": [
],
"status": "success",
"metrics": {"elapsedTime": "2.67268896s","executionTime": "2.67262546s","resultCount": 0,"resultSize": 0,"serviceLoad": 5}
}

* Connection #0 to host localhost left intact
*   Trying 127.0.0.1:8093...
* Connected to localhost (127.0.0.1) port 8093 (#0)
* Server auth using Basic with user 'Administrator'
> POST /query/service HTTP/1.1
> Host: localhost:8093
> Authorization: Basic QWRtaW5pc3RyYXRvcjpQQCR3MHJkMTI=
> User-Agent: curl/7.78.0-DEV
> Accept: */*
> Content-Length: 68
> Content-Type: application/x-www-form-urlencoded
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Content-Length: 238
< Content-Type: application/json; version=7.1.0-N1QL
< Date: Thu, 05 May 2022 16:29:50 GMT
< 
{
"requestID": "ad9a5337-53ac-4f02-bfda-6c1d0bda1c5a",
"signature": null,
"results": [
],
"status": "success",
"metrics": {"elapsedTime": "2.566747917s","executionTime": "2.566666001s","resultCount": 0,"resultSize": 0,"serviceLoad": 5}
}

* Connection #0 to host localhost left intact
JSON `file:///opt/couchbase/init/sample-data.json` imported to `http://localhost:8091` successfully

Documents imported: 9 Documents failed: 0
```

* Docker Desktop Users - click the back button and now select the sync-gateway container.  You should see logging information.

![Docker Desktop](docker-sync-gateway-logs.png '#width=800px') 

* Terminal users can enter the following command
  
```bash
docker container logs sync-gateway 
```

#### Validate Couchbase Server with Administration Console

Open your web browser of choice and navigate to the following URL:
* http://localhost:8091/

Log into the portal using the same username and password that was displayed in the top of the Couchbase Server docker logs:
* Username:  **Administrator**
* Password:  **P@$w0rd12**

* From the Cluster > Dashboard page click on Buckets link on the navigation menu on the left side of the screen.

![Docker Desktop](cbserver-buckets-details.png '#width=800px') 

* Click on the Documents link to open the Document browser

![Docker Desktop](cbserver-document-browser.png '#width=800px') 

* Click on the edit documents button on one of the listed documents, which is the first button in the list and is highlighted in the screen shot above  

![Docker Desktop](document-sync-metadata.png '#width=400px') 

* Click the Metadata button.  You should now see the metadata associated with the document.
* Sync Gateway will modify this metadata with revision and channel access information
* This metadata is **READ-ONLY** and can NOT be modified from this interface

#### Validate Sync Gateway Server

To validate the Sync Gateway server we will use the REST API interface.

* Open up http://localhost:4984 in your web browser.  You should see equivalent of the following message:

```json
{"couchdb":"Welcome","vendor":{"name":"Couchbase Sync Gateway","version":"3.0"},"version":"Couchbase Sync Gateway/3.0.0(541;46803d1) EE"}
```


## Learn More

Congratulations on completing this step of the learning path!  In this section, we walked through how to use Docker Compose and Docker Desktop to build and start a container running Couchbase Server and a container runnnig Sync Gateway.   Continue on to the next step to learn how to setup replication to sync information between the mobile demo app and Sync Gateway to Couchbase Server.

### References 

* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/couchbase-lite/current/android/replication.html">Documentation: Data Sync using Sync Gateway</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-overview.html">Documentation: Sync Gateway Configuration Overview</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-properties-legacy.html">Documentation:  Legacy Pre-3.0 Configuration</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-schema-import-filter.html">Documentation:  Import Filter Configuration</a>
* <a target="_blank" rel="noopener noreferrer" href="https://docs.couchbase.com/sync-gateway/current/configuration-javascript-functions.html">Documentation:  Using External Javascript Functions</a>
