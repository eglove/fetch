import { DB_NAME, getRequestDatabase, isExpired, RequestMeta } from './util';

type FetcherOptions = {
  cacheInterval?: number;
  request: Request;
};

export const fetcher = async ({
  request,
  cacheInterval,
}: FetcherOptions): Promise<Response | undefined> => {
  // eslint-disable-next-line no-undef
  const cache = await caches.open('cache');
  const requestKey = getRequestKey(request);
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
    database
      .transaction(DB_NAME, 'readwrite')
      .objectStore(DB_NAME)
      .put({
        expires,
        key: requestKey,
      } as RequestMeta),
  ]);

  return cache.match(request);
};

export function getRequestKey(request: Request): string {
  return `${request.url}${request.headers.get('Vary') ?? ''}${request.method}`;
}

export async function getCachedResponse(
  request: Request,
): Promise<Response | undefined> {
  // eslint-disable-next-line no-undef
  const cache = await caches.open('cache');
  return cache.match(request);
}

export async function cacheBust(request: Request): Promise<boolean> {
  // eslint-disable-next-line no-undef
  const cache = await caches.open('cache');
  const isSuccess = await cache.delete(request);

  await cache.add(request);

  return isSuccess;
}
