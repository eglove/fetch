# Vanilla JS Fetcher and API Builder with Client Side Cache

Centralize your API, keep it flexible to escape hatches. Prevent refetching the same data to the browser based on a cache interval. (Cache does not work on a server.)

## FAQ

1. Is this 0kb GZipped and blazingly fast? **No**
2. Should I use this in my production app? **Probably not**

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

### Overrrides

Most options can be overwritten at a lower level. Such as using a different cache interval, pathVariables, or request
options different from what is set up in the global object. Keep in mind that this merges options, and overrides 
duplicate values, but does not completely override all options.

```typescript
new Api({
    baseUrl?: string;
    cacheInterval?: number;
    isCached?: boolean;
    requestOptions?: RequestInit; // Standard request options for fetch
    
    requests: {
        todos: {
            cacheInterval?: number;
            isCached?: boolean;
            requestOptions?: RequestInit; // Standard request options for fetch
            path: string | URL;
            pathVariables?: Record<string, string | number>;
            searchParams?: Record<string, string | number>;
            zodSchema: SchemaType extends ZodSchema;
        }
    }
})

api.fetch('todos', {
    cacheInterval?: number;
    isCached?: boolean;
    requestOptions?: RequestInit; // Standard request options for fetch
    pathVariables?: Record<string, string | number>;
    searchParams?: Record<string, string | number>;
    zodSchema?: SchemaType extends ZodSchema;
})
```

### WARNING: The following methods have not been integrated into Api

Return cache only.

```typescript
import { getCachedResponse } from "@ethang/fetch";

await getCachedResponse(request.getTodos(1));
```

Remove request from cache:

```typescript
import { cacheBust } from "@ethang/fetch";

await fetch('/update-todo/1', {
    method: 'POST',
    ...
})

await cacheBust(request.getTodos(1))
```

