import { IDBPDatabase, openDB } from 'idb';

export type RequestMeta = {
  expires: Date;
  key: string;
};

export const DB_NAME = 'requests';

export const getRequestDatabase = async (): Promise<IDBPDatabase<unknown>> => {
  return openDB(DB_NAME, 1, {
    upgrade(database_) {
      const store = database_.createObjectStore(DB_NAME, {
        keyPath: 'key',
      });
      store.createIndex('key', 'key');
    },
  });
};

export async function isExpired(requestKey: string): Promise<boolean> {
  const database = await getRequestDatabase();
  const cachedMeta = (await database
    .transaction(DB_NAME, 'readonly')
    .objectStore(DB_NAME)
    .get(requestKey)) as RequestMeta | undefined;

  return Boolean(cachedMeta && new Date() >= cachedMeta.expires);
}
