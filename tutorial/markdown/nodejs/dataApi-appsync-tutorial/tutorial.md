---
# frontmatter
path: "/tutorial-appsync-data-api-streamlit-travel-sample"
title: Build a Geospatial Hotel Search App with AWS AppSync, Couchbase Data API, and Streamlit
short_title: Geospatial Hotel Search with AppSync & Data API
description:
  - Build a serverless geospatial hotel search application using AWS AppSync GraphQL and Couchbase Data API.
  - Learn how to integrate Couchbase Data API with AppSync resolvers for RESTful access to your cluster.
  - Implement geospatial distance calculations using SQL++ queries.
  - Create an interactive map-based UI with Streamlit to visualize hotels near airports.
content_type: tutorial
filter: sdk
technology:
  - query
  - kv
tags:
  - GraphQL
  - Data API
  - Streamlit
sdk_language:
  - nodejs
  - python
length: 45 Mins
---

## Tutorial: AppSync + Couchbase Data API + Streamlit (Travel Sample)

![Final result (Streamlit map)](streamlit-map.jpg)

If you want to see the final code you can refer to it here: [Final Demo Code](https://github.com/couchbase-examples/couchbase-data_api-appsync-demo)

This guide walks you through building a geospatial hotel search demo that finds hotels within a specified distance from airports. The application uses AWS AppSync (GraphQL) with environment variables for credential management, Couchbase Data API for executing SQL++ queries, and a Streamlit frontend for interactive map visualization — end to end, with inlined code.

### Prerequisites
- Couchbase Capella account with the Travel Sample dataset loaded and credentials that can access it (and network access allowed).
  - Learn/setup here: [Couchbase Data API Prerequisites](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html#prerequisites)
- Couchbase Data API docs (enable Data API, copy endpoint)
  - [Data API Docs](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html)

---

### Enable Couchbase Data API

**What is Data API?**
Couchbase Data API provides a RESTful HTTP interface to your cluster. Instead of embedding the Couchbase SDK in your app, you make standard HTTP requests to query, insert, or update documents. This is perfect for serverless architectures (like AppSync) because:
- No heavy SDK initialization on cold starts
- Works from any language with HTTP support

**Steps:**
1. In Capella, enable Data API for your project/cluster (single click in the cluster settings).
2. Copy the Data API base URL (something like `https://your-cluster.apps.cloud.couchbase.com`). Keep your Couchbase username/password handy.
3. Ensure the Travel Sample bucket (`travel-sample`) is loaded and accessible.

#### Screenshot
![Couchbase Data API endpoint](data-api-endpoint.jpg)

**Notes:**
- We will query `travel-sample.inventory.hotel` and `travel-sample.inventory.airport` collections using a geospatial distance calculation.
- Credentials are configured as environment variables in AppSync and used by the resolver to call Data API.
- Data API authenticates each request via Basic auth (username:password Base64-encoded in the `Authorization` header).
- The query uses SQL++ Common Table Expressions (CTEs) to first find the airport, then calculate distances to nearby hotels.

---

### Create AWS AppSync GraphQL API

**Why AppSync?**
AppSync provides a managed GraphQL layer with built-in auth, and logging. It lets your frontend speak GraphQL while your backend (Data API) speaks SQL++. The resolver bridges the two.

**Steps:**
1. Create an AppSync GraphQL API with Public API (we'll use API key auth for demo simplicity).

#### Define the schema (paste into the schema editor)

This schema defines:
- `Hotel`: type matching the Travel Sample hotel documents with all fields including geo location and reviews.
- `Airport`: type with `name` and nested `location` (GeoObject) representing airport information.
- `GeoObject`: shared type for latitude, longitude, and accuracy used by both hotels and airports.
- `Output`: response type that returns both `hotels` array and `airport` object.
- `Query.listHotelsNearAirport`: the main query that takes an airport name and distance in km, returns hotels within that radius plus the airport information.

```graphql
type Airport {
	location: GeoObject
	name: String
}

type GeoObject {
	accuracy: String
	lat: Float
	lon: Float
}

type Hotel {
	address: String
	alias: String
	checkin: String
	checkout: String
	city: String
	country: String
	description: String
	directions: String
	email: String
	fax: String
	free_breakfast: Boolean
	free_internet: Boolean
	free_parking: Boolean
	geo: GeoObject
	id: Float
	name: String
	pets_ok: Boolean
	phone: String
	price: String
	public_likes: [String]
	reviews: [HotelReviewObject]
	state: String
	title: String
	tollfree: String
	type: String
	url: String
	vacancy: Boolean
}

type HotelRatingObject {
	Cleanliness: Float
	Location: Float
	Overall: Float
	Rooms: Float
	Service: Float
	Value: Float
}

type HotelReviewObject {
	author: String
	content: String
	date: String
	ratings: HotelRatingObject
}

type Output {
	hotels: [Hotel]
	airport: Airport
}

type Query {
	listHotelsNearAirport(airportName: String!, withinKm: Int!): Output
}

schema {
	query: Query
}
```

#### Screenshot
![AppSync schema](appsync-schema.jpg)

#### Create HTTP data source

**What's an HTTP data source?**
AppSync can call external HTTP APIs. You configure a base URL (your Data API endpoint), and resolvers send requests to it.

**Steps:**
- In AppSync, create a new HTTP data source.
- Set the endpoint to your Couchbase Data API base URL (from step 1).
- **Do not** configure auth here; we'll add Basic auth dynamically in the resolver using credentials from environment variables.

#### Screenshot
![AppSync Data Source](appsync-data-source.jpg)

#### Configure environment variables in AppSync

**Why environment variables?**
Storing credentials as environment variables in AppSync keeps them centralized. This approach:
- Avoids exposing credentials to clients
- Makes credential rotation easier (update once in AppSync, not in every client)

**Steps:**
1. In the AppSync console, navigate to your API → **Settings** → **Environment variables**.
2. Add the following environment variables:
   - **Key**: `cb_username`, **Value**: Your Couchbase username
   - **Key**: `cb_password`, **Value**: Your Couchbase password
3. Save the changes.

These environment variables will be accessible in your resolvers via `ctx.env.cb_username` and `ctx.env.cb_password`.

#### Screenshot
![AppSync Environment Variables](appsync-env-vars.jpg)

#### Add a JavaScript Unit Resolver for `Query.listHotelsInCity`

**What does this resolver do?**
AppSync resolvers have two functions:
1. `request()` — transforms the GraphQL request into an HTTP request to send to the data source.
2. `response()` — transforms the HTTP response from the data source back into GraphQL data.

Our resolver:
- Reads `cb_username` and `cb_password` from AppSync environment variables (`ctx.env`).
- Extracts `city` from the GraphQL arguments.
- Constructs a parameterized SQL++ query: `SELECT c.* FROM hotel AS c WHERE city = $1`.
- Builds a Data API Query Service request:
  - **Endpoint**: `/_p/query/query/service` (Data API's SQL++ query endpoint).
  - **Headers**: `Authorization: Basic <base64(username:password)>`, `Content-Type: application/json`.
  - **Body**: `{ query_context: "default:travel-sample.inventory", statement: "SELECT ...", args: [city], timeout: "30m" }`.
- Returns the `results` array from Data API's JSON response, which AppSync then maps to the `[Hotel]` type.

**Why `query_context`?**
Setting `query_context` to `default:travel-sample.inventory` lets you write `FROM hotel` instead of the fully qualified `FROM travel-sample.inventory.hotel` in your SQL++. It's a namespace shortcut.

**Why environment variables for credentials?**
Storing credentials as environment variables in AppSync means:
- Credentials never leave the server or get exposed to clients.
- Easy credential rotation without updating client code.
- Centralized credential management across all resolvers.

Paste this code:

```javascript
import { util } from '@aws-appsync/utils';

export function request(ctx) {
    // Read credentials from AppSync environment variables
    const username = ctx.env.cb_username;
    const password = ctx.env.cb_password;
    
    // Define the Couchbase keyspace (bucket.scope.collection)
    const bucket = "travel-sample";
    const scope = "inventory";

    // Build Basic auth header for Data API
    // Data API expects: Authorization: Basic <base64(username:password)>
    const token = util.base64Encode(`${username}:${password}`);
    const auth = `Basic ${token}`;

    // Construct a geospatial SQL++ query using a Common Table Expression (CTE)
    // The query:
    // 1. WITH clause: Finds the airport by name and extracts its coordinates
    // 2. Main SELECT: Joins hotels with airport location and calculates distance
    // 3. WHERE clause: Filters hotels within the specified radius using Pythagorean theorem
    // Using $1, $2 as positional parameters for security (prevents SQL injection)
    const sql_query = `
      WITH airport_loc AS (
        SELECT a.geo.lat AS alat, 
               a.geo.lon AS alon, 
               IFMISSINGORNULL(a.geo.accuracy, "APPROXIMATE") AS accuracy
        FROM airport AS a
        WHERE a.airportname = $1
        LIMIT 1
      )
      SELECT h.*, airport_loc.alat, airport_loc.alon, airport_loc.accuracy
      FROM hotel AS h, airport_loc
      WHERE airport_loc.alat IS NOT MISSING
        AND POWER(h.geo.lat - airport_loc.alat, 2)
          + POWER(h.geo.lon - airport_loc.alon, 2) <= POWER($2 / 111, 2)
    `;

    // Log to CloudWatch for debugging (best practice)
    console.log("Request Context:", ctx);
    
    // Build the HTTP request object for the Data API Query Service
    const requestObject = {
        method: 'POST',
        resourcePath: '/_p/query/query/service',  // Data API SQL++ endpoint - see https://docs.couchbase.com/cloud/data-api-reference/index.html#tag/Query
        params: {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': auth  // Basic auth using environment variables
            },
            body: {
                query_context: `default:${bucket}.${scope}`,  // Namespace shortcut
                statement: sql_query,  // The geospatial SQL++ query
                args: [ctx.arguments.airportName, ctx.arguments.withinKm],  // Positional parameters
                timeout: '30m'  // Query timeout
            }
        }
    };
    
    // Log the outgoing request
    console.log("Outgoing Request to Data API:", requestObject);
    
    return requestObject;
}

export function response(ctx) {
    // Log the complete response context
    console.log("Response Context:", ctx);
    
    // Data API returns JSON like: { results: [ {...hotel1...}, {...hotel2...} ], ... }
    // Each result contains hotel fields plus airport coordinates (alat, alon, accuracy)
    let parsedResult = ctx.result.body;
    if (typeof ctx.result.body === 'string') {
        parsedResult = JSON.parse(ctx.result.body);
        console.log("Parsed Result:", parsedResult);
    }
    
    const results = parsedResult.results || [];
    
    // Extract airport information from the first result (all results have the same airport location)
    let airport = null;
    if (results.length > 0) {
        const first = results[0];
        airport = {
            name: ctx.arguments.airportName,  // Use the input airport name
            location: {
                lat: first.alat,
                lon: first.alon,
                accuracy: first.accuracy
            }
        };
    }
    
    // Clean up hotels by removing airport location fields (alat, alon, accuracy)
    // These were added by the JOIN but aren't part of the Hotel schema
    const hotels = results.map(hotel => {
        const { alat, alon, accuracy, ...cleanHotel } = hotel;
        return cleanHotel;
    });
    
    // Return in the Output schema format with both hotels and airport
    return {
        hotels: hotels,
        airport: airport
    };
}
```

**Key takeaways:**
- `ctx.env` provides access to AppSync environment variables (credentials stored securely).
- `ctx.arguments` gives you the GraphQL args: `airportName` and `withinKm`.
- `util.base64Encode` is an AppSync helper to encode credentials.
- `resourcePath` is the API endpoint path relative to your HTTP data source base URL. In this case, `/_p/query/query/service` is the [Data API Query Service endpoint](https://docs.couchbase.com/cloud/data-api-reference/index.html#tag/Query) for executing SQL++ queries.
- `query_context` sets the default bucket/scope for SQL++, allowing short names like `hotel` instead of `travel-sample.inventory.hotel`.
- Using positional parameters (`$1`, `$2`) in the SQL++ query prevents SQL injection.
- Distance calculation uses Pythagorean theorem approximation.
- The response function constructs an `Airport` object from the result data and input arguments.
- Hotel objects are cleaned to remove the joined airport coordinate fields before returning.
- CloudWatch logging helps debug the complex geospatial query and response transformation.

Save and deploy your resolver.

#### Screenshot
![AppSync Resolver](appsync-resolver.jpg)

#### Enable AppSync request/response logging (recommended)

**Why enable logging?**
CloudWatch logs let you see exactly what your resolver sends to Data API and what it receives back. This is invaluable for debugging:
- Incorrect SQL++ syntax? Check the `statement` in the request log.
- Auth errors? Check the `Authorization` header and Data API response.
- Unexpected results? Compare the Data API JSON with what AppSync returns to the client.

**Steps:**
1. In the AppSync console, open your API → **Settings** → **Logging**.
2. Choose (or create) a CloudWatch Log Group.
3. Set **Field resolver log level** to at least **ERROR** (use **INFO** or **ALL** during development for full request/response logs).
4. Save.

Now, every resolver invocation will log to CloudWatch. You can view logs in the CloudWatch console under the log group you selected.

#### Screenshot
![AppSync Logging Settings](appsync-logging-seeting.jpg)

#### Quick test (optional)

Test your resolver directly in the AppSync console before building the frontend.

1. In the AppSync console, open **Queries**.
2. Paste this query, replacing the airport name and distance as needed:

```graphql
query ListHotelsNearAirport {
  listHotelsNearAirport(
    airportName: "Les Loges"
    withinKm: 50
  ) {
    hotels {
      id
      name
      address
      city
      country
      phone
      price
      url
      geo { lat lon }
      reviews { ratings { Overall } }
    }
    airport {
      name
      location {
        lat
        lon
        accuracy
      }
    }
  }
}
```

3. Click **Run**. You should see a JSON response with:
   - An array of hotels within 50km of Heathrow airport
   - Airport information including name and location coordinates

Try different airport names like "Charles de Gaulle", or "Changi" to see results from different locations.

If it works, you've successfully bridged AppSync → Data API → Couchbase with geospatial querying!

**Note:** The credentials are read from the environment variables you configured earlier, so you don't need to pass them in the query.

---

### Streamlit frontend

Now we'll build a simple web UI to call AppSync and visualize hotels on a map.

**What is Streamlit?**
Streamlit is a Python framework for building data apps with minimal code. You write Python functions, and Streamlit renders them as interactive web UIs.

**Application structure:**
We'll build a multi-page Streamlit app with two Python files:
1. **`home.py`** — Main entry point with navigation, connection settings, and a home page
2. **`search_hotels.py`** — Hotel search page with airport name and distance inputs, displaying both hotels and airports on an interactive map

#### Setup

Create and activate a virtual environment, then install dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install streamlit requests pandas pydeck
```

#### Build the navigation and connection settings (`home.py`)

**What does `home.py` do?**
This is the main entry point for the Streamlit app. It provides:
- A home page with information about the demo
- A sidebar navigation menu to switch between pages
- Connection settings inputs (GraphQL endpoint, API key) stored in Streamlit's `session_state`
- Dynamic page loading based on user selection
- Validation to ensure required settings are filled before accessing feature pages

**Code walkthrough:**

```python
import importlib
import streamlit as st


PAGES = {
    "Home": "home",
    "Search Hotels": "search_hotels",
}


def render_home():
    """
    Display the home page with information about the demo.
    Explains what the app does and how AppSync + Data API + Streamlit work together.
    """
    st.title("Home")
    st.subheader("About this demo")
    st.markdown(
        "This Streamlit app calls an AWS AppSync GraphQL API that uses Couchbase Data API behind the scenes to search hotels near airports and visualize results on a map."
    )
    st.markdown(
        "**Why dataAPI for serverless?** It keeps credentials and query logic secure on the server behind AppSync, avoids heavy SDK initialization overhead, and perfectly fits stateless, scalable Lambda functions."
    )
    st.subheader("What this demo showcases and how to proceed")
    st.markdown(
        "- Enter your AppSync GraphQL endpoint and API key in the sidebar.\n"
        "- Go to 'Search Hotels' to find hotels near an airport within a specified distance; resolvers invoke dataAPI to query Couchbase.\n"
        "- The query uses geospatial calculations to find hotels based on lat/lon coordinates.\n"
        "- View results on a map with color-coded ratings; try different airports and distances.\n"
        "- Extend this starter by adding mutations or subscriptions in your AppSync schema."
    )


def render():
    """
    Main render function: sets up sidebar navigation and connection settings.
    Flow:
    1. Display navigation menu in sidebar (Home, Search Hotels, etc.)
    2. Collect connection settings (GraphQL endpoint, API key)
       - These are stored in session_state so they persist across page changes
       - Note: Couchbase credentials are now stored as environment variables in AppSync
    3. If user is on the Home page, render it directly
    4. For other pages, validate that all required connection settings are filled
    5. Dynamically import and render the selected page module
    
    Why session_state?
    Streamlit reruns the entire script on every interaction. session_state persists data
    across reruns, so users don't have to re-enter connection settings when switching pages.
    
    Why dynamic imports?
    Instead of hardcoding imports for all pages, we use importlib to load page modules
    based on the user's selection. This keeps the code modular and extensible.
    """
    # Sidebar navigation menu
    st.sidebar.header("Navigation")
    page_name = st.sidebar.selectbox("Go to", list(PAGES.keys()))

    # Connection settings input fields
    # These persist in session_state across page navigations
    st.sidebar.header("Connection Settings")
    st.session_state["gql_endpoint"] = st.sidebar.text_input(
        "GraphQL Endpoint",
        value=st.session_state.get("gql_endpoint", ""),
    )
    st.session_state["api_key"] = st.sidebar.text_input(
        "GraphQL API Key",
        value=st.session_state.get("api_key", ""),
        type="password",
    )

    # Map page name to module name
    module_name = PAGES[page_name]
    
    # Home page doesn't require connection settings, render it directly
    if module_name == "home":
        render_home()
        return
    
    # For non-Home pages, validate required connection settings
    required_keys = [
        "gql_endpoint",
        "api_key",
    ]
    labels = {
        "gql_endpoint": "GraphQL Endpoint",
        "api_key": "GraphQL API Key",
    }
    missing = [labels[k] for k in required_keys if not st.session_state.get(k)]
    if missing:
        st.error(f"Please fill the required connection settings: {', '.join(missing)}")
        return
    
    # Dynamically import and render the selected page
    try:
        module = importlib.import_module(module_name)
        if hasattr(module, "render"):
            module.render()
        else:
            st.error("Selected page is missing a render() function.")
    except Exception as exc:
        st.error(f"Failed to load page: {exc}")


if __name__ == "__main__":
    render()
```

**Key takeaways:**
- `PAGES` dictionary maps user-friendly page names to Python module names.
- `session_state` stores connection settings so they persist when the user switches pages.
- Input fields use `type="password"` for sensitive data (API key) to mask them in the UI.
- Only AppSync connection details are needed in the frontend; Couchbase credentials are stored securely in AppSync environment variables.
- The app validates required settings before loading feature pages, providing clear error messages if any are missing.
- `importlib.import_module()` dynamically loads page modules, making it easy to add new pages without modifying the main file.

---

#### Build the hotel search page (`search_hotels.py`)

Create a file `search_hotels.py` with the following code. This page handles the actual hotel search functionality with geospatial querying.

**What does `search_hotels.py` do?**
This page:
- Provides inputs for airport name and search radius in kilometers
- Calls the AppSync GraphQL API with both airport name and distance parameters
- Receives both hotels and airport information from the GraphQL response
- Transforms hotel results into map-friendly data with color-coded ratings (red = low, green = high)
- Displays hotels AND the airport on an interactive map using pydeck with two separate layers
- Hotels appear as color-coded markers, airport appears as an orange marker with white outline
- Centers the map on the airport location for optimal viewing
- Shows detailed tooltips for hotels (rating, address, price, etc.) and simple tooltips for airports
- Provides a legend explaining the marker colors
- Shows the raw JSON response in an expandable section for debugging

**Code walkthrough:**

```python
# Standard libs and third-party imports
from typing import Any, Dict, List

import pandas as pd
import pydeck as pdk
import requests
import streamlit as st


def get_connection_settings() -> Dict[str, str]:
    """
    Read connection details from the Streamlit sidebar state.
    Streamlit uses session_state to persist user inputs across reruns.
    Note: Couchbase credentials are no longer needed here as they're stored in AppSync environment variables.
    """
    return {
        "endpoint": st.session_state.get("gql_endpoint", ""),
        "api_key": st.session_state.get("api_key", ""),
    }


def validate_required(settings: Dict[str, str]) -> List[str]:
    """
    Return labels of any missing required settings for quick UX feedback.
    If the user hasn't filled in the sidebar, we show an error before making the API call.
    """
    labels = {
        "endpoint": "GraphQL Endpoint",
        "api_key": "GraphQL API Key",
    }
    return [labels[k] for k, v in settings.items() if not v]


def build_query() -> str:
    """
    GraphQL query string for listHotelsNearAirport.
    We request hotels (id, name, address, city, country, phone, price, url, geo, reviews)
    AND airport information (name, location with lat/lon/accuracy).
    AppSync will call our resolver, which reads credentials from environment variables,
    executes a geospatial SQL++ query via Data API, and returns both hotels and airport.
    """
    return (
        "query ListHotelsNearAirport($airportName: String!, $withinKm: Int!) {\n"
        "  listHotelsNearAirport(airportName: $airportName, withinKm: $withinKm) {\n"
        "    hotels {\n"
        "      id\n"
        "      name\n"
        "      address\n"
        "      city\n"
        "      country\n"
        "      phone\n"
        "      price\n"
        "      url\n"
        "      geo { lat lon }\n"
        "      reviews { ratings { Overall } }\n"
        "    }\n"
        "    airport {\n"
        "      name\n"
        "      location {\n"
        "        lat\n"
        "        lon\n"
        "        accuracy\n"
        "      }\n"
        "    }\n"
        "  }\n"
        "}"
    )


def build_variables(airport_name: str, within_km: int) -> Dict[str, Any]:
    """
    Map UI inputs to GraphQL variables.
    We need airport name and distance; Couchbase credentials are stored in AppSync environment variables.
    """
    return {
        "airportName": airport_name,
        "withinKm": within_km,
    }


def fetch_hotels(endpoint: str, api_key: str, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call AppSync GraphQL API using HTTP POST.
    - endpoint: your AppSync GraphQL URL
    - api_key: AppSync API key (passed in x-api-key header)
    - query: the GraphQL query string
    - variables: the GraphQL variables (airportName and withinKm)
    
    Returns a dict with both 'hotels' list and 'airport' object, or raises on errors.
    """
    headers = {"x-api-key": api_key} if api_key else {}
    resp = requests.post(endpoint, json={"query": query, "variables": variables}, headers=headers)
    payload = resp.json()
    if payload.get("errors"):
        raise RuntimeError(str(payload["errors"]))
    result = payload.get("data", {}).get("listHotelsNearAirport", {})
    return {
        "hotels": result.get("hotels", []),
        "airport": result.get("airport")
    }


def compute_rating_from_reviews(hotel: Dict[str, Any]) -> float:
    """
    Derive a 0–10 rating score from hotel reviews.
    The Travel Sample hotel documents have a 'reviews' array with 'ratings.Overall' (0–5 scale).
    We average all Overall ratings and scale to 0–10 for display.
    Missing reviews -> 0.
    Uses list comprehension for cleaner code.
    """
    reviews = hotel.get("reviews") or []
    overall_values = [
        float(review.get("ratings", {}).get("Overall"))
        for review in reviews
        if review and review.get("ratings", {}).get("Overall") is not None
    ]
    if not overall_values:
        return 0.0
    return (sum(overall_values) / len(overall_values)) * 2.0


def color_from_rating(rating_out_of_10: float) -> List[int]:
    """
    Map a 0–10 rating to an RGBA color for the map layer.
    Low rating -> red (255, 30, 40), high rating -> green (0, 200, 40).
    This gives visual feedback: red dots = poor, green dots = excellent.
    """
    normalized = max(0.0, min(1.0, rating_out_of_10 / 10.0))
    red = int(255 * (1.0 - normalized))
    green = int(200 * normalized + 30 * (1 - normalized))
    blue = 40
    return [red, green, blue, 200]


def hotels_to_points(hotels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transform GraphQL hotel results into a list of map-friendly dicts.
    Each point has: name, details (pre-formatted HTML tooltip), lat, lon, color (RGBA).
    We skip hotels without geo.lat or geo.lon (can't plot them).
    The details field contains formatted HTML for the tooltip with all hotel information.
    """
    points = []
    for hotel in hotels:
        geo = hotel.get("geo") or {}
        if not geo.get("lat") or not geo.get("lon"):
            continue
        
        rating = compute_rating_from_reviews(hotel)
        # Pre-format the tooltip HTML with all hotel details
        details = (
            f"<br/><div style='margin-top: 5px;'>"
            f"<b>Rating:</b> {rating:.1f}/10<br/>"
            f"<b>Address:</b> {hotel.get('address', '')}<br/>"
            f"<b>City:</b> {hotel.get('city', '')}<br/>"
            f"<b>Country:</b> {hotel.get('country', '')}<br/>"
            f"<b>Price:</b> {hotel.get('price', '')}<br/>"
            f"<b>Phone:</b> {hotel.get('phone', '')}<br/>"
            f"<b>Website:</b> {hotel.get('url', '')}"
            f"</div>"
        )
        
        points.append({
            "name": hotel.get("name", ""),
            "details": details,  # Pre-formatted HTML for tooltip
            "lat": float(geo["lat"]),
            "lon": float(geo["lon"]),
            "color": color_from_rating(rating),
        })
    return points


def get_map_style() -> str:
    """
    Use a free Carto basemap (no token required).
    This provides a clean, light background for our markers.
    """
    return "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"


def build_map(df_hotels: pd.DataFrame, airport: Dict[str, Any]) -> pdk.Deck:
    """
    Create a pydeck Deck with TWO ScatterplotLayers:
    1. Hotel markers - color-coded by rating (red = low, green = high)
    2. Airport marker - orange with white outline, larger size
    
    The map centers on the airport location for optimal viewing.
    Tooltips show full details for hotels (name + all info), just the name for airports.
    """
    # Layer 1: Hotels with color-coded ratings
    layers = [
        pdk.Layer(
            "ScatterplotLayer",
            data=df_hotels,
            get_position="[lon, lat]",
            get_fill_color="color",
            get_radius=8,
            radius_units="meters",
            radius_min_pixels=4,
            radius_max_pixels=20,
            pickable=True,
            auto_highlight=True,
        )
    ]
    
    # Layer 2: Airport marker (if available)
    if airport and airport.get("location"):
        df_airport = pd.DataFrame([{
            "name": airport.get("name", "Airport"),
            "lat": airport["location"]["lat"],
            "lon": airport["location"]["lon"],
            "color": [255, 165, 0, 255],  # Orange
            "details": "",  # No details for airport - just shows name
        }])
        
        layers.append(pdk.Layer(
            "ScatterplotLayer",
            data=df_airport,
            get_position="[lon, lat]",
            get_fill_color="color",
            get_radius=15,  # Larger than hotels
            radius_units="meters",
            radius_min_pixels=10,
            radius_max_pixels=40,
            pickable=True,
            auto_highlight=True,
            get_line_color=[255, 255, 255, 255],  # White outline
            line_width_min_pixels=2,
            stroked=True,
        ))
    
    # Center map on airport location (or first hotel as fallback)
    if airport and airport.get("location"):
        center_lat = airport["location"]["lat"]
        center_lon = airport["location"]["lon"]
    else:
        center_lat = df_hotels["lat"].iloc[0]
        center_lon = df_hotels["lon"].iloc[0]
    
    view_state = pdk.ViewState(
        longitude=center_lon,
        latitude=center_lat,
        zoom=10,  # User can zoom in/out as needed
    )
    
    # Unified tooltip: shows name for all, details only for hotels (empty for airport)
    tooltip = {
        "html": (
            "<div style='font-family: Arial, sans-serif;'>"
            "<b style='font-size: 14px;'>{name}</b>"
            "{details}"
            "</div>"
        ),
        "style": {"color": "white"},
    }
    
    return pdk.Deck(
        layers=layers,
        initial_view_state=view_state,
        tooltip=tooltip,
        map_style=get_map_style(),
    )


def render():
    """
    Main UI: collect inputs (airport name, distance), call AppSync, render map and raw response.
    Flow:
    1. User enters airport name and distance in km.
    2. User clicks "Search" button.
    3. We validate connection settings (AppSync endpoint, API key).
    4. We call fetch_hotels() -> AppSync GraphQL -> resolver -> Data API -> Couchbase.
    5. AppSync resolver executes geospatial SQL++ query with CTE to find nearby hotels.
    6. We transform hotel results into map points (with color-coded ratings).
    7. We render a pydeck map with TWO layers (hotels + airport) and tooltips.
    8. We show a legend explaining the marker colors.
    9. We show the raw JSON response in an expander for debugging.
    """
    st.title("Search Hotels Near Airport")
    settings = get_connection_settings()
    
    # Two-column layout for inputs
    col1, col2 = st.columns([2, 1])
    with col1:
        airport_name = st.text_input("Airport Name")
    with col2:
        within_km = st.number_input("Distance (km)", min_value=1, max_value=500, value=50)
    
    st.caption("Markers are colored by rating (0–10) derived from reviews.")

    if st.button("Search"):
        # Validate connection settings
        if missing := validate_required(settings):
            st.error(f"Please fill the required connection settings: {', '.join(missing)}")
            return
        if not airport_name:
            st.error("Please enter an airport name")
            return
        
        # Fetch data from AppSync
        try:
            result = fetch_hotels(
                endpoint=settings["endpoint"],
                api_key=settings["api_key"],
                query=build_query(),
                variables=build_variables(airport_name, within_km),
            )
            hotels = result["hotels"]
            airport = result["airport"]
        except Exception as exc:
            st.error(f"GraphQL error: {exc}")
            return
        
        # Handle empty results
        if not airport:
            st.error(f"Airport '{airport_name}' not found.")
            return
            
        if not hotels:
            st.warning(f"No hotels found within {within_km}km of {airport_name}.")
            return
            
        # Transform and display
        points = hotels_to_points(hotels)
        if not points:
            st.warning("No hotel coordinates to plot on the map.")
            return
            
        df = pd.DataFrame(points)
        deck = build_map(df, airport)
        st.pydeck_chart(deck)
        
        # Add legend
        st.markdown("""
        **Legend:**
        - 🟠 Orange marker: Airport location
        - 🔴 Red to 🟢 Green markers: Hotels (colored by rating, 0-10)
        """)
        
        # Show raw JSON response for debugging
        with st.expander("Raw response"):
            st.json({"data": {"listHotelsNearAirport": {"hotels": hotels, "airport": airport}}})


if __name__ == "__main__":
    render()
```

**What happens when you run this?**
1. Streamlit starts a local web server.
2. The user fills in the sidebar (GraphQL endpoint, API key).
3. The user enters an airport name and distance radius, then clicks "Search".
4. The app POSTs a GraphQL query to AppSync with both `airportName` and `withinKm` parameters.
5. AppSync invokes the resolver, which:
   - Reads Couchbase credentials from environment variables
   - Executes a SQL++ query with a CTE to find the airport and calculate distances
   - Calls Data API to query Couchbase
6. Data API returns hotels with airport coordinates; the resolver constructs the `Airport` object and cleans the hotel data.
7. AppSync returns both `hotels` and `airport` to Streamlit.
8. Streamlit:
   - Computes ratings from reviews and maps them to colors (red = low, green = high)
   - Creates TWO map layers: one for hotels, one for the airport (orange with white outline)
   - Centers the map on the airport location
9. Hovering over markers shows: full details for hotels (name, rating, address, price, phone, url), just the name for airports.

**Key functions explained:**
- `get_connection_settings()` — Retrieves AppSync connection details from Streamlit's `session_state` (populated by `home.py`).
- `build_query()` — Constructs the GraphQL query string for `listHotelsNearAirport` requesting both hotels and airport info.
- `build_variables()` — Maps UI inputs (airport name, distance in km) to GraphQL variables.
- `fetch_hotels()` — Standard GraphQL HTTP client that POSTs to AppSync and returns both hotels and airport.
- `compute_rating_from_reviews()` — Averages the `Overall` rating from all reviews and scales 0–5 to 0–10.
- `color_from_rating()` — Interpolates red→green color based on rating for visual feedback (red = poor, green = excellent).
- `hotels_to_points()` — Transforms GraphQL hotel results into map-friendly data with pre-formatted HTML tooltips.
- `build_map()` — Creates a pydeck Deck with TWO ScatterplotLayers (hotels + airport) with different colors, sizes, and tooltips.

**Data flow:**
1. User enters airport name + distance → clicks "Search"
2. `fetch_hotels()` → AppSync GraphQL API (with airportName and withinKm parameters)
3. AppSync → resolver (reads credentials from environment variables) → Data API → Couchbase
4. Data API executes geospatial SQL++ query (CTE finds airport, main query calculates distances)
5. Data API returns hotels + airport coordinates → resolver constructs Airport object → AppSync → Streamlit
6. Streamlit computes ratings, maps to colors, creates two map layers, and centers on airport

---

#### Run and test the application

**Start the Streamlit app:**

```bash
streamlit run home.py
```

This starts the Streamlit web server and automatically opens the app in your browser (usually at `http://localhost:8501`).

**Configure connection settings:**

In the browser sidebar, fill in the required connection settings:
- **GraphQL Endpoint**: Your AppSync API URL (e.g., `https://xxx.appsync-api.us-east-1.amazonaws.com/graphql`)
- **GraphQL API Key**: Your AppSync API key

**Note:** Couchbase credentials are no longer entered here. They're securely stored as environment variables in your AppSync configuration.

**Search for hotels:**

1. Use the navigation dropdown in the sidebar to select **"Search Hotels"**
2. Enter an airport name (e.g., "Heathrow", "Charles de Gaulle", "LAX", "Changi")
3. Enter a distance radius in kilometers (e.g., 50)
4. Click the **"Search"** button
5. View the results:
   - The airport appears as an orange marker with white outline (larger than hotel markers)
   - Hotels appear as colored dots (green = high rating, red = low rating)
   - Hover over any hotel marker to see full details (name, rating, address, price, phone, URL)
   - Hover over the airport marker to see just the airport name
   - The map automatically centers on the airport location
   - Use the legend to understand marker colors
   - Expand the "Raw response" section to see the full JSON data from AppSync (both hotels and airport)

#### Screenshots

![Streamlit search](streamlit-search.jpg)

![Streamlit map](streamlit-map.jpg)

---

### Conclusion
You've successfully built a complete demo showcasing **Couchbase Data API** integration with **AWS AppSync GraphQL** and **Streamlit**—creating a serverless geospatial hotel search application that executes SQL++ queries through AppSync resolvers, manages credentials securely via environment variables, and visualizes results on interactive maps with color-coded ratings and dual layers for hotels and airports.
