import { Body } from './body';
import { ContentType, RequestMethod, ResponseContentType } from './enums';
import { Headers } from './headers';
import { normalizeMethodName } from './http_utils';
import { RequestArgs } from './interfaces';
import { URLSearchParams } from './url_search_params';

export class Request extends Body {
  method: RequestMethod;
  headers: Headers;
  url: string;
  contentType: ContentType;
  withCredentials: boolean;
  responseType: ResponseContentType;
  timeOut: number;

  constructor(requestOptions: RequestArgs) {
    super();
    const url = requestOptions.url;
    this.url = requestOptions.url!;
    const paramsArg = requestOptions.params || requestOptions.search;

    if (paramsArg) {
      let params: string;
      if (typeof paramsArg === 'object' && !(paramsArg instanceof URLSearchParams)) {
        params = urlEncodeParams(paramsArg).toString();
      } else {
        params = paramsArg.toString();
      }
      if (params.length > 0) {
        let prefix = '?';
        if (this.url.indexOf('?') !== -1) {
          prefix = this.url[this.url.length - 1] === '&' ? '' : '&';
        }
        this.url = url + prefix + params;
      }
    }
    this._body = requestOptions.body;
    this.method = normalizeMethodName(requestOptions.method!);
    this.headers = new Headers(requestOptions.headers);
    this.contentType = this.detectContentType();
    this.withCredentials = requestOptions.withCredentials!;
    this.responseType = requestOptions.responseType!;
    this.timeOut = requestOptions.timeOut!;
  }

  /**
   * Returns the content type enum based on header options.
   */
  detectContentType(): ContentType {
    switch (this.headers.get('content-type')) {
      case 'application/json':
        return ContentType.JSON;
      case 'application/x-www-form-urlencoded':
        return ContentType.FORM;
      case 'multipart/form-data':
        return ContentType.FORM_DATA;
      case 'text/plain':
      case 'text/html':
        return ContentType.TEXT;
      case 'application/octet-stream':
        return this._body instanceof ArrayBuffer ? ContentType.ARRAY_BUFFER : ContentType.BLOB;
      default:
        return this.detectContentTypeFromBody();
    }
  }

  /**
   * Returns the content type of request's body based on its type.
   */
  detectContentTypeFromBody(): ContentType {
    if (this._body == null) {
      return ContentType.NONE;
    } else if (this._body instanceof URLSearchParams) {
      return ContentType.FORM;
    } else if (this._body instanceof FormData) {
      return ContentType.FORM_DATA;
    } else if (this._body instanceof Blob) {
      return ContentType.BLOB;
    } else if (this._body instanceof ArrayBuffer) {
      return ContentType.ARRAY_BUFFER;
    } else if (this._body && typeof this._body === 'object') {
      return ContentType.JSON;
    } else {
      return ContentType.TEXT;
    }
  }

  /**
   * Returns the request's body according to its type. If body is undefined, return
   * null.
   */
  getBody(): any {
    switch (this.contentType) {
      case ContentType.JSON:
        return this.text();
      case ContentType.FORM:
        return this.text();
      case ContentType.FORM_DATA:
        return this._body;
      case ContentType.TEXT:
        return this.text();
      case ContentType.BLOB:
        return this.blob();
      case ContentType.ARRAY_BUFFER:
        return this.arrayBuffer();
      default:
        return null;
    }
  }

  /**
   * Set the Request's body
   */
  setBody(body: any) {
    this._body = body;
    this.contentType = this.detectContentType();
  }
}

function urlEncodeParams(params: { [key: string]: any }): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value && Array.isArray(value)) {
      value.forEach(element => searchParams.append(key, element.toString()));
    } else {
      searchParams.append(key, value.toString());
    }
  });
  return searchParams;
}

const noop = function() {};
const w = typeof window === 'object' ? window : noop;
const FormData = (() => (w as any).FormData || noop)();
const Blob = (() => (w as any).Blob || noop)();
export const ArrayBuffer: ArrayBufferConstructor = (() => (w as any).ArrayBuffer || noop)();
