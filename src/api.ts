import { isNil, tryCatchAsync } from '@ethang/util/data';
import { deepMerge } from '@ethang/util/object';
import type { z, ZodSchema } from 'zod';

import { fetcher } from './fetcher';
import { urlBuilder } from './url-builder';

type RequestConfig = {
  bodySchema?: ZodSchema;
  defaultRequestInit?: RequestInit;
  path: string;
  pathVariableLength?: number;
  searchParamSchema?: ZodSchema;
};

type ApiConfig<T extends Record<string, Readonly<RequestConfig>>> = {
  baseUrl: string;
  cacheInterval?: number;
  defaultRequestInit?: RequestInit;
  requests: T;
};

type RequestOptions = {
  pathVariables?: Array<string | number>;
  requestInit?: RequestInit;
  searchParams?: Record<string, string | number | undefined>;
};

type RequestFunction = (options?: RequestOptions) => Request;

type FetchOptions = RequestOptions & { cacheInterval?: number };
type FetchFunction = (options?: FetchOptions) => Promise<Response | undefined>;

export class Api<T extends Record<string, Readonly<RequestConfig>>> {
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
    return (options?: FetchOptions) => {
      return fetcher({
        cacheInterval: options?.cacheInterval ?? this.globalCacheInterval,
        request: this.request[key](options),
      });
    };
  }

  private generateRequestMethod(key: string): RequestFunction {
    const requestConfig = this.config.requests[key];

    return (options?: RequestOptions): Request => {
      if (!isNil(requestConfig.bodySchema)) {
        const bodyInit = options?.requestInit?.body;

        if (typeof bodyInit === 'string') {
          requestConfig.bodySchema.parse(JSON.parse(bodyInit));
        } else {
          requestConfig.bodySchema.parse(bodyInit);
        }
      }

      if (!isNil(requestConfig.searchParamSchema)) {
        requestConfig.searchParamSchema.parse(options?.searchParams);
      }

      if (
        !isNil(requestConfig.pathVariableLength) &&
        options?.pathVariables?.length !== requestConfig.pathVariableLength
      ) {
        throw new Error('Invalid number of path variables');
      }

      const builder = urlBuilder(requestConfig.path, {
        pathVariables: options?.pathVariables,
        searchParams: options?.searchParams,
        urlBase: this.config.baseUrl,
      });

      const requestInit = deepMerge(
        {},
        this.config.defaultRequestInit,
        requestConfig.defaultRequestInit,
        options?.requestInit,
      );

      return new Request(builder.url, requestInit);
    };
  }
}
