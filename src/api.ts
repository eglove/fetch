import { isNil, tryCatchAsync } from '@ethang/util/data';
import type { z, ZodSchema } from 'zod';

import { fetcher } from './fetcher';
import { urlBuilder } from './url-builder';

type RequestConfig = {
  bodySchema?: ZodSchema;
  path: string;
};

type ApiConfig<T extends Record<string, Readonly<RequestConfig>>> = {
  baseUrl: string;
  cacheInterval?: number;
  requests: T;
};

type ExtraRequestOptions = {
  pathVariables?: Array<string | number>;
  searchParams?: Record<string, string | number | undefined>;
};

type RequestFunction = (
  requestInit?: RequestInit,
  options?: ExtraRequestOptions,
) => Request;

type FetchOptions = ExtraRequestOptions & { cacheInterval?: number };

type FetchFunction = (
  requestInit?: RequestInit,
  options?: FetchOptions,
) => Promise<Response | undefined>;

class Api<T extends Record<string, Readonly<RequestConfig>>> {
  private readonly config: ApiConfig<T>;
  private readonly globalCacheInterval: number;
  // @ts-expect-error generated in constructor
  public readonly request: {
    [K in keyof T]: RequestFunction;
  } = {};

  // @ts-expect-error generated in constructor
  public readonly fetch: {
    [K in keyof T]: FetchFunction;
  } = {};

  public constructor(config: ApiConfig<T>) {
    this.config = config;
    this.globalCacheInterval = config.cacheInterval ?? 0;

    for (const key of Object.keys(this.config.requests)) {
      this.request[key as keyof T] = this.generateRequestMethod(key);
      this.fetch[key as keyof T] = this.generateFetchMethod(key);
    }
  }

  public async parseJson<Z extends ZodSchema>(
    response: Response,
    responseSchema: Z,
  ): Promise<z.output<typeof responseSchema> | undefined> {
    const jsonResult = await tryCatchAsync(() => {
      return response.json();
    });

    if (!jsonResult.isSuccess) {
      return undefined;
    }

    const dataResult = responseSchema.safeParse(jsonResult.data);

    if (!dataResult.success) {
      return undefined;
    }

    return dataResult.data;
  }

  private generateFetchMethod(key: string): FetchFunction {
    return (requestOptions?: RequestInit, options?: FetchOptions) => {
      return fetcher({
        cacheInterval: options?.cacheInterval ?? this.globalCacheInterval,
        request: this.request[key](requestOptions, options),
      });
    };
  }

  private generateRequestMethod(key: string): RequestFunction {
    const apiEndpointConfig = this.config.requests[key];

    if (isNil(apiEndpointConfig)) {
      throw new Error(`API endpoint configuration for ${key} was not found.`);
    }

    return (
      requestOptions?: RequestInit,
      options?: ExtraRequestOptions,
    ): Request => {
      if (
        !isNil(apiEndpointConfig.bodySchema) &&
        requestOptions?.body !== undefined
      ) {
        apiEndpointConfig.bodySchema.parse(requestOptions.body);
      }

      const builder = urlBuilder(apiEndpointConfig.path, {
        pathVariables: options?.pathVariables,
        searchParams: options?.searchParams,
        urlBase: this.config.baseUrl,
      });

      return new Request(builder.url, {
        body: JSON.stringify(requestOptions?.body),
        ...requestOptions,
      });
    };
  }
}
