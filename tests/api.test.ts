// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, test, vi } from 'vitest';

import { Api } from '../dist/api';

describe('api setup', () => {
  test('api initializes correctly', () => {
    const testApi = new Api({
      baseUrl: 'http://example.com',
      defaultCacheInterval: 100,
      defaultRequestOptions: {
        method: 'GET',
      },
      requests: {
        search: {
          defaultCacheInterval: 300,
          defaultRequestOptions: {
            method: 'POST',
          },
          url: 'search',
        },
      },
    });

    expect(testApi.baseUrl).toBe('http://example.com');
    expect(testApi.defaultCacheInterval).toBe(100);
    expect(testApi.defaultRequestOptions).toStrictEqual({
      method: 'GET',
    });
    expect(testApi.requests.search.defaultCacheInterval).toBe(300);
    expect(testApi.requests.search.url).toBe('search');
  });

  test('fetch works', async () => {
    const expectedResult = {
      completed: false,
      id: 1,
      title: 'delectus aut autem',
      userId: 1,
    };
    const mockFetch = vi.fn().mockResolvedValue({
      async json() {
        return expectedResult;
      },
    });

    const todosApi = new Api({
      baseUrl: 'https://jsonplaceholder.typicode.com',
      requests: {
        todos: {
          path: 'todos',
        },
      },
    });

    // eslint-disable-next-line functional/immutable-data
    globalThis.fetch = mockFetch;
    const response = await todosApi.fetch('todos', {
      pathVariables: '1',
      searchParams: { hey: undefined },
    });
    const data = await response?.json();
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(data).toStrictEqual(expectedResult);
  });
});
