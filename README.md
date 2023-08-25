# Vanilla JS Fetcher with Client Side Cache

Prevent refetching the same data to the browser based on a cache interval. Does not work on a server.

## FAQ

1. Is this 0kb GZipped and blazingly fast? **No**
2. Should I use this in my production app? **Probably not**

## Install

```shell
{npm,yarn,pnpm} i @ethang/fetch
```

## Use

```typescript
export const requests = {
    getTodos(id: number) {
        return new Request(`https://jsonplaceholder.typicode.com/todos/${id}`);
    }
}
```

Cache for request will expire on an interval, and pull from cache until that time has expired when it will make a new network request.

```typescript
import { fetcher } from "@ethang/fetch";

const response = await fetcher({
    cacheInterval: 30, // Number of seconds between fetches
    request: requests.getTodos(1),
});

const data = await response.json();
```

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

