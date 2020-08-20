import { RequestMethod } from './enums';
import { Request } from './request';
import { RequestOptions } from './request_options';
import { RequestOptionsArgs, ConnectionAdapter } from './interfaces';
import { ConnectionXHR } from './adapters/xhr';

function mergeOptions(
  defaultOpts: RequestOptionsArgs,
  opts: RequestOptionsArgs | undefined,
  method: RequestMethod,
  url: string
) {
  const newOptions = new RequestOptions(defaultOpts);
  if (opts) {
    return newOptions.merge(
      new RequestOptions({
        method: method,
        url: opts.url || url,
        search: opts.search,
        params: opts.params,
        headers: opts.headers,
        body: opts.body,
        withCredentials: opts.withCredentials,
        responseType: opts.responseType,
        timeOut: opts.timeOut,
      })
    );
  }

  return newOptions.merge(new RequestOptions({ method, url }));
}

export function httpRequest(adapter: ConnectionAdapter, request: Request) {
  return adapter.createConnection(request).response;
}

export class Http {
  protected defaultOptions: RequestOptions;
  protected adapter: ConnectionAdapter;

  constructor(opts?: RequestOptions, adapter?: ConnectionAdapter) {
    this.defaultOptions = opts! || new RequestOptions();
    this.adapter = adapter || new ConnectionXHR();
  }

  request(url: string | Request, options?: RequestOptionsArgs) {
    if (typeof url === 'string') {
      return httpRequest(
        this.adapter,
        new Request(
          mergeOptions(
            this.defaultOptions,
            options,
            Object.prototype.hasOwnProperty.call(options, 'method')
              ? (options!.method! as RequestMethod)
              : Object.prototype.hasOwnProperty.call(this.defaultOptions, 'method')
              ? (this.defaultOptions.method as RequestMethod)
              : RequestMethod.Get,
            url
          )
        )
      );
    } else if (url instanceof Request) {
      return httpRequest(this.adapter, url);
    } else {
      throw new Error('First argument must be a url string or Request instance.');
    }
  }

  get(url: string, options?: RequestOptionsArgs) {
    return this.request(
      new Request(mergeOptions(this.defaultOptions, options, RequestMethod.Get, url))
    );
  }

  post(url: string, body: any, options?: RequestOptionsArgs) {
    return this.request(
      new Request(
        mergeOptions(
          this.defaultOptions.merge(new RequestOptions({ body: body })),
          options,
          RequestMethod.Post,
          url
        )
      )
    );
  }

  put(url: string, body: any, options?: RequestOptionsArgs) {
    return this.request(
      new Request(
        mergeOptions(
          this.defaultOptions.merge(new RequestOptions({ body: body })),
          options,
          RequestMethod.Put,
          url
        )
      )
    );
  }

  delete(url: string, options?: RequestOptionsArgs) {
    return this.request(
      new Request(mergeOptions(this.defaultOptions, options, RequestMethod.Delete, url))
    );
  }

  patch(url: string, body: any, options?: RequestOptionsArgs) {
    return this.request(
      new Request(
        mergeOptions(
          this.defaultOptions.merge(new RequestOptions({ body: body })),
          options,
          RequestMethod.Patch,
          url
        )
      )
    );
  }

  head(url: string, options?: RequestOptionsArgs) {
    return this.request(
      new Request(mergeOptions(this.defaultOptions, options, RequestMethod.Head, url))
    );
  }

  options(url: string, options?: RequestOptionsArgs) {
    return this.request(
      new Request(mergeOptions(this.defaultOptions, options, RequestMethod.Options, url))
    );
  }
}
