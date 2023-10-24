import { isEmpty } from '@ethang/util/data';

export type UrlConfig = {
  pathVariables?: Array<string | number>;
  searchParams?: string | Record<string, unknown>;
  urlBase?: string | URL;
};

class UrlBuilder {
  private _url: URL;
  private readonly searchParameters: URLSearchParams;
  private readonly pathVariables: Array<string | number | undefined>;

  public constructor(
    private readonly urlString: string,
    private readonly config?: UrlConfig,
  ) {
    this._url = new URL(urlString, config?.urlBase);
    this.pathVariables = config?.pathVariables ?? [];
    this.searchParameters = this.buildSearchParameters(config?.searchParams);
  }

  public get url(): URL {
    return this.buildUrl();
  }

  public toString(): string {
    return this.buildUrl().toString();
  }

  private buildUrl(): URL {
    if (!isEmpty(this.pathVariables)) {
      let urlString = this._url.toString();

      for (const pathVariable of this.pathVariables) {
        if (pathVariable !== undefined) {
          urlString += `${pathVariable}/`;
        }
      }

      this._url = new URL(urlString);
    }

    if (this.searchParameters.size > 0) {
      for (const [key, value] of this.searchParameters.entries()) {
        this._url.searchParams.append(key, value);
      }
    }

    return this._url;
  }

  private buildSearchParameters(
    parameters: UrlConfig['searchParams'],
  ): URLSearchParams {
    let searchParameters = new URLSearchParams();

    if (typeof parameters === 'string') {
      searchParameters = new URLSearchParams(parameters);
    }

    if (parameters !== undefined && typeof parameters === 'object') {
      // eslint-disable-next-line guard-for-in
      for (const searchParametersKey in parameters) {
        const value = parameters[searchParametersKey];
        if (value !== undefined) {
          searchParameters.append(searchParametersKey, String(value));
        }
      }
    }

    return searchParameters;
  }
}

export function urlBuilder(urlString: string, config?: UrlConfig): UrlBuilder {
  return new UrlBuilder(urlString, config);
}
