---
# frontmatter
path: "/tutorial-schemaless-data-modeling"
title: Schemaless Data Modeling
short_title: Schemaless Data Modeling
description: 
  - Learn how document-based databases offer schemaless data storage and simplify application development
  - Explore important design considerations to keep in mind when designing JSON documents
  - See how you can use Couchbase's built-in Compare and Swap (CAS) functionality to maintain data consistency
content_type: tutorial
filter: sql++
technology:
  - kv
  - capella
  - server
tags:
  - Data Modeling
sdk_language: 
  - any
length: 10 Mins
---

When you use documents to represent data, a database schema is optional. The majority of your effort will be creating one or more documents that will represent application data. This document structure can evolve over time as your application grows and adds new features.

In Couchbase Server you do not need to perform data modeling and establish relationships between tables the way you would in a traditional relational database. Technically, every document you store with structure in Couchbase Server has its own implicit schema; the schema is represented in how you organize and nest information in your documents.

While you can choose any structure for your documents, the JSON model in particular will help you organize your information in a standard way, and enable you to take advantage of Couchbase Server's ability to index and query. As a developer you benefit in several ways from this approach:

- Extend the schema at run time, or anytime. You can add new fields for a type of item anytime. Changes to your schema can be tracked by a version number, or by other fields as needed.
- Document-based data models may better represent the information you want to store and the data structures you need in your application.
- You design your application information in documents, rather than model your data for a database.
- Converting application information into JSON is very simple; there are many options, and there are many libraries widely available for JSON conversion.
- Minimization of one-to-many relationships through use of nested entities and therefore, reduction of joins.

There are several considerations to have in mind when you design your JSON document:

- What particular keys, ids, prefixes or conventions you want to use for items, for instance **beer\_My\_Brew**.
- When you want a document to expire, if at all, and what expiration would be best.
- If want to use a document to access other documents. In other words, you can store keys that refer other documents in a JSON document and get the keys through this document. In the NoSQL database jargon, this is often known as using _composite keys_.

You can group together sets of records into collections. For example, the following JSON document could be in the "beers" collection. A document that represents another kind of entity would be in a different collection, such as _brewery_ or _user_.

```json
{
  "beer_id": "beer_Hoptimus_Prime",
  "abv": 10,
  "category": "North American Ale",
  "name": "Hoptimus Prime",
  "style": "Double India Pale Ale"
}
```

Here is another document in the _breweries_ collection:

```json
{
  "brewery_id": "brewery_Legacy_Brewing_Co",
  "name": "Legacy Brewing Co.",
  "address": "525 Canal Street, Reading, Pennsylvania, 19601 United States",
  "updated": "2010-07-22 20:00:20"
}
```

What happens if we want to change the fields we store for a brewery? Add the fields to brewery documents. In this case we decide later that we want to include GPS location of the brewery:

```json
{
  "brewery_id": "brewery_Legacy_Brewing_Co",
  "name": "Legacy Brewing Co.",
  "address": "525 Canal Street, Reading, Pennsylvania, 19601 United States",
  "updated": "2010-07-22 20:00:20",
  "latitude": -75.928469,
  "longitude": 40.325725
}
```

In the case of document-based data, we extend the record by just adding the two new fields for _latitude_ and _longitude_. When we add other breweries after this one, we would include these two new fields. For older breweries we can update them with the new fields or provide programming logic that shows a default for older breweries. The best approach for adding new fields to a document is to perform a compare and swap operation on the document to change it; with this type of operation, Couchbase will send you a message that the data has already changed if someone has already changed the record. For more information about compare and swap methods with Couchbase, see [Compare and Swap (CAS)](https://docs.couchbase.com/java-sdk/current/howtos/concurrent-document-mutations.html).

To create relationships between items, we again use fields. In this example we create a logical connection between beers and breweries using the _brewery_ field in our beer document which relates to the _ID_ field in the brewery document. This is analogous to the idea of using a foreign key in traditional relational database design.

This first document represents a beer, Hoptimus Prime:

```json
{
  "beer_id": "beer_Hoptimus_Prime",
  "abv": 10,
  "brewery": "brewery_Legacy_Brewing_Co",
  "category": "North American Ale",
  "name": "Hoptimus Prime",
  "style": "Double India Pale Ale"
}
```

This second document represents the brewery which brews Hoptimus Prime:

```json
{
  "brewery_id": "brewery_Legacy_Brewing_Co",
  "name": "Legacy Brewing Co.",
  "address": "525 Canal Street Reading, Pennsylvania, 19601 United States",
  "updated": "2010-07-22 20:00:20",
  "latitude": -75.928469,
  "longitude": 40.325725
}
```

In our beer document, the _brewery_ field points to '**brewery\_Legacy\_Brewery_Co**', which is the key for the document that represents the brewery. By using this model of referencing documents within a document, we create relationships between application objects.
