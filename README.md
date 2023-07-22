# Vanilla JS Fetcher with Client Side Cache

Prevent refetching the same data to the browser based on a cache interval. Does not work on a server.

## Install

```shell
{npm,yarn,pnpm} i @ethang/fetch
```

## Use

```typescript
import {fetcher } from "@ethang/fetch";

const response = await fetcher({
    cacheInterval: 30, // Number of seconds between fetches
    request: new Request('https://jsonplaceholder.typicode.com/todos/1'),
});

const data = await response.json();
```


