import { getRequestDatabase, isExpired } from './util';

type FetcherOptions = {
  cacheInterval?: number;
  request: Request;
};

const DB_NAME = 'requests';

export const fetcher = async ({
  request,
  cacheInterval,
}: FetcherOptions): Promise<Response | undefined> => {
  // eslint-disable-next-line no-undef
  const cache = await caches.open('cache');
  const requestKey = `${request.url}${request.headers.get('Vary')}${
    request.method
  }`;
  const database = await getRequestDatabase();

  if (await isExpired(requestKey)) {
    await cache.delete(request);
  }

  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + (cacheInterval ?? 0));

  await Promise.all([
    cache.add(request),
    database.transaction(DB_NAME, 'readwrite').objectStore(DB_NAME).put({
      expires,
      key: requestKey,
    }),
  ]);

  return cache.match(request);
};
