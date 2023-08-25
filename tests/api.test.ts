import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Api } from '../src/api';

describe('api setup', () => {
  test('url is correct', () => {
    const exampleApi = new Api({
      baseUrl: 'https://example.com',
      defaultHeaders: {
        MyHeader: 'somestuff',
      },
      requests: {
        search: {
          path: 'search',
          pathVariables: ['one', 'two', 3],
          searchParams: {
            filter: 'blue',
            orderBy: 'date',
          },
          zodSchema: z.string(),
        },
      },
    });

    expect(exampleApi.requests.get('search')?.request.url).toStrictEqual(
      'https://example.com/search/one/two/3?filter=blue&orderBy=date',
    );
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
    const mockFetch = vi.fn().mockResolvedValue(expectedResult);

    const todosApi = new Api({
      baseUrl: 'https://jsonplaceholder.typicode.com',
      requests: {
        todos: {
          path: 'todos',
          pathVariables: [1],
          zodSchema: z.object({
            completed: z.boolean(),
            id: z.number(),
            title: z.string(),
            userId: z.number(),
          }),
        },
      },
    });

    expect(todosApi.requests.get('todos')?.request.url).toBe(
      'https://jsonplaceholder.typicode.com/todos/1',
    );

    // eslint-disable-next-line functional/immutable-data
    todosApi.fetch = mockFetch;
    const result = await todosApi.fetch('todos');
    expect(result).toStrictEqual(expectedResult);
  });
});
