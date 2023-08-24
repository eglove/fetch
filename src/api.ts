import { z, ZodSchema, ZodType } from 'zod';

type FetchReturn<DataType extends ZodType> = {
  data?: z.output<DataType>;
  errors?: string[];
  isSuccess: boolean;
};

type SearchParameters =
  | string[][]
  | Record<string, string>
  | string
  | URLSearchParams;

type FetchOptions = {
  requestOptions?: RequestInit;
  searchParameters?: SearchParameters;
};

type CreateRequest<SchemaType extends ZodType> = {
  options?: RequestInit;
  path: string | URL;
  searchParams?: SearchParameters;
  zodSchema: SchemaType;
};

export class Api<RequestType extends Record<string, CreateRequest<ZodType>>> {
  public readonly requests: Map<
    keyof RequestType,
    { request: Request; zodSchema: ZodSchema }
  > = new Map();

  private readonly baseurlObject: URL;

  constructor(
    public readonly baseUrl: string,
    requestInit: RequestType,
  ) {
    this.baseurlObject = new URL(baseUrl);

    for (const requestInitKey of Object.keys(requestInit)) {
      const request = requestInit[requestInitKey];

      const requestUrl = new URL(request.path.toString(), this.baseurlObject);
      const searchParameters = new URLSearchParams(request.searchParams);

      for (const [key, value] of searchParameters) {
        requestUrl.searchParams.append(key, value);
      }

      this.requests.set(requestInitKey, {
        request: new Request(requestUrl.toString(), request.options),
        zodSchema: request.zodSchema,
      });
    }
  }

  async fetch<NameType extends keyof RequestType>(
    name: NameType,
    options?: FetchOptions,
  ): Promise<FetchReturn<RequestType[NameType]['zodSchema']>> {
    const requestObject = this.requests.get(name);

    if (requestObject === undefined) {
      throw new Error('Request not found');
    }

    const url = this.getRequestUrl(name, options);
    const newRequest = new Request(url, options?.requestOptions);

    const response = await fetch(newRequest);

    if (!response.ok) {
      return {
        isSuccess: false,
      };
    }

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
  }

  private getRequestUrl(
    name: keyof RequestType,
    overrides?: FetchOptions,
  ): string {
    const requestObject = this.requests.get(name);

    if (requestObject === undefined) {
      throw new Error('Request not found');
    }

    const url = new URL(requestObject.request.url);
    // eslint-disable-next-line functional/immutable-data
    url.search = this.mergeSearchParameters(
      url.searchParams,
      overrides?.searchParameters,
    ).toString();

    return url.toString();
  }

  private mergeSearchParameters(
    base: SearchParameters | undefined,
    overrides: SearchParameters | undefined,
  ): URLSearchParams {
    const baseParameters = new URLSearchParams(base);
    const overrideParameters = new URLSearchParams(overrides);

    for (const [key, value] of overrideParameters) {
      baseParameters.set(key, value);
    }

    return baseParameters;
  }
}
