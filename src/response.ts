import { ResponseOptions } from './response_options';
import { Request } from './request';
import { Body } from './body';
import { ResponseType } from './enums';
import { Headers } from './headers';

export class Response extends Body {
  /**
   * One of "basic", "cors", "default", "error", or "opaque".
   *
   * Defaults to "default".
   */
  type: ResponseType;
  /**
   * True if the response's status is within 200-299
   */
  ok: boolean;
  /**
   * URL of response.
   *
   * Defaults to empty string.
   */
  url: string;
  /**
   * Status code returned by server.
   *
   * Defaults to 200.
   */
  status: number;
  /**
   * Text representing the corresponding reason phrase to the `status`, as defined in [ietf rfc 2616
   * section 6.1.1](https://tools.ietf.org/html/rfc2616#section-6.1.1)
   *
   * Defaults to "OK"
   */
  statusText: string | null;
  /**
   * The response headers
   */
  headers: Headers | null;
  /**
   * The response duration
   */
  duration: number | null;
  /**
   * The request config
   */
  request: Request | null;

  constructor(responseOptions: ResponseOptions) {
    super();
    this._body = responseOptions.body;
    this.status = responseOptions.status!;
    this.ok = this.status >= 200 && this.status <= 299;
    this.statusText = responseOptions.statusText;
    this.headers = responseOptions.headers;
    this.type = responseOptions.type!;
    this.url = responseOptions.url!;
    this.duration = responseOptions.duration!;
    this.request = responseOptions.request!;
  }

  toString(): string {
    return `Response with status: ${this.status} ${this.statusText} for URL: ${this.url}`;
  }
}
