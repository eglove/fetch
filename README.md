# Vanilla JS Fetcher and API Builder with Client Side Cache

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
            path: 'todos/:id',
            zodSchema: todoSchema,
        },
    },
})
```

Cache for request will expire on an interval, and pull from cache until that time has expired when it will make a new network request.

```typescript
const { data, isSuccess, errors } = await api.fetch('todos', {
    isCached: true,
    cacheInterval: 30,
    pathVariables: {
        id: 1,
    },
});
```

### Overrides

Most options can be overwritten at a lower level. Such as using a different cache interval, pathVariables, or request
options different from what is set up in the global object. Keep in mind that this merges options, and overrides 
duplicate values, but does not completely override all options.

```typescript
new Api({
    baseUrl: 'http://example.com',
    cacheInterval: 300, // seconds
    isCached: true,
    requestOptions: {}, // Standard request options for fetch
    
    requests: {
        todos: {
            cacheInterval: 100, // seconds
            isCached: true,
            cacheId: 'uniqueId',
            requestOptions: {}, // Standard request options for fetch
            path: 'api/todo/:myId',
            pathVariables: { myId: 1, },
            searchParams: { filterBy: 'groceries', orderBy: 'name' },
            zodSchema: {}, // zod schema
        }
    }
})

api.fetch('todos', {
    cacheInterval: 0, // leaving this undefined, or passing 0 means no cache
    isCached: false,
    cacheId: 'uniqueId2',
    requestOptions: {}, // Standard request options for fetch
    pathVariables: { myId: 2, },
    searchParams: { filterBy: 'food', orderBy: 'type' },
    zodSchema: {}, // zod schema
})
```

### Other methods

Return cache only.

```typescript
await api.getCachedResponse(getTodosCacheId);
```

Remove request from cache:

```typescript
import { cacheBust } from "@ethang/fetch";

await api.fetch('updateTodo', {
    pathVariables: {
        id: 1,
    }
})

api.cacheBust(todos)

await cacheBust(getTodosCacheId)
```

## Gotchas'

This library largely depends on native ways of handling URLs. The primary motivation is to make use of browser APIs.
Because of that there can be a few "gotchas'".

1. The baseUrl property MUST be a base URL. It can not include any additional paths. Added paths will be stripped out. `https://example.com/api` becomes `https://example.com/`. Include things like `/api` in the request path only.
   2. If you want to override the baseUrl, this can be done via path. `{ path: https://example2.com/api/todo }` will override the default base url `https://example.com/`.

