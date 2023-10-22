export type UrlConfig = {
  searchParams?: string | Record<string, unknown>;
  urlBase?: string | URL;
};

class UrlBuilder {
  public url: URL;
  public searchParameters: URLSearchParams;

  public constructor(
    private readonly urlString: string,
    private readonly config?: UrlConfig,
  ) {
    this.url = new URL(urlString, config?.urlBase);
    this.searchParameters = this.buildSearchParameters(config?.searchParams);
  }

  public toString(): string {
    if (this.searchParameters.size > 0) {
      for (const [key, value] of Object.entries(this.searchParameters)) {
        this.url.searchParams.append(key, value);
      }
    }

    return this.url.toString();
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
