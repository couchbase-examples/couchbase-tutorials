---
# frontmatter
path: "/tutorial-java-transactions"
title: Transactions with Java SDK
short_title: Transactions w/ Java SDK
description: 
  - Learn how to configure Couchbase Java SDK client
  - Explore the concept of database transactions and how to do them with Couchbase
  - Build a simple application that uses transactions with Java SDK connector
content_type: tutorial
filter: sdk
technology:
  - query
tags:
  - Transactions
  - Spring Boot
  - Spring Data
sdk_language:
  - java
length: 30 Mins
---

<!-- 
  The name of this file does not need to be `tutorial-java-transactions` because it is in the `tutorials/java/markdown` directory, so we can just call it transactions. The idea is that we can leave off `tutorial-java` as a prefix 
-->

<!-- TODO:  Figure out how to add width to image size in try it now links -->
[![Try it now!](https://da-demo-images.s3.amazonaws.com/runItNow_outline.png?couchbase-example=java-transactions-quickstart&source=devPortal)](https://gitpod.io/#https://github.com/couchbase-examples/java-transactions-quickstart)

## Prerequisites

To run this prebuilt project, you will need:

- [Couchbase Capella](https://docs.couchbase.com/cloud/get-started/create-account.html) account or locally installed [Couchbase Server](/tutorial-couchbase-installation-options)
- Git
- Java SDK 8+
- Code Editor

## What are Transactions

A transaction is a set of operations that should be either all applied or not applied at all.
Modern databases implement transactions by delaying any database changes made inside a transaction until the client commits the transaction.
Any errors inside a transaction cause the transaction to fail.
All changes delayed for a failed transaction are then discarded to prevent database corruption.

Money transfer is a classic example of an operation that requires multiple database changes that should apply as a single batch.
Grouping database operations into transactions guarantees database recovery to a logically consistent state after a catastrophic failure.

For example, without using transactions, any error that happens during transfer operation after it subtracts credits from source account but before it adds them into target account will cause the database to loose track of the sum of the transfer:

```sql
-- Balance1: 1000 Balance2: 128

UPDATE `account` SET `balance` = `balance` - 100 WHERE id = 1;

-- Balance1: 900 Balance2: 128 
-- Note that if the following statement fails, then we lost 100 credits!

UPDATE `account` SET `balance` = `balance` + 100 WHERE id = 2;

-- Balance1: 900 Balance2: 228
```

To prevent this from happening, database clients must wrap transfer operations in transactions:

```sql
-- Balance1: 1000 Balance2: 128
START TRANSACTION;
  UPDATE `account` SET `balance` = `balance` - 100 WHERE id = 1;
  -- Provisional Balance1: 900
  -- this provisional balance change is isolated: queries outside the transaction cannot see it until the transaction is committed
  UPDATE `account` SET `balance` = `balance` + 100 WHERE id = 2;
  -- Provisional Balance2: 228
COMMIT; -- only at this point provisional balances are written into the database and become available to other clients
```

Doing so guarantees that if any failure happens during the transaction, it will cause the whole transaction to fail, including already processed operations.
In our example, an error inside the transaction will cause the sum of the transfer to be "returned" to the source account (in fact the Balance1 will not have changed at all for any observer outside the transaction)

Transactions also protect application data from concurrent modifications when two clients try to update the same data record.
For example, if the user initiates another transfer of 60 credits before the system processes their previous transfer of 30 credits.
In this scenario, both transfer operations fetch and update the user's balance (say, it was 200 credits) and _will try to update the same record_, overriding changes from each other.
Because of this, the result of applying these operations depends on which concurrent operation succeeds last:

- If 60 credit transfer suceeds last, it will update the balance to 140 credits, overriding changes from the first transfer
- If 30 credit transfer suceeds last, it will update the balance to 170 credits, overriding changes from the second transfer

Transactions, however, allow the database to detect and prevent this situation.
Whenever two concurrent transactions try to update the same value, Couchbase will accept only one change and fail all other modifications.
Those failed modifications can then be retried by the application, for example:

- Transfer transaction 1 starts
- Transfer transaction 2 starts
- Transfer transaction 2 is committed and user balance updated to 140 credits
- Transfer transaction 1 will now be rejected as it started before transaction 2 has finished, and it tries to update the same value as transaction 2
- The database client handling transfer transaction 1 receives an error from Couchbase

At this point, the client application can either retry the transfer using the updated balance or notify the user that it has failed.
Using transactions, we successfully managed access to a shared resource (user balance) and protected it from concurrent data modification.

Single-document transactions were always at the base of Couchbase's unmatched resiliency and reliability, preventing concurrent modifications inside a single database document.
As the name suggests, distributed multi-document transactions prevent concurrent modifications across multiple documents that may be physically located on different nodes of Couchbase cluster.
Distributed multi-document transactions were introduced in Couchbase 6.5 and made it easier to use Couchbase with applications with strict data consistency requirements that span multiple different documents.
Please review [How we implemented Distributed Multi-document ACID transactions in Couchbase](https://blog.couchbase.com/distributed-multi-document-acid-transactions/) blog post or consult with [our documentation](https://docs.couchbase.com/server/7.0/learn/data/transactions.html) for specific implementation details.

## Sample Application

You can locate the sample application for this tutorial at [this link](https://github.com/couchbase-examples/java-transactions-quickstart).
It is a Java web application built using Spring Boot.
When started, it serves a single index.html page with a form that allows transferring credits between four pre-programmed user accounts.

## Downloading Source Code

You can download source code for this tutorial's example application with git:

```shell
git clone https://github.com/couchbase-examples/java-transactions-quickstart
```

This command will create `java-transactions-quickstart` sub-directory and download the example spring boot project into it.

## Couchbase Java SDK Dependencies and Configuration

Couchbase transactions support is added to the project using a maven dependency:

```xml
<dependency>
    <groupId>com.couchbase.client</groupId>
    <artifactId>couchbase-transactions</artifactId>
    <version>1.2.1</version>
</dependency>
```

Or Gradle Groovy DSL:

```groovy
implementation 'com.couchbase.client:couchbase-transactions:1.2.1'
```

Or Gradle Kotlin DSL:

```kotlin
implementation("com.couchbase.client:couchbase-transactions:1.2.1")
```

The latest version of transactions library as well as information on using it with other build systems is available [on this Maven Central page](https://search.maven.org/artifact/com.couchbase.client/couchbase-transactions).

## Setup and Run The Application

To configure the application, open the file `src/main/resources/application.properties` and set the bootstrap hosts for your Couchbase cluster, bucket name for the application, and username and password the application can use to access locally installed cluster:

```ini
spring.couchbase.bootstrap-hosts=localhost
spring.couchbase.bucket.name=user_profile
spring.couchbase.bucket.user=Administrator
spring.couchbase.bucket.password=password
```
> **_NOTE:_**  Couchbase Capella clusters are using Transport Security Layer (TLS) cryptographic protocol to secure traffic between the cluster and client applications.
> For simplicity, we will forego certificate validation step in this tutorial.
> It is highly recommended to always verify your cluster's certificate on production environments.
> Please refer to "Full Example / Couchbase Capella Sample" and "Cloud Connections" sections of [Install and Start Using the Java SDK with Couchbase Server](https://docs.couchbase.com/java-sdk/current/hello-world/start-using-sdk.html#full-example) for information on how to validate cluster certificates.


To configure Capella connections, use a `ClusterEnvironment` with enabled TLS security:

```java
    @Bean
    public Cluster getCouchbaseCluster(){
        return Cluster.connect(dbProp.getHostName(), ClusterOptions.clusterOptions(
              dbProp.getUsername(),
              dbProp.getPassword()
            ).environment(getClusterEnvironment())
          );
    }

    public ClusterEnvironment getClusterEnvironment() {
      ClusterEnvironment.Builder environmentBuilder = ClusterEnvironment.builder();

      SecurityConfig.Builder securityConfig = SecurityConfig.enableTls(true)
        .trustManagerFactory(InsecureTrustManagerFactory.INSTANCE);
      environmentBuilder.securityConfig(securityConfig);

      return environmentBuilder.build();
    }
```

Another alternative is to use `couchbases://` connection protocol and add `?ssl=no_verify` to the connection string:
```ini
spring.couchbase.bootstrap-hosts=couchbases://cb.jnym5s9gv4ealbe.cloud.couchbase.com?ssl=no_verify
```

> **_NOTE_**: these Capella connection configuration examples should be used for development purposes only and are not recommended for production.

Save your customized configuration and start the sample application by running the following command in the root folder of the project:

```shell
mvn spring-boot:run
```

Wait for the application to start and open `http://localhost:8000` in a browser.

[Example transfer form](/tutorials/java-transactions-transfer-form.png)

Select the user you want to transfer credits from in the `Source User` drop-down.
Doing so will update the transfer form to show available credits for that user right next to the drop-down.
Select the user you want to transfer credits to in the `Target User` drop-down; this will update the form to show the balance of the selected target user.
Enter the number of credits you'd like to transfer, then click "GO!" and you should see user balances updated with their new values.

## Connecting to the cluster with Java SDK

> **_NOTE:_**  for Capella connections the bucket must exist on the cluster before the application connects to it.

We load database connection settings from the `src/main/resources/application.properties` file with Spring Framework into the DBProperties configuration bean.
The DBProperties configuration bean is then used in `CouchbaseConfig` class to set up database connection parameters.

To connect our example application to the local Couchbase cluster, we will use the standard connection method described in [the Java SDK documentation](https://docs.couchbase.com/java-sdk/current/hello-world/start-using-sdk.html#hello-couchbase).

After setting up connection parameters and establishing the connection to the cluster, we then expose it to the rest of the application by defining two beans in the CouchbaseConfig class:

- The `Cluster` bean represents the connection to the database:

```java
@Bean
public Cluster getCouchbaseCluster(){
  return Cluster.connect(
    dbProp.getHostName(),
    dbProp.getUsername(),
    dbProp.getPassword()
  );
}
```

- The `Bucket` bean represents application bucket.
```java
@Bean
public Bucket getCouchbaseBucket(Cluster cluster){

  boolean clusterExists = cluster.buckets()
                             .getAllBuckets()
                             .containsKey(dbProp.getBucketName());

  //Creates the cluster if it does not exist yet
  if(!clusterExists) {
    cluster.buckets()
      .createBucket(
        BucketSettings.create(dbProp.getBucketName())
          .bucketType(BucketType.COUCHBASE)
          .ramQuotaMB(256)
      );
  }
  return cluster.bucket(dbProp.getBucketName());
}
```

[This SDK documentation page](https://docs.couchbase.com/java-sdk/current/hello-world/start-using-sdk.html#hello-couchbase) provides additional information about connection options not used in this example.

## Accessing Transactions API

The SDK provides transactions API to developers via an instance of the `com.couchbase.transactions.Transactions` class.
Developers can obtain such an instance from the factory method `Transactions::create`, which accepts a `Cluster` object as its parameter.
This method also accepts an optional second parameter that allows creating transactions API instances with custom configurations.

One of the most important options is Data Durability.
It refers to the fault tolerance and persistence of data in the face of software or hardware failure.
Couchbase Server's architecture guards against most forms of failure and protects against data loss while remaining customizable.
Developers may select one of four transaction durability levels depending on durability and performance requirements:

- `NONE`: in this mode, Couchbase will consider a transaction to be successful as soon as the primary node has acknowledged the mutation in its memory. Single-node clusters support only this mode for transactions.
- `Majority`: a transaction is successful when the operation is guaranteed to be available in memory on most configured replicas.
- `MajorityAndPersistToActive`: Majority level, plus persisted to disk on the active node.
- `PersistToMajority`: Majority level, plus persisted to disk on the majority of configured replicas.

By default, Java SDK selects the "Majority" durability setting.
While some Couchbase clusters may contain hundreds of nodes, our example application is expected to be connecting to a single-node cluster.
A significant detail of such a setup is that single-node clusters optimize their performance and support only "NONE" durability mode.
Because of this, we need to instruct the SDK to use "NONE" durability setting.
To do so, we build a `TransactionsConfig` configuration object and pass it to `Transactions::create`:

```java
@Bean
public Transactions transactions(final Cluster couchbaseCluster) {
  return Transactions.create(
    couchbaseCluster,
    TransactionConfigBuilder.create()
      .durabilityLevel(TransactionDurabilityLevel.NONE)

      // The configuration can be altered here,
      // but in most cases the defaults are fine.

      .build()
  );
}
```

We then share obtained `Transactions` object with the rest of the application by returning it as the third bean defined in the `CouchbaseConfig` class.
Sharing it as a bean also ensures that there is never more than one instance of the `Transactions` object as required by the SDK.

We can configure other transaction API options like logging levels in this way as well.
[This SDK documentation page](https://docs.couchbase.com/java-sdk/current/howtos/distributed-acid-transactions-from-the-sdk.html#configuration) provides information about additional transaction options not used in this example.

## Data Model

Information about user accounts and their balances is represented using the `DemoUser` class with the following properties:

```java
package com.couchbase.example.model;

public class DemoUser {
  private String id;
  private String name;
  private String surname;
  private int credits;

  //...constructor, getters and setters
}
```

Application persists DemoUser objects as JSON documents to the Couchbase cluster bucket configured in `src/main/resources/application.properties` file.
The DBSetupRunner class clears and initializes the bucket with pre-configured values every time the application is started.

## Credit Transfer Service

The credit transfer operation in our application is provided by the `TransferCreditService` service interface and is implemented by the `TransferCreditServiceImpl` class.
The service depends on `Bucket` and `Transactions` beans (previously configured in CouchbaseConfig class) to perform required database operations:

```java
@Service
public class TransferCreditServiceImpl implements TransferCreditService {

  @Autowired
  private Transactions transactions;
  @Autowired
  private Bucket bucket;
```

To transfer credits from one user to another, we need to perform four database operations:

- two operations to read the source and target user balances.
- two operations to store updated source and target user balances.

Failing to perform any of the last two update operations would compromise the whole transfer and leave the database in an inconsistent state.
Transactions allow us to make such a situation impossible.

We start by defining our transfer operation inside a consumer lambda:

```java
Consumer<AttemptContext> transactionLogic = (Consumer<AttemptContext>) ctx -> {
  //Load both users
  TransactionGetResult u1DocTx = ctx.get(bucket.defaultCollection(), sourceUser);
  TransactionGetResult u2DocTx = ctx.get(bucket.defaultCollection(), targetUser);

  //convert them to JsonObjects
  JsonObject u1Doc = u1DocTx.contentAs(JsonObject.class);
  JsonObject u2Doc = u2DocTx.contentAs(JsonObject.class);

  int user1Balance = getCredits(u1Doc) - creditsToTransfer;
  int user2Balance = getCredits(u2Doc) + creditsToTransfer;
  //update their credits
  u1Doc.put("credits", user1Balance);
  u2Doc.put("credits", user2Balance);

  //save both users
  ctx.replace(u1DocTx, u1Doc);
  ctx.replace(u2DocTx, u2Doc);

  if(user1Balance < 0) {
    throw new IllegalStateException("User can't have a negative balance");
  }
};
```

Java SDK also allows using N1QL queries inside transactions:

```java
Consumer<AttemptContext> transactionLogic = (Consumer<AttemptContext>) ctx -> {
  //Load both users
  TransactionGetResult u1DocTx = ctx.get(bucket.defaultCollection(), sourceUser);
  TransactionGetResult u2DocTx = ctx.get(bucket.defaultCollection(), targetUser);

  //convert them to JsonObjects
  JsonObject u1Doc = u1DocTx.contentAs(JsonObject.class);
  JsonObject u2Doc = u2DocTx.contentAs(JsonObject.class);

  int user1Balance = getCredits(u1Doc) - creditsToTransfer;
  int user2Balance = getCredits(u2Doc) + creditsToTransfer;
  //update their credits
  ctx.query("UPDATE user_profile._default USE KEYS $1 SET credits = credits - $2", 
    TransactionQueryOptions.queryOptions().parameters(JsonArray.from(sourceUser, creditsToTransfer)));
  ctx.query("UPDATE user_profile._default USE KEYS $1 SET credits = credits + $2", 
    TransactionQueryOptions.queryOptions().parameters(JsonArray.from(targetUser, creditsToTransfer)));

  if(user1Balance < 0) {
    throw new IllegalStateException("User can't have a negative balance");
  }
};
```

Then we can use the `Transactions::run` method to invoke this lambda function as a transaction:

```java
transactions.run(transactionLogic);
```

The cluster will isolate all operations performed inside the lambda from any other application threads or connected to the cluster clients until the lambda execution finishes successfully.
This guarantees that no database client will ever read the new balance for the source account together with the old balance of the target account.

Instead of using `Transactions::run` to create a transaction lambda, the `START TRANSACTION`, `SAVEPOINT` and `COMMIT` statements can also be executed directly as N1QL queries.
It is, however, strongly recommended to use the `Transactions` interface as it automates many tasks required to set up transactions and handle roll backs.

Transactions in Couchbase are atomic: an unhandled error inside the lambda will cause the transaction to fail.
When this happens, Couchbase will roll back all operations performed inside the failed transaction, leaving the cluster in the same state before the transaction started.
To illustrate this property, we check the validity of transfer operations at the end of the lambda and throw an exception if a transfer puts the source account in the negative.
Of course, Such a check would not work anywhere outside a transaction as operations completed before the validation would already be finalized.
However, in this case, the atomicity of transactions makes the check work.

Developers can alter this behavior by using the `AttemptContext` object accepted by transaction lambdas as their first parameter.
To commit (apply) changes made inside a transaction without returning from it use the `AttemptContext::commit()` method, and the `AttemptContext::rollback()` method can be used to roll back transaction operations without throwing an exception.
[Transaction API Javadoc site](https://docs.couchbase.com/sdk-api/couchbase-transactions-java-1.1.8/) provides additional information on these and other API methods and classes.

## Savepoints

Although not required in this example, savepoints is an important feature that allows developers to roll back only part of statements in a transactions.
This sample N1QL code from [N1QL Language Reference](https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/savepoint.html) illustrates it:

```n1ql
BEGIN WORK;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
UPSERT INTO test VALUES("abc2", {"a":1});
SAVEPOINT s1; 
UPDATE test AS d SET d.b = 10 WHERE d.a > 0; 
SELECT d.*, META(d).id FROM test AS d WHERE d.a >= 0;
SAVEPOINT s2; 
UPDATE test AS d SET d.b = 10, d.c = "xyz" WHERE d.a > 0; 
SELECT d.*, META(d).id FROM test AS d WHERE d.a >= 0;
ROLLBACK TRAN TO SAVEPOINT s2; 
SELECT d.*, META(d).id FROM test AS d WHERE d.a >= 0;
COMMIT WORK;
```

Java SDK does not provide interface for Savepoints and partial roll backs.
Therefore, raw N1QL queries should be used if these features are required.

## Conclusion

Creating reliable Java applications that guarantee database consistency with Couchbase is simple.
The Java SDK allows using lambda functions to execute distributed transactions on a Couchbase cluster.
Such programming interface follows commonly used Java patterns and should be familiar to most Java developers.
