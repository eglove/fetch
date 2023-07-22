import { IDBPDatabase, openDB } from 'idb';

type FetcherOptions = {
  cacheInterval?: number;
  request: Request;
};

type RequestMeta = {
  expires: Date;
  key: string;
  lastFetched: Date;
};

const DB_NAME = 'requests';
const inflightRequests = new Set<string>();

const getRequestDatabase = async (): Promise<IDBPDatabase<unknown>> => {
  return openDB(DB_NAME, 1, {
    upgrade(database_) {
      const store = database_.createObjectStore(DB_NAME, {
        keyPath: 'key',
      });
      store.createIndex('key', 'key');
    },
  });
};

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

  // Delete from cache if time is past expires
  const cachedMeta = (await database
    .transaction(DB_NAME, 'readonly')
    .objectStore(DB_NAME)
    .get(requestKey)) as RequestMeta | undefined;

  if (cachedMeta && new Date() >= cachedMeta.expires) {
    await cache.delete(request);
  }

  // If same request is in flight, wait for it to finish and return cache
  if (inflightRequests.has(requestKey)) {
    const match = await cache.match(request);

    if (match === undefined) {
      return fetcher({ cacheInterval, request });
    }

    return cache.match(request);
  }

  inflightRequests.add(requestKey);

  // Return cached if present
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Cache request and expires metadata
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
