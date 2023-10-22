import { fetcher } from './fetcher';
import { urlBuilder } from './url-builder';

type RequestOptions = {
  defaultCacheInterval?: number;
  defaultRequestOptions?: RequestInit;
  url: string;
};

type ApiOptions<RequestType extends Record<string, RequestOptions>> = {
  baseUrl: string;
  defaultCacheInterval?: number;
  defaultRequestOptions?: RequestInit;
  requests: RequestType;
};

type GetRequestOptions = {
  pathVariables?: string;
  requestOptions?: RequestInit;
  searchParams?: Record<string, string | number | undefined>;
};

export class Api<RequestType extends Record<string, RequestOptions>> {
  private readonly baseUrl: string;
  private readonly defaultCacheInterval: number;
  private readonly defaultRequestOptions?: RequestInit;
  private readonly requests: RequestType;

  public constructor({
    baseUrl,
    defaultCacheInterval = 0,
    defaultRequestOptions,
    requests,
  }: ApiOptions<RequestType>) {
    this.baseUrl = baseUrl;
    this.defaultCacheInterval = defaultCacheInterval;
    this.defaultRequestOptions = defaultRequestOptions;
    this.requests = requests;
  }

  public getRequest<NameType extends keyof RequestType>(
    name: NameType,
    options?: GetRequestOptions,
  ): Request {
    const request = this.requests[name];

    const url = urlBuilder(options?.pathVariables ?? '', {
      searchParams: options?.searchParams,
      urlBase: this.baseUrl,
    });

    const requestOptions = {
      ...this.defaultRequestOptions,
      ...request?.defaultRequestOptions,
      ...options?.requestOptions,
    };

    return new Request(url.url, requestOptions);
  }

  public async fetch<NameType extends keyof RequestType>(
    name: NameType,
    options?: GetRequestOptions & { cacheInterval?: number },
  ): Promise<Response | undefined> {
    const request = this.requests[name];

    return fetcher({
      cacheInterval:
        options?.cacheInterval ??
        request.defaultCacheInterval ??
        this.defaultCacheInterval,
      request: this.getRequest(name, options),
    });
  }
}
