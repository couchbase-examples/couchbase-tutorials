---
# frontmatter
path: "/tutorial-quickstart-nextjs"
title: Using Next.js with Couchbase NodeJS SDK
short_title: Next.js with Node SDK
description: 
  - Learn to build a basic server-side rendered webapp using Next.js and Couchbase
  - See how you can fetch data from Couchbase without exposing API routes
  - Extend your application using Next.js API routes to handle Create, Update, and Delete operations
content_type: tutorial
filter: sdk
technology:
  - kv
  - index
  - query
tags:
  - Next.js
sdk_language: 
  - nodejs
length: 45 Mins
---

<!-- TODO: update this to be sure its working -->
[![Try it now!](https://da-demo-images.s3.amazonaws.com/runItNow_outline.png?couchbase-example=nextjs-quickstart-repo&source=devPortal)](https://gitpod.io/#https://github.com/couchbase-examples/nextjs-quickstart)

## Prerequisites

To run this prebuilt project, you will need:

- A Couchbase Capella cluster or Couchbase 7 installed locally
- NodeJS & NPM (v12+)
- NextJS
- Code Editor
- Follow the [Couchbase Installation Options tutorial](/tutorial-couchbase-installation-options) for more info on installing Couchbase

## What We'll Cover

Bootstrapping a new Next.js app using the 'with-couchbase' example, building out a simple REST API using the API framework built into Next.js and the [NodeJS SDK for Couchbase](https://docs.couchbase.com/nodejs-sdk/current/hello-world/start-using-sdk.html) version 3.x with the following endpoints:

- [Post a Profile](#post-a-profile) – Create a new user profile
- [GET a Profile by Key](#get-a--profile-by-key) – Get a specific profile
- [PUT Profile](#put-profile) – Update a profile
- [DELETE Profile](#delete-profile) – Delete a profile
- [GET Profiles by Searching](#get-profiles-by-searching)  – Get all profiles matching First or Last Name

We'll also build out a basic front-end application with Next.js to interact with the endpoints mentioned above.

## Source Code

The completed source code from this tutorial can be cloned with the following command:

```shell
git clone https://github.com/couchbase-examples/nextjs-quickstart
```

### Update environment variables appropriately

We've included a `.env.local.example` file with blank values for you to copy into a file called `.env.local` and fill in the values. We've also included a `.env.default` file for testing and running in GitPod. In most cases, you can ignore the default config file.
- `CB_USERNAME` - The username of an authorized user on your cluster. Follow [these instructions](https://docs.couchbase.com/cloud/clusters/manage-database-users.html#create-database-credentials) to create database credentials on Capella
- `CB_PASSWORD` - The password that corresponds to the user specified above
- `CB_CONNECT_STRING` - The Couchbase endpoint to connect to. Use `couchbase://localhost` for a local/Docker cluster, or the connection string for a Capella database (formatted like `couchbase://cb.<xxxxxx>.cloud.couchbase.com`)
- `CB_BUCKET` - The bucket you'd like to connect to. Set this to `user_profiles` for this tutorial.

**NOTE on TLS:** The connection logic in this sample app ignores mismatched certificates with the parameter `tls_verify=none`. While this is helpful in streamlining the connection process for development purposes, it should **NOT** be used in production. To learn how to better secure your connection with proper certificates, see [the Node.js TLS connection tutorial](https://developer.couchbase.com/tutorial-nodejs-tls-connection).

## Set up and Run The Application

We'll start by bootstrapping a new Next.js project using the 'with-couchbase' example:

```shell
npx create-next-app --example with-couchbase with-couchbase-app

# or

yarn create next-app --example with-couchbase with-couchbase-app
```

Install required dependencies and run:

```shell
npm install
```

**If you are using Capella**, you'll have to manually create a bucket named `user_profile` and a collection named `profile`. See the documentation on [managing buckets](https://docs.couchbase.com/cloud/clusters/data-service/manage-buckets.html) and [creating a collection](https://docs.couchbase.com/cloud/clusters/data-service/scopes-collections.html#create-a-collection) for more information. Note that this collection should be created on the `_default` scope.

If you have Couchbase running locally, we can the bucket and collection by running the following command:
```shell
npm run init-db:local
```

**Extra Step for Capella Clusters**: if you've manually set up your bucket and collection, you'll need to create the necessary indices as well. To accomplish this, run:
```sh
npm run build-indexes
```
This is because the index creation code is contained within the database initialization script, which we don't use for Capella clusters. Learn more in the section on [Creating Primary Indexes](#creating-primary-indexes) section, and take a look at the example code in the `util/initializeCbServer.js` file to learn how you can programmatically create buckets, collections, and indexes.

Now we're ready to run our application:
```sh
npm run dev
```

## Document Structure

We will be setting up a REST API to manage some profile documents. Our profile document will have an auto-generated UUID for its key, first and last name of the user, and an email. For this demo we will store individual profiles in documents that belong to collection named `profile`:

```json
{
  "pid": "b181551f-071a-4539-96a5-8a3fe8717faf",
  "firstName": "John",
  "lastName": "Wick",
  "email": "johnwick@couchbase.com"
}
```

## Let's Review the Starter Code

The starter application has two main files, `util/couchbase.js` and `pages/index.js`. We'll add a few files to fill out our application further, but first let's review each of these.

**`util/couchbase.js`:**

The `couchbase.js` file contains all logic for connecting to the database. It validates environment variables and checks for an open connection before creating and returning cluster, bucket, and collection objects. Our other files can import the `connectToDatabase()` function to gain access to each of these objects.

```js
export async function connectToDatabase() {
  const cluster = await createCouchbaseCluster()
  const bucket = cluster.bucket(CB_BUCKET);
  const collection = bucket.defaultCollection();
  const profileCollection = bucket.collection('profile');

  let dbConnection = {
    cluster,
    bucket,
    collection,
    profileCollection,
  }

  return dbConnection;
}
```

Note the addition of `profileCollection` to this function, which specifies which collection we'll use for this project.

**`pages/index.js`:**

The index page renders content for our homepage and includes a `getServerSideProps()` function that is automatically run on each page load and injects props into the React component rendered by the index page.

```js
export async function getServerSideProps(context) {
  let connection = await connectToDatabase();
  const {cluster, bucket, collection, profileCollection} = connection;
  // checks connection
  return {
    props: { isConnected },
  }
}
```

The logic for checking the connection can be viewed in the file and is included in the `with-couchbase` Next.js example. If your connection is working, you are ready to move onto the next steps and start coding!

**`pages/_app.js`**
This file just provides a wrapper App component to provide more control on page initialization. This allows us to use the global stylesheet. See <https://nextjs.org/docs/advanced-features/custom-app[this> article] from the Next.js docs for more info.

## Creating Primary Indexes

In order to ensure queries run, we need to create two primary indexes, one for our user_profile bucket and another for our `profile` collection. The collection index is used by the `"/api/user"` GET endpoint that utilizes a N1QL query to search the database for profile documents where `firstName` or `lastName` match the search value. The bucket index can be used in the case that any documents are added to the bucket's default collection or manually from the Couchbase Web UI.

There are several ways to build these indexes. For example, you could run the following `CREATE PRIMARY INDEX ...` lines as queries in the query workbench on the web UI. However, the following function accomplishes index creation and can be called from `util/initializeCbServer.js` so that indexes will be automatically created along with the buckets and collections (using `npm run init-db:local`).

```js
export const ensureIndexes = async(CB_BUCKET) => {
  let {cluster} = await connectToDatabase();
  try {
    const bucketIndex = `CREATE PRIMARY INDEX ON ${CB_BUCKET}`
    const collectionIndex = `CREATE PRIMARY INDEX ON default:${CB_BUCKET}._default.profile;`
    await cluster.query(bucketIndex)
    await cluster.query(collectionIndex)
    console.log(`Index Creation: SUCCESS`)
  } catch (err) {
    if (err instanceof couchbase.IndexExistsError) {
      console.info('Index Creation: Indexes Already Exists')
    } else {
      console.error(err)
    }
  }
}
```

Now we can move onto reviewing each of the individual endpoints. Next.js has a built-in API framework that we'll leverage to interact with our Couchbase data source.

## API Setup

We'll start by adding an `api/` directory inside the `pages/` directory. Any file within this directory will be mapped to an API endpoint, so we'll also create a file called `user.js` and add a handler function. This function will handle ALL request types to this endpoint, so we'll also need to check the request type and handle it accordingly. We'll also need to connect to the database and parse the body if it exists.

```js
export default async function handler(req, res) {
  const {cluster, bucket, profileCollection} = await connectToDatabase();
  let body = !!req.body ? JSON.parse(req.body) : null;
  if (req.method === 'POST') {
    // handle POST request
  } else if (req.method === 'PUT') {
    // handle PUT request
  } else if (req.method === 'GET') {
    // handle GET request (search)
  } else if (req.method === 'DELETE') {
    // handle DELETE request
  }
}
```

Next, we'll fill in logic to handle each of the request types.

## POST a Profile

After checking that the body contains the proper fields, we create a profile document using the SDK `.insert()` method using the `profileCollection`. Note that you will need to install the `uuid` package (to generate unique IDs) via npm or yarn and import them in `user.js`.

```js
if (req.method === 'POST') {
  /**
   *  POST HANDLER
   */
  if (!body.email) {
    return res.status(400).send({
      "message": 'email is required'
    })
  }

  const id = v4();
  const profile = {
    pid: id,
    ...body,
  }
  await profileCollection.insert(profile.pid, profile)
      .then((result) => {
        res.status(201).send({...profile, ...result});
      })
      .catch((e) => {
        res.status(500).send({
          "message": `Profile Insert Failed: ${e.message}`
        })
      })
}
```

Let’s break this code down.

First, we check that an email was sent with the body and then create a `profile` object based on the data that was sent in the request. The `pid` that we’re saving into the account object is a unique key.

After we check for required body parameters, we can asynchronously write to the `profileCollection` using the `insert` method and then return the document saved back to the user. We utilize the spread operator again to make this simple. `insert` is a basic key-value operation.

### Create Profile UI
> NOTE: The UI source code for this quickstart guide is quite a bit more complex (due to styling and layout) than the inline code blocks outlined in this tutorial. The functionality, however, is the same. The original code can be found in the [v1 branch](https://github.com/couchbase-examples/nextjs-quickstart/tree/v1).

Next, lets add a simple front-end form to create user profiles. On the `index.js` page, remove all markup between the &lt;main&gt; tags and add the following form:

```html
<form onSubmit={handleProfilePost}>
    <input type="text" placeholder="First Name" name="firstName"/>
    <input type="text" placeholder="Last Name" name="lastName"/>
    <input type="email" placeholder="Email" name="email"/>
    <button type="submit">Post Profile</button>
</form>
```

We'll handle this request in a function on `index.js` inside `Home()`:

```js
const handleProfilePost = async (event) => {
    await fetch("http://localhost:3000/api/user", {
        method: 'POST',
        body: JSON.stringify({
            firstName: event.target.firstName.value,
            lastName: event.target.lastName.value,
            email: event.target.email.value,
        })
    })
}
```

Note: in the completed quickstart code, fetch URLs use a dynamic `origin` variable instead of hard coding `http://localhost:3000` to ensure requests work when running in other environments.

## GET a Profile by Key

Although the API framework baked into Next.js is highly powerful, Next is ALSO capable of fetching data from the database using the `getServerSideProps()` function in `index.js`. We'll fetch a profile by key using this method to demonstrate the versatility of Next.js.

Add the following function to the bototm of `index.js` to retrieve a Profile by Profile ID using the SDK `.get()` method` using the `profileCollection`.

```js
async function getProfileByKey(collection, key) {
  try {
    let res = await collection.get(key);
    return res.content;
  } catch (err) {
    return err;
  }
}
```

We only need the profile ID from the user to retrieve a particular profile document using a basic key-value operation. We can catch the error if the key-value operation fails and return an error message.

You can now call this function from `getServerSideProps()` and simply inject the return value into the props:

```js
  let profile = JSON.parse(JSON.stringify(await getProfileByKey(collection, '<ADD AN EXISTING PID HERE>')));

  return {
    props: {isConnected, profile },
  }
```

Note that we'll stringify then re-parse the data to avoid any issues with JSON serialization. This is just a quirk of Next.js that can sometimes cause a bug, so it's better to ensure proper serialization.

### Read Profile UI
> NOTE: The UI source code for this quickstart guide is quite a bit more complex (due to styling and layout) than the inline code blocks outlined in this tutorial. The demo app uses a `UserRow` component rather than a `UserCard`, but the functionality of each is roughly the same. The original code can be found in the [v1 branch](https://github.com/couchbase-examples/nextjs-quickstart/tree/v1).

To display the user we've fetched, we'll also add a custom React component. To accomplish this, create a new directory outside of `pages/` and call it `components`. Within `components/` add a `UserCard.js` file for the following component:

```js
export const UserCard = (props) => {
  return (
      <div style={{marginRight: '10px', marginLeft: '10px', border: '1px solid #8f8f8f', borderRadius: '10px', padding: '10px'}}>
        <p><strong>{props.firstName}</strong> {props.lastName}</p>
        <p>{props.email}</p>
        <em>{!!props.pid && 'PID: ' + props.pid}</em>
      </div>
  );
}
```

Now we can go back to `index.js` and add the following markup to display the user we've fetched:

```html
<UserCard firstName={profile.firstName} lastName={profile.lastName} email={profile.email} pid={profile.pid} />
```

Once we can see the profile, lets add logic to edit it.

## PUT Profile

Update a Profile by Profile ID by using the SDK `.upsert()` method on the `profileCollection`. We'll add the following code to our `user.js` file to handle PUT requests:

```js
  try {
      await profileCollection.get(req.query.pid)
          .then(async (result) => {
            /* Create a New Document with new values,
              if they are not passed from request, use existing values */
            const newDoc = {
              pid: result.content.pid,
              firstName: body.firstName ? body.firstName : result.content.firstName,
              lastName: body.lastName ? body.lastName : result.content.lastName,
              email: body.email ? body.email : result.content.email
            }

            /* Persist updates with new doc */
            await profileCollection.upsert(req.query.pid, newDoc)
                .then((result) => res.send({ ...newDoc, ...result }))
                .catch((e) => res.status(500).send(e))
          })
          .catch((e) => res.status(500).send({
            "message": `Profile Not Found, cannot update: ${e.message}`
          }))
    } catch (e) {
      console.error(e)
    }
```

We don't need to specify the `pid` as it already exists, so when we create the profile document, we just need the profile information (`firstName`, `lastName`, and `email`). The user may only be changing one or many fields in the document so we first retrieve the existing document and check for differences and only update the fields needed to be changed.

We first look up the existing document and make sure it exists, if it does not, return a 500 level error code and message: "Cannot update: document not found".

Then, all changed fields in the document get replaced except for the document key and the `pid` field.

Next, we replace the existing fields if we have a value from the HTTP Request (`req.body.whatever`). If we do not have a value in the request for a specific field, we simply reuse the existing document's `result.value.whatever.

Finally, we create an async call to the `profileCollection` using the `upsert` method and then return the document saved and the result just as we did in the previous endpoint.

### Edit Profile UI
> NOTE: The UI source code for this quickstart guide is quite a bit more complex (due to styling and layout) than the inline code blocks outlined in this tutorial. The functionality, however, is the same. The original code can be found in the [v1 branch](https://github.com/couchbase-examples/nextjs-quickstart/tree/v1).

Let's add another front-end form to enable editing:

```html
<form onSubmit={handleProfilePut}>
    <input type="text" placeholder="PID to Update" name="pid"/>
    <input type="text" placeholder="New First Name" name="firstName"/>
    <input type="text" placeholder="New Last Name" name="lastName"/>
    <input type="email" placeholder="New Email" name="email"/>
    <button type="submit">Update Profile</button>
</form>
```

We can handle edits with the following function:

```js
const handleProfilePut = async (event) => {
  await fetch(`http://localhost:3000/api/user?pid=${event.target.pid.value}`, {
    method: 'PUT',
    body: JSON.stringify({
      firstName: event.target.firstName.value,
      lastName: event.target.lastName.value,
      email: event.target.email.value
    })
  })
}
```

By pasting the PID into the field and filling in any of the form fields in the edit form, you'll be able to edit the document of the PID specified.

## DELETE Profile

To delete profiles, we'll first need to update our `UserCard` with a delete button:

```js
export const UserCard = (props) => {
  const handleDeletion = async (event) => {
    await fetch(`http://localhost:3000/api/user?pid=${props.pid}`, {
      method: 'DELETE',
    }).then(async (data) => {
      console.log(data);
    })
  }
  return (
      <div style={{marginRight: '10px', marginLeft: '10px', border: '1px solid #8f8f8f', borderRadius: '10px', padding: '10px'}}>
        <p><strong>{props.firstName}</strong> {props.lastName}</p>
        <p>{props.email}</p>
        <em>{!!props.pid && 'PID: ' + props.pid}</em>
        <br/>
        <button onClick={handleDeletion}>Delete</button>
      </div>
  );
}
```

Next, we'll add the following to `user.js` to handle DELETE requests. Delete Profile by Profile ID by using the SDK `.delete()` method on the `profileCollection`.

```js
try {
      await profileCollection.remove(req.query.pid)
          .then((result) => {
            res.status(200).send("Successfully Deleted: " + req.query.pid)
          })
          .catch((error) => res.status(500).send({
            "message": `Profile Not Found, cannot delete: ${error.message}`
          }))
    } catch (e) {
      console.error(e)
    }
```

We only need the profile ID from the user to delete using a basic key-value operation.

Now you'll see a 'Delete' button on the user profile we've fetched via a hard-coded id in `getServerSideProps()`. To avoid any errors that may stem from the deletion of this hardcoded document we're fetching, let's just comment that logic out. We're going to add a more robust 'GET' route in the next step.

```js
  // let profile = JSON.parse(JSON.stringify(await getProfileByKey(profileCollection, '1cfaaa82-e63e-4207-addf-f023763d0374')));

  return {
    props: {isConnected, /* profile */ },
  }
```

Note that you must also remove/comment out the UserCard markup for this profile.

## GET Profiles

Earlier, we fetched a singular profile by its key. In this step, we'll add logic to search through all profiles and return those that match a search string. Get user profiles using the `cluster.query()` method in the SDK and results are returned based on firstName or lastName with support to paginate results. Add the following to handle GET requests in `user.js`.

```js
try {
  const options = {
    parameters: {
      SKIP: Number(req.query.skip || 0),
      LIMIT: Number(req.query.limit || 5),
      SEARCH: req.query.search ? `%${req.query.search.toLowerCase()}%` : null
    }
  }

  const query = options.parameters.SEARCH == null ? `
      SELECT p.*
      FROM ${process.env.CB_BUCKET}._default.profile p
      LIMIT $LIMIT OFFSET $SKIP;
      ` : `
      SELECT p.*
      FROM ${process.env.CB_BUCKET}._default.profile p
      WHERE lower(p.firstName) LIKE $SEARCH OR lower(p.lastName) LIKE $SEARCH
      LIMIT $LIMIT OFFSET $SKIP;
    `
  await cluster.query(query, options)
      .then((result) => res.send(result.rows))
      .catch((error) => res.status(500).send({
        "message": `Query failed: ${error.message}`
      }))
} catch (e) {
  console.error(e)
}
```

his endpoint is different from the others as it makes a N1QL query rather than a key-value operation. This involves additional overhead because the query engine is involved. Remember that the `profileCollection` index (primary) was set up specifically to enable this endpoint.

Our `req.body` has three query params: `skip`, `limit`, and `search`.

We also have default values set up in case they are not provided, `0` for skip or `5` for limit. If the search string is not provided, it will default to null in which case the query string used will fetch all documents within the proflie collection.

Then, we build our N1QL query using the parameters we just created.

Finally, we pass that `query` and the `options` to the `cluster.query()` method and return the result.

Take notice of the N1QL syntax format and how it targets `bucket`.`scope`.`collection`.

### Search Profiles UI
> NOTE: The UI source code for this quickstart guide is quite a bit more complex (due to styling and layout) than the inline code blocks outlined in this tutorial. The functionality, however, is the same. The original code can be found in the [v1 branch](https://github.com/couchbase-examples/nextjs-quickstart/tree/v1).

Let's add yet another form with a search field, and a flexbox to display results to enable easy search and retrieval of multiple profiles.

```html
<form onSubmit={handleProfileSearch}>
    <input type="text" placeholder="Search String" name="searchString"/>
    <button type="submit">Search</button>
</form>

<h4>Profile Search Results:</h4>
<div style={{ display: "flex" }}>
    {searchResults !== null && searchResults.map((userProfile) => {
      console.log(userProfile);
      return (
          <UserCard firstName={userProfile.firstName} lastName={userProfile.lastName} email={userProfile.email} pid={userProfile.pid} allowDelete={true}/>
      )
    })
    }
</div>
```

We can handle searches with a similar handler function to the POST and PUT/Update buttons:

```js
  const handleProfileSearch = async (event) => {
    event.preventDefault();

    await fetch(`http://localhost:3000/api/user?search=${event.target.searchString.value}`, {
      method: 'GET',
    }).then(async (data) => {
      setSearchResults(await data.json());
    })
  }
```

We'll also need to add a state array inside the `Home()` function to keep track of the search results:

```js
const [searchResults, setSearchResults] = useState([]);
```

## Notes About the Quickstart Code

- We've included a `.env.default` file which is used for testing and gitpod instances of the project to ensure smooth setup in these environments.

- In the completed quickstart code, fetch URLs use a dynamic `origin` variable instead of hard coding `http://localhost:3000` to ensure requests work when running in other environments.

## Conclusion

Next.js offers powerful tooling to create custom pages, components, and API endpoints. We've learned how to fetch data from within a page as well as add POST, PUT, GET, and DELETE routes to handle more complex backend logic from a single file (`user.js`). We also briefly touched on creating custom components that don't render as pages but rather function as elements to build your pages effortlessly.

Although this example is by no means a production ready web app, it should provide the necessary knowledge, and a great jumping off point for more complex applications.
