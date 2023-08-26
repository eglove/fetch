// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Api } from '../src/api';

describe('api setup', () => {
  test('api initializes correctly', () => {
    const testApi = new Api({
      baseUrl: 'http://example.com',
      cacheInterval: 100,
      requestOptions: {
        method: 'GET',
      },
      requests: {
        search: {
          cacheInterval: 300,
          path: 'search/:id/:name',
          pathVariables: {
            id: 2,
            name: 'joe',
          },
          requestOptions: {
            method: 'POST',
          },
          searchParams: {
            orderBy: 'name',
            sortBy: 'date',
          },
          zodSchema: z.string(),
        },
      },
    });

    const api = testApi as unknown;
    expect(api.baseUrl).toBe('http://example.com');
    expect(api.cacheInterval).toBe(100);
    expect(api.requestOptions).toStrictEqual({
      method: 'GET',
    });
    expect(api.requests.get('search').cacheInterval).toBe(300);
    expect(api.requests.get('search').path).toBe('search/:id/:name');
  });

  test('fetch works', async () => {
    const expectedResult = {
      data: {
        completed: false,
        id: 1,
        title: 'delectus aut autem',
        userId: 1,
      },
      isSuccess: true,
    };
    const mockFetch = vi.fn().mockResolvedValue({
      async json() {
        return expectedResult.data;
      },
    });

    const todosApi = new Api({
      baseUrl: 'https://jsonplaceholder.typicode.com',
      requests: {
        todos: {
          path: 'todos/:id',
          pathVariables: {
            id: 1,
          },
          searchParams: {
            hey: undefined,
          },
          zodSchema: z.object({
            completed: z.boolean(),
            id: z.number(),
            title: z.string(),
            userId: z.number(),
          }),
        },
      },
    });

    // eslint-disable-next-line functional/immutable-data
    globalThis.fetch = mockFetch;
    const result = await todosApi.fetch('todos');
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result).toStrictEqual(expectedResult);
  });
});
