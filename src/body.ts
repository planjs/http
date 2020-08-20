import { stringToArrayBuffer } from './http_utils';
import { URLSearchParams } from './url_search_params';

export abstract class Body {
  protected _body: any;

  /**
   * Attempts to return body as parsed `JSON` object, or raises an exception.
   */
  json(): any {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }

    if (this._body instanceof ArrayBuffer) {
      return JSON.parse(this.text());
    }

    return this._body;
  }

  /**
   * Returns the body as a string, presuming `toString()` can be called on the response body.
   *
   * When decoding an `ArrayBuffer`, the optional `encodingHint` parameter determines how the
   * bytes in the buffer will be interpreted. Valid values are:
   *
   * - `legacy` - incorrectly interpret the bytes as UTF-16 (technically, UCS-2). Only characters
   *   in the Basic Multilingual Plane are supported, surrogate pairs are not handled correctly.
   *   In addition, the endianness of the 16-bit octet pairs in the `ArrayBuffer` is not taken
   *   into consideration. This is the default behavior to avoid breaking apps, but should be
   *   considered deprecated.
   *
   * - `iso-8859` - interpret the bytes as ISO-8859 (which can be used for ASCII encoded text).
   */
  text(encodingHint: 'legacy' | 'iso-8859' = 'legacy'): string {
    if (this._body instanceof URLSearchParams) {
      return this._body.toString();
    }

    if (this._body instanceof ArrayBuffer) {
      switch (encodingHint) {
        case 'legacy':
          // TODO: Argument of type 'Uint16Array' is not assignable to parameter of type
          // 'number[]'.
          return String.fromCharCode.apply(null, new Uint16Array(this._body) as any);
        case 'iso-8859':
          // TODO: Argument of type 'Uint8Array' is not assignable to parameter of type
          // 'number[]'.
          return String.fromCharCode.apply(null, new Uint8Array(this._body) as any);
        default:
          throw new Error(`Invalid value for encodingHint: ${encodingHint}`);
      }
    }

    if (this._body == null) {
      return '';
    }

    if (typeof this._body === 'object') {
      return JSON.stringify(this._body);
    }

    return this._body.toString();
  }

  /**
   * Return the body as an ArrayBuffer
   */
  arrayBuffer(): ArrayBuffer {
    if (this._body instanceof ArrayBuffer) {
      return this._body;
    }

    return stringToArrayBuffer(this.text());
  }

  /**
   * Returns the request's body as a Blob, assuming that body exists.
   */
  blob(): Blob {
    if (this._body instanceof Blob) {
      return this._body;
    }

    if (this._body instanceof ArrayBuffer) {
      return new Blob([this._body]);
    }

    throw new Error('The request body isn\'t either a blob or an array buffer');
  }
}
