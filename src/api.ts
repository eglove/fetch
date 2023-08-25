import { cloneDeep, isEmpty, isNil, merge } from 'lodash';
import { z, ZodType } from 'zod';

import { cacheBust, fetcher, getCachedResponse } from './fetcher';

type ApiOptions<RequestType extends Record<string, CreateRequest<ZodType>>> =
  GlobalOptions & {
    requests: RequestType;
  };

type GlobalOptions = {
  baseUrl?: string;
  cacheInterval?: number;
  isCached?: boolean;
  requestOptions?: RequestInit;
};

type CreateRequest<SchemaType extends ZodType> = Omit<
  GlobalOptions,
  'baseUrl'
> & {
  cacheId?: string;
  path: string | URL;
  pathVariables?: Record<string, string | number>;
  searchParams?: Record<string, string | number | undefined>;
  zodSchema: SchemaType;
};

type FetchOptions<SchemaType extends ZodType> = Omit<
  GlobalOptions,
  'baseUrl'
> & {
  cacheId?: string;
  pathVariables?: Record<string, string | number>;
  searchParams?: Record<string, string | number | undefined>;
  zodSchema?: SchemaType;
};

type FetchReturn<DataType extends ZodType> = {
  data?: z.output<DataType>;
  errors?: string[];
  isSuccess: boolean;
};

type RequestMap<RequestType, SchemaType extends ZodType> = Map<
  keyof RequestType,
  CreateRequest<SchemaType>
>;

export class Api<RequestType extends Record<string, CreateRequest<ZodType>>> {
  private readonly requestOptions?: RequestInit;
  private readonly requests: RequestMap<RequestType, ZodType> = new Map();
  private readonly isCached?: boolean = false;
  private readonly cacheInterval?: number;
  private readonly baseUrl?: string;
  public readonly madeRequests: Map<string, Request> = new Map();

  constructor({
    requestOptions,
    baseUrl,
    requests,
    isCached,
    cacheInterval,
  }: ApiOptions<RequestType>) {
    this.baseUrl = baseUrl;
    this.cacheInterval = cacheInterval;
    this.isCached = isCached;
    this.requestOptions = requestOptions;

    for (const requestInitKey of Object.keys(requests)) {
      const request = requests[requestInitKey];

      this.requests.set(requestInitKey, request);
    }
  }

  public async cacheBust(cacheId: string): Promise<boolean | undefined> {
    const request = this.madeRequests.get(cacheId);

    if (!isNil(request)) {
      return cacheBust(request);
    }
  }

  public async getCachedResponse(
    cacheId: string,
  ): Promise<Response | undefined> {
    const request = this.madeRequests.get(cacheId);

    if (!isNil(request)) {
      return getCachedResponse(request);
    }
  }

  public async fetch<
    NameType extends keyof RequestType,
    SchemaType extends ZodType,
  >(
    name: NameType,
    options?: FetchOptions<SchemaType>,
  ): Promise<FetchReturn<RequestType[NameType]['zodSchema']>> {
    const requestDefaults = this.requests.get(name);

    if (isNil(requestDefaults)) {
      throw new Error('Request not found');
    }

    // Replace path variables
    let url = requestDefaults.path.toString();
    const pathVariables = merge(
      requestDefaults.pathVariables,
      options?.pathVariables,
    );

    if (!isNil(pathVariables) && !isEmpty(pathVariables)) {
      for (const [key, value] of Object.entries(pathVariables)) {
        url = url.replace(`:${key}`, String(value));
      }
    }

    const urlObject = new URL(url, this.baseUrl);

    // Append search params
    const searchParameters = merge(
      cloneDeep(requestDefaults.searchParams),
      options?.searchParams,
    );
    if (!isNil(searchParameters) && !isEmpty(searchParameters)) {
      for (const [key, value] of Object.entries(searchParameters)) {
        if (!isNil(value)) {
          urlObject.searchParams.append(key, String(value));
        }
      }
    }

    // Create final request
    const newRequest = new Request(
      urlObject,
      merge(
        this.requestOptions,
        cloneDeep(requestDefaults.requestOptions),
        options?.requestOptions,
      ),
    );
    const defaultCacheId = `${newRequest.url}${newRequest.method}${
      newRequest.headers.get('Vary') ?? ''
    }`;
    this.madeRequests.set(
      requestDefaults.cacheId ?? options?.cacheId ?? defaultCacheId,
      newRequest,
    );

    try {
      const response = await fetcher({
        cacheInterval:
          options?.cacheInterval ??
          requestDefaults.cacheInterval ??
          this.cacheInterval,
        isCached:
          options?.isCached ?? requestDefaults.isCached ?? this.isCached,
        request: newRequest,
      });

      const schema = options?.zodSchema ?? requestDefaults.zodSchema;
      const parsed = schema.safeParse(await response?.json());

      if (parsed.success) {
        return {
          data: parsed.data,
          isSuccess: parsed.success,
        };
      }

      return {
        errors: parsed.error.format()._errors,
        isSuccess: parsed.success,
      };
    } catch {
      return {
        isSuccess: false,
      };
    }
  }
}
