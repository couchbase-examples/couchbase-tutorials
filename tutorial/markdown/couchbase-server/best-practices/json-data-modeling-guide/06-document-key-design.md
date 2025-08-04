---
# frontmatter
path: "/tutorial-document-key-design"
title: Document Key Design
short_title: Document Key Design
description: 
  - Learn how to design your document keys to ensure your application can perform its best
  - See examples of several patterns you can follow when designing a document key
  - Explore the benefits of combining key design patterns
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

An important part of JSON database modeling is how to design document keys. There are different patterns as mentioned below when it comes to designing a document key.

- Prefixing
- Predictable
- Counter ID
- Unpredictable
- Combinations

## Prefixing

Remember that in Couchbase, different types of documents should be stored in separate collections. For example, users, orders, and products should each have their own collection within a scope. You do not need prefixing to isolate document types.

However, if you want to use prefixing for other purposes, pick a delimiter, and be consistent throughout your enterprise. For instance, you might use any of these approaches: `myPrefix:123`, `myPrefix_123`, or `myPrefix::123`.

You may also use a prefix as a combination of two other documents (similar to a composite key), in order to store information on the relationship between those documents.

For instance:

- `123::987` in the `studentEnrollment` collection may be a document with information about student 123's enrollment in class 987. 

## Predictable

Let's say we're storing a user profile. Assuming no cookies, what are we guaranteed to know about our user after they've logged in? Well, one thing would be their login name.

To make life easy for ourselves in retrieving the user profile, key it with that user's login name. Everything else we need to know about that person could be derived from their user profile, in one way or another.

But since keys are immutable, for a user to change their login name, we now have to either create a new user profile under a new key or create a look-up document. We could insist that our users can never change their login names but it's unreasonable to make our users suffer unnecessarily.

The main downside of a predictable key is that, usually, it'll be an element of the data that we're storing.

![Predictable Key](./assets/predictable_key.png)

## Counter ID

We can get Couchbase to generate a numeric key by using a counter. If you're using a counter ID pattern, every insert (not update) requires 2 mutations. One to increment a counter document and the other to mutate the document.

Here's how it works:

1. Someone fills out the new user account form and clicks "Submit".
2. Increment our counter document and it returns the next number up (e.g. 123).
3. Create a new user profile document keyed with 123.
4. Create look-up documents for things such as their user id, enabling us to do a simple look-up on the data we hold at login time.

![Counter Key](./assets/counter_key.png)

We also get some additional benefits from this pattern, such as a counter providing us with some details of many user profiles we've created during the application's lifetime.

## Unpredictable

This pattern uses system generated unique IDs like UUID.

![Unpredictable Key](./assets/unpredictable_key.png)

## Combinations

Combining these methods can lead to the optimal strategy for your application.

We've looked before at when to embed data in one large document and when it's best to refer to other documents. When we choose to refer to data held in separate documents, we can build predictable key names from components that tell us something about what the document holds.

Let's look at our user profile again. The main document is stored under the key 1001. We're working on an ecommerce site so we also want to know all of the orders our customer has made. Simple: we store the list of orders under the key `1001:orders` in a `customerOrders` collection.

Similarly, our system might judge what sort of marketing emails to send to customers based on their total spend with the site. Rather than have the system calculate that each time, it can be calculated once and then stored for later retrieval under the key `1001:orders:value` in a `customerOrdersTotalSpend` collection.
