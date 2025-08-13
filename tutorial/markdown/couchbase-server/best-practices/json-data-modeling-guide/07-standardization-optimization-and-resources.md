---
# frontmatter
path: "/tutorial-standardization-optimization-and-resources"
title: Standardization, Optimization, and Resources
short_title: Standardize and Optimize
description:
  - Learn about standardization and optimization of your data model
  - Explore some resources to dive deeper into document optimization
  - See examples of standardized fields and why they are recommended
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

Wrapping up our Data Modeling Guide, we talk about standardization and optimization of your documents and modeling and share some resources to help you dive deeper.

## Standardized Fields

### Delimiter

When a Document ID is a combination of two or more parts/values, that should be delimited by a character such as a colon or an underscore. Pick a delimiter, and be consistent throughout your enterprise.

Consider using a single-byte delimiter since this can make a significant difference for large volumes of data.

### Schema

Applications are typically versioned using Semantic Versioning, i.e. 2.5.1. Where:

- 2 is the major version
- 5 is the minor version
- 1 is bugfix/maintenance version

Versioning the application informs users of features, functionality, updates, etc.
The term "schemaless", is often associated with JSON databases. And while this is technically correct, it is better stated as:

> "There is no schema managed by the database, however, there is still a schema, and it is an "Application Enforced Schema." The application is now responsible for enforcing the schema as well as maintaining the integrity of the data and relationships".

As schemas change and evolve, documenting the version of the schema provides a mechanism of notifying applications about the schema version of the document that they're working with.
This also enables a migration path for updating models which is discussed further in the Schema Versioning section.

```json
{
  "_schema": "1.2",
  "userId": 123
}
```

Please refer to _Document Management Strategies_ document for a more thorough discussion of schema versioning.

### Namespacing

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

## Optimizations

JSON gives us a flexible schema that allows our models to rapidly adapt to change. The schema is explicitly stored alongside each value. In an RDBMS, the schema is defined by the table columns, which are defined once.

In any database, every byte of stored data adds up. Often, this has been abstracted from developers as the schema and the database are managed by a DBA. With an application enforced schema, the model size is now controlled by the application. Developers cab be verbose when describing variables throughout our applications, and this practice tends to carry over to our JSON models. While human-readable field names are good for developer productivity, there are often well-understood abbreviations for many fields that will not reduce document readability, and will reduce the footprint of the data.

As a general approach, consider the following options to proactively reduce document sizes:

- Don't store the document ID as a repeated value in the document.
- Convert ISO-8601 timestamps to epoch time in milliseconds, saving at least 11 bytes. When millisecond precision is not required, convert to a smaller value \(i.e. divide by 1000 to convert to seconds, 60 for minutes, 60 for hours, 24 for days\), saving at least 4 bytes.
- Store dates as an ISO format `YYYY-MM-DD` instead of `MMM DD, YYYY`.
- When using GUID's, strip all dashes saving an additional 4 bytes per GUID.
- Use shorter property names.
- Don't store properties whose value is `null` , empty `String/Array/Object`, or a known default.
- Don't repeat values in arrays whose value is not unique, use a top-level property on the document.

### Storing Dates

In almost any application, there is a need to store a date. This could be when the document was created, modified, when an order was placed, etc. Generally, this date is stored in [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) format.

Take the date `2018-12-14T03:45:24.478Z` as an example, this is very _readable_, but is it the most efficient way to store the date?  Storing this same date as [Unix Epoch Time](https://en.wikipedia.org/wiki/Unix_time) we can represent this same date as `1544759124478`.  ISO-8601 is 24 bytes, where epoch format is 13 bytes, this saves 11 bytes.  This might not seem like a lot, but consider this scenario: 500,000,000 documents and each document has an average of 2 date properties.  If we used epoch format, we'd save 11,000,000,000 bytes or 11Gb of space.

Now, take this a step further and ask the question, "What level of precision does the application require?".  Often times we do not need millisecond precision. We can divide the epoch date accordingly for seconds, minutes, hours, etc. This applies if dates are being stored in Epoch format.

| **Epoch Date** | **Precision** | **Reduction** | **Output** | **Length / Bytes** |
| :--- | :--- | :--- | :--- | :--- |
| 1544759124478 | milliseconds | `n/a` | 1544759124478 | 13 |
| 1544759124478 | seconds | `/ 1000` | 1544759124 | 10 |
| 1544759124478 | minutes | `/1000 / 60` | 25745985 | 8 |
| 1544759124478 | hours | `/1000 / 60 / 60` | 429099 | 6 |
| 1544759124478 | days | `/1000 / 60 / 60 / 24` | 17879 | 5 |

Please refer _Document Management Strategies_ guide for a more in-depth discussion of this topic.

## Resources

- [JSON Data Modeling for RDBMS Users](https://blog.couchbase.com/json-data-modeling-rdbms-users/)
- [SQL to JSON Data Modeling with Hackolade](https://blog.couchbase.com/sql-to-json-data-modeling-hackolade/)
- [Moving from SQL Server to Couchbase - Data Modeling](https://blog.couchbase.com/moving-from-sql-server-to-couchbase-part-1-data-modeling/)
