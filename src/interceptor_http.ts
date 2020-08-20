import { Http, httpRequest } from './http';
import { Request } from './request';
import { Response } from './response';
import { RequestMethod } from './enums';
import { RequestOptionsArgs, ConnectionAdapter } from './interfaces';
import { ResponseOptions } from './response_options';
import { RequestOptions } from './request_options';
import { Headers } from './headers';

type InterceptorFulfilled<R> = (this: Interceptor<R>, r: R) => Promise<R> | R;
type InterceptorRejected<R> = (
  this: Interceptor<R>,
  r: Error | Response | R
) => Promise<any> | any | Promise<R> | R;

interface InterceptorHandler<R> {
  fulfilled: InterceptorFulfilled<R>;
  rejected: InterceptorRejected<R> | null;
}

class Interceptor<R> {
  private handlers: (InterceptorHandler<R> | null)[] = [];

  /**
   * p  of interceptor snap lock promise
   */
  p: Promise<void> | null = null;
  private resolve: any = null;
  private reject: any = null;

  /**
   * All requests will be locked afterwards
   * @memberof Interceptor
   */
  lock() {
    if (!this.resolve) {
      // eslint-disable-next-line promise/param-names
      this.p = new Promise((_resovle, _reject) => {
        this.resolve = _resovle;
        this.reject = _reject;
      });
    }
  }

  /**
   * All requests after release
   * @memberof Interceptor
   */
  unLock() {
    if (this.resolve) {
      this.resolve();
      this.p = this.reject = this.resolve = null;
    }
  }

  /**
   * All requests after cancellation
   * @param {string} msg
   * @memberof Interceptor
   */
  clear(msg?: string) {
    if (this.reject) {
      this.reject(msg || 'cancel');
      this.p = this.reject = this.resolve = null;
    }
  }

  /**
   * Add a new interceptor
   * @param {InterceptorFulfilled} fulfilled
   * @param {InterceptorRejected} rejected
   * @returns {number} handler ID used to remove interceptor
   * @memberof Interceptor
   */
  use(fulfilled: InterceptorFulfilled<R>, rejected: InterceptorRejected<R> | null = null): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  /**
   * Remove a interceptor
   * @param {number} id
   * @memberof Interceptor
   */
  eject(id: number) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * Iterate over all the registered interceptors
   * @param {(handler: InterceptorHandler) => void} fn
   * @memberof Interceptor
   */
  forEach(fn: (handler: InterceptorHandler<R>) => void) {
    this.handlers.filter(v => v).forEach(h => fn.call(this, h!));
  }
}

export interface InterceptorRequestOptionsArgs extends RequestOptionsArgs {
  /**
   * Default false, Skip register interceptor
   */
  skipInterceptor?: boolean | null;
  /**
   * Default true, Does not wait for the lock but passes through the interceptor
   */
  waitLock?: boolean | null;
  /**
   * Transparent transmission additional configuration
   */
  extra?: any;
}

export interface InterceptorRequestArgs extends InterceptorRequestOptionsArgs {
  url: string | null;
}

export class InterceptorRequestOptions extends RequestOptions {
  skipInterceptor?: boolean | null;
  waitLock?: boolean | null;
  extra?: any;

  constructor(opts: InterceptorRequestOptionsArgs = {}) {
    const { waitLock, skipInterceptor, extra, ...requestOptions } = opts;
    super(requestOptions);

    this.waitLock = waitLock != null ? waitLock : null;
    this.skipInterceptor = skipInterceptor != null ? skipInterceptor : null;
    this.extra = extra;
  }

  merge(options?: InterceptorRequestOptionsArgs): InterceptorRequestOptions {
    return new InterceptorRequestOptions({
      method: options && options.method != null ? options.method : this.method,
      headers: new Headers(this.headers).merge(options?.headers),
      body: options && options.body != null ? options.body : this.body,
      url: options && options.url != null ? options.url : this.url,
      params: options && this._mergeSearchParams(options.params || options.search),
      withCredentials:
        options && options.withCredentials != null ? options.withCredentials : this.withCredentials,
      responseType:
        options && options.responseType != null ? options.responseType : this.responseType,
      timeOut: options && options.timeOut != null ? options.timeOut : this.timeOut,
      waitLock: options && options.waitLock != null ? options.waitLock : this.waitLock,
      skipInterceptor:
        options && options.skipInterceptor != null ? options.skipInterceptor : this.skipInterceptor,
      extra: options && options.extra != null ? options.extra : this.extra,
    });
  }
}

export class InterceptorRequest extends Request {
  skipInterceptor: boolean;
  waitLock: boolean;
  extra: any;

  constructor(interceptorRequestArgs: InterceptorRequestArgs) {
    const { skipInterceptor, waitLock, extra, ...requestOptions } = interceptorRequestArgs;
    super(requestOptions);

    this.skipInterceptor = skipInterceptor!;
    this.waitLock = waitLock!;
    this.extra = extra!;
  }
}

class InterceptorResponse extends Response {
  request: InterceptorRequest;

  constructor(responseOptions: ResponseOptions) {
    super(responseOptions);

    this.request = responseOptions.request as InterceptorRequest;
  }
}

function mergeOptions(
  defaultOpts: InterceptorRequestOptionsArgs,
  opts: InterceptorRequestOptionsArgs | undefined,
  method: RequestMethod,
  url: string
) {
  const newOptions = new InterceptorRequestOptions(defaultOpts);
  if (opts) {
    return newOptions.merge(
      new InterceptorRequestOptions({
        method: method,
        url: opts.url || url,
        search: opts.search,
        params: opts.params,
        headers: opts.headers,
        body: opts.body,
        withCredentials: opts.withCredentials,
        responseType: opts.responseType,
        waitLock: opts.waitLock,
        timeOut: opts.timeOut,
        skipInterceptor: opts.skipInterceptor,
        extra: opts.extra,
      })
    );
  }

  return newOptions.merge(new InterceptorRequestOptions({ method, url }));
}

export class InterceptorHttp extends Http {
  protected defaultOptions: InterceptorRequestOptions;
  interceptor = {
    request: new Interceptor<InterceptorRequest>(),
    response: new Interceptor<InterceptorResponse>(),
  };

  constructor(opts?: InterceptorRequestOptions, adapter?: ConnectionAdapter) {
    super(undefined, adapter);

    this.defaultOptions = opts || new InterceptorRequestOptions();
  }

  request(url: string | InterceptorRequest, options?: InterceptorRequestOptionsArgs) {
    let opt: InterceptorRequest;
    if (typeof url === 'string') {
      opt = new InterceptorRequest(
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
      );
    } else if (url instanceof InterceptorRequest) {
      opt = url;
    } else {
      throw new Error('First argument must be a url string or Request instance.');
    }
    const warpWaitLockFN = <R>(
      interceptor: Interceptor<R>,
      fn: InterceptorFulfilled<R> | InterceptorRejected<R> | null
    ) => {
      if (fn) {
        return (arg1: R) => {
          const waitLock = Object.prototype.hasOwnProperty.call(opt, 'waitLock')
            ? opt.waitLock
            : Object.prototype.hasOwnProperty.call(this.defaultOptions, 'waitLock')
            ? this.defaultOptions.waitLock
            : null;
          return interceptor.p && waitLock !== false
            ? interceptor.p.then(() => fn.call(interceptor, arg1))
            : fn.call(interceptor, arg1);
        };
      }
    };
    const checkSkipInterceptor = (fn: () => void) => !opt.skipInterceptor && fn();

    let promise = Promise.resolve<any>(opt);
    const chain: (
      | InterceptorFulfilled<InterceptorRequest>
      | InterceptorFulfilled<InterceptorResponse>
      | InterceptorRejected<InterceptorRequest>
      | InterceptorRejected<InterceptorResponse>
      | null
    )[] = [];
    checkSkipInterceptor(() => {
      this.interceptor.request.forEach(({ fulfilled, rejected }) =>
        chain.push(
          warpWaitLockFN<InterceptorRequest>(this.interceptor.request, fulfilled)!,
          warpWaitLockFN<InterceptorRequest>(this.interceptor.request, rejected!)!
        )
      );
    });
    chain.push((r: InterceptorRequest) => <any>httpRequest(this.adapter, r), null);
    checkSkipInterceptor(() => {
      this.interceptor.response.forEach(({ fulfilled, rejected }) =>
        chain.push(
          warpWaitLockFN<InterceptorResponse>(this.interceptor.response, fulfilled)!,
          warpWaitLockFN<InterceptorResponse>(this.interceptor.response, rejected!)!
        )
      );
    });
    while (chain.length) {
      const fulfilled = chain.shift();
      const rejected = chain.shift() as InterceptorRejected<InterceptorResponse> | null;
      promise = promise.then(fulfilled as any, rejected);
    }
    return promise as Promise<InterceptorResponse>;
  }

  get(url: string, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(mergeOptions(this.defaultOptions, options, RequestMethod.Get, url))
    );
  }

  post(url: string, body: any, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(
        mergeOptions(
          this.defaultOptions.merge(new RequestOptions({ body: body })),
          options,
          RequestMethod.Post,
          url
        )
      )
    );
  }

  put(url: string, body: any, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(
        mergeOptions(
          this.defaultOptions.merge(new RequestOptions({ body: body })),
          options,
          RequestMethod.Put,
          url
        )
      )
    );
  }

  delete(url: string, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(mergeOptions(this.defaultOptions, options, RequestMethod.Delete, url))
    );
  }

  patch(url: string, body: any, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(
        mergeOptions(
          this.defaultOptions.merge(new RequestOptions({ body: body })),
          options,
          RequestMethod.Patch,
          url
        )
      )
    );
  }

  head(url: string, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(mergeOptions(this.defaultOptions, options, RequestMethod.Head, url))
    );
  }

  options(url: string, options?: InterceptorRequestOptionsArgs) {
    return this.request(
      new InterceptorRequest(mergeOptions(this.defaultOptions, options, RequestMethod.Options, url))
    );
  }
}
