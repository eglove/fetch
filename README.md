# API Builder and Fetch Library with Client Side Cache

Centralize your API, keep it flexible to escape hatches. Prevent refetching the same data to the browser based on a cache interval. (Cache does not work on a server.)

## FAQ

1. Is this 0kb GZipped and blazingly fast? **No**
2. Is this well tested? **No**
3. Should I use this in my production app? **No**

## Install

```shell
{npm,yarn,pnpm} i @ethang/fetch
```

## Use

```typescript
export const api = new Api({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    requests: {
        todos: {
            path: 'todos',
        },
    },
})
```

Cache for requests will expire on an interval, and pull from cache until that time has expired when it will make a new network request.

```typescript
const response = await api.fetch.todos({
   cacheInterval: 30,
   pathVariables: [1], // https://jsonplaceholder.typicode.com/todos/1 
});
```

### Overrides

Most options can be overwritten at a lower level. Such as using a different cache interval, pathVariables, or request
options different from what is set up in the global object. Keep in mind that this merges options, and overrides 
duplicate values, but does not completely override all options.

```typescript
export const api = new Api({
   baseUrl: 'https://jsonplaceholder.typicode.com',
   cacheInterval: 300, // seconds
   requests: {
      todos: {
         bodySchema: z.string(), // zod schema to validate POST body
         defaultRequestInit: {}, // Standard request options for fetch
         path: 'todos',
      },
   },
});

const response = await api.fetch.todos({
   cacheInterval: 0, // leaving this undefined, or passing 0 skips cache
   pathVariables: [1, 'myTodo'], // Appends /1/myTodo to URL pathname
   requestInit: {}, // Standard request options for fetch
   searchParams: { filterBy: 'food', orderBy: 'type' }, // ?filterBy=food&orderBy=type
});

if (response) {
   const data = await api.parseJson(response, zodSchema);
}
```

### Other methods

Return cache only. Requests are considered unique by URL, Vary Header, and HTTP method.

```typescript
import {getCachedResponse } from "@ethang/fetch/fetcher";

const request = api.request.todos();
const response = await getCachedResponse(request);
```

Remove request from cache:

```typescript
import { cacheBust } from '@ethang/fetch/fetcher';

const request = api.request.todos();
const isSuccess = await cacheBust(request);
```

## Gotchas'

This library largely depends on native ways of handling URLs. The primary motivation is to make use of browser APIs.
Because of that, there can be a few "gotchas'".

1. The baseUrl property MUST be a base URL. It cannot include any additional paths. Added paths will be stripped out. `https://example.com/api` becomes `https://example.com/`. Include things like `/api` in the request path only.
2. If you want to override the baseUrl, this can be done via the path. `{ path: https://example2.com/api/todo }` will override the default base url `https://example.com/`.

