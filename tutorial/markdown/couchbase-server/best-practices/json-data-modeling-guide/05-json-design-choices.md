---
# frontmatter
path: "/tutorial-json-design-choices"
title: JSON Design Choices
short_title: JSON Design Choices
description: 
  - Learn about the different design choices that impact JSON document design
  - Explore versioning and document structure in more depth
  - Learn the difference between objects and object arrays
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
length: 20 Mins
---

Couchbase neither enforces nor validates for any particular document structure. Below are the design choices that impact JSON document design.

- **Document typing and versioning**
  - Key Prefixing
  - Document Management fields
- **Document structure choices**
  - Field name choice, length, style, consistency, etc.
  - Use of root attribute
  - Objects vs. Arrays
  - Array element complexity
  - Timestamp format
  - Valued, Missing, Empty, and Null attribute values

## Document Collections

In Couchbase, different types of documents should be stored in separate collections. For example, users, orders, and products should each have their own collection within a scope.

Each document key only needs to be unique within its collection. You do not need to include prefixes or type indicators in the key. For instance, a document in the users collection might simply use the key "123":

```json
key: "123"
{
  "firstName": "Leslie",
  "lastName": "Knope"
}
```

## Document Management Fields

It may be helpful for documents to contain a version property and other document management fields.  Depending on your application requirements, use case, the line of business, etc. other common properties to consider at:

- `_created` - A timestamp of when the document was created in epoch time (milliseconds or seconds if millisecond precision is not required)  
- `_createdBy` - A user ID/name of the person or application that created the document
- `_modified` - A timestamp of when the document was last modified in epoch time (milliseconds or seconds if millisecond precision is not required)
- `_modifiedBy` - A user ID/name of the person or application that modified the document
- `_accessed` - A timestamp of when the document was last accessed in epoch time (milliseconds or seconds if millisecond precision is not required)
- `_geo` - A 2 character ISO code of a country

The use of a leading `_` creates a standardized approach to global attributes across all documents within the enterprise.

```json
{
  "_schema": "1.2",
  "_created": 1544734688923
}
```

The same can be applied through a top-level property i.e. `"meta": {}`.

```json
{
  "meta": {
    "schema": "1.2",
    "created": 1544734688923
  },
  "shoeSize": 13
}
```

Choose an approach that works within your organization and be consistent throughout your applications.

> **Note**: There is not a right or wrong property name. However, if your application will be using Couchbase Mobile (in particular Sync-Gateway / Capella App Services), the use of a leading underscore should be avoided, as any document that contains [root level properties of reserved property names](https://docs.couchbase.com/sync-gateway/current/data-modeling.html) will be rejected. This is not a bug, and it meant to support backward compatibility with v1.0 of the replication protocol.

## Field name length, style, consistency

- Brevity is beautiful at scale (e.g., 11 vs 6 characters * 1B documents) `geoCode vs countryCode`
- Self-documenting names reduce doc effort/maintenance `userName vs usyslogintxt`
- Consistent patterns reduce bugs (pick and stick to a standard) `firstName or first_name or firstname`, but pick one.
- Use plural names for array fields, and singular for others `"phones": [ ... ], "address": { ... }, "genre": " ... ", "scale": 2.3`.
- Avoid words that are reserved in SQL++: `user, bucket, cluster, role, select, insert` etc., Please refer to [SQL++ Reserved Words](https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/reservedwords.html) for more details on how to escape reserved words in SQL++.
- Use letters, numbers, or underscore: `first_name vs first-name`.

## Objects vs. Object Arrays

There are two different ways to represent objects.

- **Objects** - In this choice, `phones` is an object in the `userProfile` class.

```json
{
  "created": "2015-01-28T13:50:56",
  "dateOfBirth": "1986-06-09",
  "email": "andy.bowman@games.com",
  "firstName": "Andy",
  "gender": "male",
  "lastName": "Bowman",
  "phones": {
    "number": "212-771-1834",
    "type": "cell"
  },
  "pwd": "636f6c6f7261646f",
  "status": "active",
  "title": "Mr",
  "updated": "2015-08-25T10:29:16",
  "username": "copilotmarks61569"
}
```

- **Object Arrays** - In this choice, `phones` is an array of objects in the `userProfile` class.

```json
{
  "created": "2015-01-28T13:50:56",
  "dateOfBirth": "1986-06-09",
  "email": "andy.bowman@games.com",
  "firstName": "Andy",
  "gender": "male",
  "lastName": "Bowman",
  "phones": [
    {
      "number": "212-771-1834",
      "type": "cell"
    }
  ],
  "pwd": "636f6c6f7261646f",
  "status": "active",
  "title": "Mr",
  "updated": "2015-08-25T10:29:16",
  "username": "copilotmarks61569"
}
```

## Array element complexity and use

Array values may be _simple_ or _object_.

- Store key to lookup/join
  - In this choice, _tracks_ is an array of strings which contain track IDs. Let's say we have to get the _track_ and _artist_ name for each of the track id, in which case we will end up doing multiple _gets_. So, this choice will have a significant impact when the user base is high, say we have 1M users accessing this information which translates to 3M _gets_ for this playlist.

```json
{
  "created": "2014-12-04T03:36:18",
  "id": "003c6f65-641a-4c9a-8e5e-41c947086cae",
  "name": "Eclectic Summer Mix",
  "owner": "copilotmarks61569",
  "tracks": [
    "9FFAF88C1C3550245A19CE3BD91D3DC0BE616778",
    "3305311F4A0FAAFEABD001D324906748B18FB24A",
    "0EB4939F29669774A19B276E60F0E7B47E7EAF58"
  ],
  "updated": "2015-09-11T10:39:40"
}
```

- Another approach is to nest a summary (copy some of the attributes from other documents) to avoid a lookup/join
  - There are lot of advantages in this approach over the first one. In this choice, only _one_ get is required to retrieve all the information that we need regarding the playlist.
  - However, is this copied data is changed often, it might not be worth duplicating data

```json
{
  "created": "2014-12-04T03:36:18",
  "id": "003c6f65-641a-4c9a-8e5e-41c947086cae",
  "name": "Eclectic Summer Mix",
  "owner": "copilotmarks61569",
  "type": "playlist",
  "tracks": [
    {
      "id": "9FFAF88C1C3550245A19CE3BD91D3DC0BE616778",
      "title": "Buddha Nature",
      "artist": "Deuter",
      "genre": "Experimental Electronic"
    },
    {
      "id": "3305311F4A0FAAFEABD001D324906748B18FB24A",
      "title": "Bluebird Canyon Stomp",
      "artist": "Beaver & Krause",
      "genre": "Experimental Electronic"
    }
  ],
  "updated": "2015-09-11T10:39:40"
}
```

## Timestamp Format

Working with Timestamp format is the difficult thing when it comes to JSON, since JSON does not have a standardized date format. Dates are commonly stored as string in JSON.

The following are examples of commonly used date formats.

- **ISO8601**

```json
{
  "countryCode": "US",
  "gdp": 53548,
  "name": "United States of America",
  "region": "Americas",
  "region-number": 21,
  "sub-region": "Northern America",
  "updated": "2010-07-15T15:34:27"
}
```

- **Time Component Array** - This format can be extremely useful when you trying to group data. Lets say, you want to generate time series graph and this choice best suits when you want to visualize data.

```json
{
  "countryCode": "US",
  "gdp": 53548,
  "name": "United States of America",
  "region": "Americas",
  "region-number": 21,
  "sub-region": "Northern America",
  "updated": [ 2010, 7, 15, 15, 34, 27 ]
}
```

- **Epoch / Unix** - Epoch format is a numeric value specifying the number of seconds that have elapsed since 00:00:00 Thursday, 1 January 1970. Epoch format is the most efficient in terms of brevity, especially if you reduce the granularity. This is the preferred format when you have to do some kind of date comparison, sorting etc.

```json
{
  "countryCode": "US",
  "gdp": 53548,
  "name": "United States of America",
  "region": "Americas",
  "region-number": 21,
  "sub-region": "Northern America",
  "updated": 1279208067000
}
```

## Four states of data presence in JSON docs

It is important to understand that JSON supports optional properties. If a property has a null value, consider dropping it from the JSON unless there's a good reason not to. N1QL makes it easy to test for missing or null property values. Be sure your application code handles the case where a property value is missing.

- Fields may have a value

  ```sql
  SELECT geocode WHERE geocode IS VALUED
  ```

  ```json
  {
    "geocode": "USA"
  }
  ```

- Fields may have no value

  ```sql
  SELECT geocode WHERE geocode IS NOT VALUED
  ```

  ```json
  {
    "geocode": ""
  }
  ```

- Fields may be missing

  ```sql
  SELECT geocode WHERE geocode IS [NOT] MISSING
  ```

  ```json
  {
  }
  ```

- Fields may be explicitly null

  ```sql
  SELECT geocode WHERE geocode IS [NOT] NULL
  ```

  ```json
  {
    "geocode": null
  }
  ```
