import { ReadyState, RequestMethod, ResponseContentType, ResponseType } from './enums';
import { Headers } from './headers';
import { Request } from './request';
import { Response } from './response';

import { URLSearchParams } from './url_search_params';

export interface RequestOptionsArgs {
  url?: string | null;
  method?: string | RequestMethod | null;
  search?: string | URLSearchParams | { [key: string]: any | any[] } | null;
  params?: string | URLSearchParams | { [key: string]: any | any[] } | null;
  headers?: Headers | null;
  body?: any;
  withCredentials?: boolean | null;
  responseType?: ResponseContentType | null;
  timeOut?: number | null;
}

export interface RequestArgs extends RequestOptionsArgs {
  url: string | null;
}

export interface ResponseOptionsArgs {
  body?: string | Object | FormData | ArrayBuffer | Blob | null;
  status?: number | null;
  statusText?: string | null;
  headers?: Headers | null;
  type?: ResponseType | null;
  url?: string | null;
  duration?: number | null;
  request?: Request | null;
}

export abstract class ConnectionAdapter {
  abstract createConnection(request: Request): Adapter;
}

export abstract class Adapter {
  readyState!: ReadyState;
  request!: Request;
  response!: Promise<Response>;
}
