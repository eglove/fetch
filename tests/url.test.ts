// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, test } from 'vitest';

import { urlBuilder } from '../src/url-builder';

describe('url', () => {
  const baseUrl = 'https://developer.mozilla.org';

  test('creates url correctly', () => {
    const A = urlBuilder('/', { urlBase: baseUrl });
    expect(A.toString()).toBe('https://developer.mozilla.org/');

    const B = urlBuilder(baseUrl);
    expect(B.toString()).toBe('https://developer.mozilla.org/');

    expect(urlBuilder('en-US/docs', { urlBase: B.toString() }).toString()).toBe(
      'https://developer.mozilla.org/en-US/docs',
    );

    const D = urlBuilder('/en-US/docs', { urlBase: B.toString() });
    expect(D.toString()).toBe('https://developer.mozilla.org/en-US/docs');

    expect(
      urlBuilder('/en-US/docs', { urlBase: D.toString() }).toString(),
    ).toBe('https://developer.mozilla.org/en-US/docs');

    expect(
      urlBuilder('/en-US/docs', { urlBase: A.toString() }).toString(),
    ).toBe('https://developer.mozilla.org/en-US/docs');

    expect(
      urlBuilder('/en-US/docs', {
        urlBase: 'https://developer.mozilla.org/fr-FR/toto',
      }).toString(),
    ).toBe('https://developer.mozilla.org/en-US/docs');
  });

  test('gets URL object', () => {
    const builder = urlBuilder('https://example.com/');

    expect(builder.url.hostname).toBe('example.com');
    expect(builder.url.pathname).toBe('/');
  });

  test.each([['https://example.com'], ['https://example.com/']])(
    'appends path variables',
    baseUrl => {
      const builder = urlBuilder(baseUrl, {
        pathVariables: ['one', 2, undefined, '5'],
      });

      expect(builder.toString()).toBe('https://example.com/one/2/5/');
    },
  );

  test('appends path variables trailing slash is ok', () => {
    const baseUrl = 'https://example.com/';

    const builder = urlBuilder(baseUrl, {
      pathVariables: ['one', 2, undefined, '5'],
    });

    expect(builder.toString()).toBe('https://example.com/one/2/5/');
  });
});

describe('searchParameters', () => {
  const urlString = 'https://example.com';

  const parameters = [
    {
      q: 'URLUtils.searchParams',
      topic: 'api',
    },
    'q=URLUtils.searchParams&topic=api',
  ];

  test.each(parameters)('works with params correctly', parameters => {
    const builder = urlBuilder(urlString, {
      searchParams: parameters,
    });

    expect(builder.searchParameters.has('topic')).toBe(true);
    expect(builder.searchParameters.has('topic', 'fish')).toBe(false);
    expect(builder.searchParameters.get('topic') === 'api').toBe(true);
    expect(builder.searchParameters.getAll('topic')).toStrictEqual(['api']);
    expect(builder.searchParameters.get('foo')).toBeNull();

    builder.searchParameters.append('topic', 'webdev');
    expect(builder.searchParameters.toString()).toBe(
      'q=URLUtils.searchParams&topic=api&topic=webdev',
    );

    builder.searchParameters.set('topic', 'More webdev');
    expect(builder.searchParameters.toString()).toBe(
      'q=URLUtils.searchParams&topic=More+webdev',
    );

    builder.searchParameters.delete('topic');
    expect(builder.searchParameters.toString()).toBe('q=URLUtils.searchParams');
  });

  test('handles duplicate parameters', () => {
    const builder = urlBuilder(urlString, { searchParams: 'foo=bar&foo=baz' });

    expect(builder.searchParameters.toString()).toBe('foo=bar&foo=baz');
    expect(builder.searchParameters.has('foo')).toBe(true);
    expect(builder.searchParameters.get('foo')).toBe('bar');
    expect(builder.searchParameters.getAll('foo')).toStrictEqual([
      'bar',
      'baz',
    ]);
  });

  test('treats full url as query', () => {
    const parametersString = 'https://notexample.com/search?query=%40';
    const { searchParameters } = urlBuilder(urlString, {
      searchParams: parametersString,
    });

    expect(searchParameters.has('query')).toBe(false);
    expect(searchParameters.has('https://notexample.com/search?query')).toBe(
      true,
    );
    expect(searchParameters.get('query')).toBeNull();
    expect(searchParameters.get('https://notexample.com/search?query')).toBe(
      '@',
    );
  });

  test('strips ?', () => {
    const parametersString = '?query=value';
    const { searchParameters } = urlBuilder(urlString, {
      searchParams: parametersString,
    });

    expect(searchParameters.has('query')).toBe(true);
  });

  test.each(['foo=&bar=baz', 'foo&bar=baz'])('equal is implied', string => {
    const { searchParameters } = urlBuilder(urlString, {
      searchParams: string,
    });

    expect(searchParameters.get('foo')).toBe('');
    expect(searchParameters.toString()).toBe('foo=&bar=baz');
  });

  test('adds search parameters when calling toString', () => {
    const builder = urlBuilder(urlString, {
      pathVariables: ['one', 2, 3],
      searchParams: { key: 'value', number: 1 },
    });

    expect(builder.toString()).toBe(
      'https://example.com/one/2/3/?key=value&number=1',
    );
  });
});
