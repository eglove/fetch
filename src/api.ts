import { z, ZodSchema, ZodType } from 'zod';

type FetchReturn<DataType extends ZodType> = {
  data?: z.output<DataType>;
  errors?: string[];
  isSuccess: boolean;
};

type SearchParameters =
  | [string, unknown][]
  | Record<string, unknown>
  | string
  | URLSearchParams;

type FetchOptions = {
  pathVariables?: unknown[];
  requestOptions?: RequestInit;
  searchParameters?: SearchParameters;
};

type CreateRequest<SchemaType extends ZodType> = {
  options?: RequestInit;
  path: string | URL;
  pathVariables?: unknown[];
  searchParams?: SearchParameters;
  zodSchema: SchemaType;
};

type ApiOptions<RequestType extends Record<string, CreateRequest<ZodType>>> = {
  baseUrl?: string;
  defaultHeaders?: HeadersInit;
  requests: RequestType;
};

type RequestMap<RequestType> = Map<
  keyof RequestType,
  { request: Request; zodSchema: ZodSchema }
>;

export class Api<RequestType extends Record<string, CreateRequest<ZodType>>> {
  private readonly defaultHeaders?: HeadersInit;
  public readonly requests: RequestMap<RequestType> = new Map();

  constructor({ defaultHeaders, baseUrl, requests }: ApiOptions<RequestType>) {
    let baseUrlObject: URL | undefined;
    this.defaultHeaders = defaultHeaders;

    if (baseUrl !== undefined) {
      baseUrlObject = new URL(baseUrl);
    }

    for (const requestInitKey of Object.keys(requests)) {
      const request = requests[requestInitKey];

      const requestUrl = this.mergePathVariables(
        new URL(request.path.toString(), baseUrlObject),
        request.pathVariables,
      );

      const searchParameters = this.buildSearchParameters(request.searchParams);

      for (const [key, value] of searchParameters) {
        requestUrl.searchParams.append(key, value);
      }

      this.requests.set(requestInitKey, {
        request: new Request(requestUrl.toString(), request.options),
        zodSchema: request.zodSchema,
      });
    }
  }

  public async fetch<NameType extends keyof RequestType>(
    name: NameType,
    options?: FetchOptions,
  ): Promise<FetchReturn<RequestType[NameType]['zodSchema']>> {
    const requestObject = this.requests.get(name);

    if (requestObject === undefined) {
      throw new Error('Request not found');
    }

    const url = this.getRequestUrl(requestObject.request, options);
    const newRequest = new Request(url, {
      ...options?.requestOptions,
      headers: {
        ...this.defaultHeaders,
        ...options?.requestOptions?.headers,
      },
    });

    try {
      const response = await fetch(newRequest);

      const parsed = requestObject.zodSchema.safeParse(await response.json());

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

  private getRequestUrl(request: Request, overrides?: FetchOptions): string {
    const url = this.mergePathVariables(
      new URL(request.url),
      overrides?.pathVariables,
    );

    // eslint-disable-next-line functional/immutable-data
    url.search = this.mergeSearchParameters(
      url.searchParams,
      overrides?.searchParameters,
    ).toString();

    return url.toString();
  }

  private mergePathVariables(url: URL, pathVariables?: unknown[]): URL {
    let newUrl = url;
    if (pathVariables) {
      for (const value of pathVariables) {
        newUrl = new URL(`${newUrl}/${value}`, newUrl);
      }
    }

    return newUrl;
  }

  private mergeSearchParameters(
    base: SearchParameters | undefined,
    overrides: SearchParameters | undefined,
  ): URLSearchParams {
    const baseParameters = this.buildSearchParameters(base);
    const overrideParameters = this.buildSearchParameters(overrides);

    for (const [key, value] of overrideParameters) {
      baseParameters.set(key, value);
    }

    return baseParameters;
  }

  private buildSearchParameters(
    parameters: SearchParameters | undefined,
  ): URLSearchParams {
    let searchParameters = new URLSearchParams();

    if (parameters === undefined) {
      return searchParameters;
    }

    if (typeof parameters === 'string') {
      searchParameters = new URLSearchParams(parameters);
    } else if (Array.isArray(parameters)) {
      for (const [key, value] of parameters) {
        searchParameters.append(key, String(value));
      }
    } else if (parameters instanceof URLSearchParams) {
      searchParameters = parameters;
    } else if (typeof parameters === 'object') {
      for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined) {
          searchParameters.append(key, String(value));
        }
      }
    }

    return searchParameters;
  }
}
