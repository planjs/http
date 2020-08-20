import { RequestMethod, ResponseContentType } from './enums';
import { Headers } from './headers';
import { normalizeMethodName } from './http_utils';
import { URLSearchParams } from './url_search_params';
import { RequestOptionsArgs } from './interfaces';

export class RequestOptions {
  method: RequestMethod | string | null;
  headers: Headers | null;
  body: any;
  url: string | null;
  params: URLSearchParams;
  /**
   * Indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies or authorization headers.
   */
  withCredentials: boolean | null;
  responseType: ResponseContentType | null;
  timeOut: number | null;

  get search(): URLSearchParams {
    return this.params;
  }

  set search(params: URLSearchParams) {
    this.params = params;
  }

  constructor(opts: RequestOptionsArgs = {}) {
    const {
      method,
      headers,
      body,
      url,
      search,
      params,
      withCredentials,
      responseType,
      timeOut,
    } = opts;
    this.method = method != null ? normalizeMethodName(method) : null;
    this.headers = headers != null ? headers : null;
    this.body = body != null ? body : null;
    this.url = url != null ? url : null;
    this.params = this._mergeSearchParams(params || search);
    this.withCredentials = withCredentials != null ? withCredentials : null;
    this.responseType = responseType != null ? responseType : null;
    this.timeOut = timeOut != null ? timeOut : null;
  }

  merge(options?: RequestOptionsArgs): RequestOptions {
    return new RequestOptions({
      method: options && options.method != null ? options.method : this.method,
      headers: options && options.headers != null ? options.headers : new Headers(this.headers),
      body: options && options.body != null ? options.body : this.body,
      url: options && options.url != null ? options.url : this.url,
      params: options && this._mergeSearchParams(options.params || options.search),
      withCredentials:
        options && options.withCredentials != null ? options.withCredentials : this.withCredentials,
      responseType:
        options && options.responseType != null ? options.responseType : this.responseType,
      timeOut: options && options.timeOut != null ? options.timeOut : this.timeOut,
    });
  }

  protected _mergeSearchParams(
    params?: string | URLSearchParams | { [key: string]: any | any[] } | null
  ): URLSearchParams {
    if (!params) return this.params;

    if (params instanceof URLSearchParams) {
      return params.clone();
    }

    if (typeof params === 'string') {
      return new URLSearchParams(params);
    }

    return this._parseParams(params);
  }

  private _parseParams(objParams: { [key: string]: any | any[] } = {}): URLSearchParams {
    const params = new URLSearchParams();
    Object.keys(objParams).forEach((key: string) => {
      const value: any | any[] = objParams[key];
      if (Array.isArray(value)) {
        value.forEach((item: any) => this._appendParam(key, item, params));
      } else {
        this._appendParam(key, value, params);
      }
    });
    return params;
  }

  private _appendParam(key: string, value: any, params: URLSearchParams): void {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    params.append(key, value);
  }
}
