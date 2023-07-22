type FetcherOptions = {
  cacheInterval?: number;
  request: Request;
};

const CACHE_HEADER = 'X-Cache-Time';

export const fetcher = async ({
  request,
  cacheInterval,
}: FetcherOptions): Promise<Response | undefined> => {
  // eslint-disable-next-line no-undef
  const cache = await caches.open('cache');

  const cachedRequests = await cache.keys();
  let deletions: Promise<boolean>[] = [];
  for (const cachedRequest of cachedRequests) {
    const cacheBustDate = cachedRequest.headers.get(CACHE_HEADER);

    if (cacheBustDate && new Date(cacheBustDate) < new Date()) {
      deletions = [...deletions, cache.delete(cachedRequest)];
    }
  }

  await Promise.all(deletions);

  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const now = new Date();
  now.setSeconds(now.getSeconds() + (cacheInterval ?? 0));
  request.headers.append(CACHE_HEADER, now.toLocaleString());

  await cache.add(request);
  return cache.match(request);
};
