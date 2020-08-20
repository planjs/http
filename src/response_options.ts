import { ResponseType } from './enums';
import { Request } from './request';
import { Headers } from './headers';
import { ResponseOptionsArgs } from './interfaces';

export class ResponseOptions {
  // TODO: FormData | Blob
  body: string | Object | ArrayBuffer | Blob | null;
  status: number | null;
  headers: Headers | null;
  statusText: string | null;
  type: ResponseType | null;
  url: string | null;
  duration: number | null;
  request: Request | null;

  constructor(opts: ResponseOptionsArgs = {}) {
    const { body, status, headers, statusText, type, url, duration, request } = opts;
    this.body = body != null ? body : null;
    this.status = status != null ? status : null;
    this.headers = headers != null ? headers : null;
    this.statusText = statusText != null ? statusText : null;
    this.type = type != null ? type : null;
    this.url = url != null ? url : null;
    this.duration = duration != null ? duration : null;
    this.request = request != null ? request : null;
  }

  merge(options?: ResponseOptionsArgs): ResponseOptions {
    return new ResponseOptions({
      body: options && options.body != null ? options.body : this.body,
      status: options && options.status != null ? options.status : this.status,
      headers: options && options.headers != null ? options.headers : this.headers,
      statusText: options && options.statusText != null ? options.statusText : this.statusText,
      type: options && options.type != null ? options.type : this.type,
      url: options && options.url != null ? options.url : this.url,
      duration: options && options.duration != null ? options.duration : this.duration,
    });
  }
}
