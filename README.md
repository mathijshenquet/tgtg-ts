# tgtg-ts 🍽️🚀

Welcome to `tgtg-ts`, an unofficial TooGoodToGo API with extensive TypeScript typings. This project aims to provide a comprehensive and easy-to-use interface for interacting with the TooGoodToGo platform, all while leveraging the power and safety of TypeScript. 🎉🔥

## Features 🌟

- Full TypeScript support: Enjoy the benefits of static typing and intelligent code completion.
- Comprehensive API coverage: Interact with almost all endpoints of the TooGoodToGo API.
- Easy to use: Designed with simplicity in mind, get started in no time!

## Installation 💻

You can install `tgtg-ts` via npm:

```bash
npm install tgtg-ts
```

Or via yarn:

```bash
yarn add tgtg-ts
```

## Usage 🚀

### Making and managing a client

Initalizing and authenticating the client

```typescript
import { TgtgClient } from 'tgtg-ts';

// Initialize the client with an email
const client = new TgtgClient({
    email: 'your-email@example.com',
    didSessionChange: (session) => {
        // Save the session somewhere
        console.log('New session:', session);
    }
});

// Sends a login email to the user and resolves once the user has authenticated
// the client
await client.authByEmail();
```

Initialize the client using a previous authenticated session

```typescript
// Or initialize the client with an email and a previous session
const client = new TgtgClient({
    email: 'your-email@example.com',
    session: previousSession,
    didSessionChange: (session) => {
        // Save the session somewhere
        console.log('New session:', session);
    }
});
```

In the above examples, `your-email@example.com` should be replaced with the email you used to register on TooGoodToGo, and `previousSession` should be replaced with the session want to continue. This session is the one returned by the optional `didSessionChange` whenever the user authenticates or the credentials are refreshed.

The current credentials can be viewed with:
```typescript
client.getCredentials()
```

### Method: getItems


This method is used to fetch a list of items available on TooGoodToGo based on the provided parameters.

The `getItems` method accepts an object with the following properties:

- `latitude` (default: 0.0): The latitude of the location to search for items.
- `longitude` (default: 0.0): The longitude of the location to search for items.
- `radius` (default: 21): The radius (in kilometers) around the provided location to search for items.
- `page_size` (default: 20, maximum: 400): The number of items to return per page.
- `page` (default: 1): The page number to return.
- `favorites_only` (default: true): If true, returns only items that are marked as favorites.
- `item_categories` (default: []): An array of item category IDs to filter by.
- `diet_categories` (default: []): An array of diet category IDs to filter by.
- `pickup_earliest` (default: null): The earliest pickup time to filter by.
- `pickup_latest` (default: null): The latest pickup time to filter by.
- `search_phrase` (default: null): A search phrase to filter items by.
- `with_stock_only` (default: false): If true, returns only items that are currently in stock.
- `hidden_only` (default: false): If true, returns only items that are hidden.

Returns a Promise that resolves to an array of `PickupItem` objects.


```typescript
client.getItems({
    latitude: 51.5074,
    longitude: 0.1278,
    radius: 10,
    page_size: 50,
    page: 1,
    favorites_only: false
)
```


### Method: `getFavorites()`

This method is used to fetch the favorite items of the user. It returns a promise that resolves to an array of `PickupItem` objects. Each `PickupItem` object represents a favorite item of the user.

Optional parameters:

- `latitude` (default: 0.0): The latitude of the location to search for items.
- `longitude` (default: 0.0): The longitude of the location to search for items.
- `radius` (default: 21): The radius (in kilometers) around the provided location to search for items.
- `page_size` (default: 20, maximum: 400): The number of items to return per page.
- `page` (default: 1): The page number to return.

Returns:

A `Promise` that resolves to an array of `PickupItem` objects.

Usage Example:

```typescript
// get favorites by location
client.getFavorites({latitude: 52.5200, longitude: 13.4050, radius: 10})

// get the second page of favorites
client.getFavorites({page_size: 20, page: 2})
````
