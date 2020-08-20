import { Adapter, ConnectionAdapter } from '../interfaces';
import { Request } from '../request';
import { Response } from '../response';
import { ReadyState, RequestMethod, ResponseContentType, ResponseType } from '../enums';
import { Headers } from '../headers';
import { ResponseOptions } from '../response_options';
import { isSuccess } from '../http_utils';

declare namespace tt {
  type IAnyObject = Record<string, any>;

  type RequestMethod =
    | 'OPTIONS'
    | 'GET'
    | 'HEAD'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'TRACE'
    | 'CONNECT'
    | 'string';

  interface RequestSuccessCallbackResult {
    /** 开发者服务器返回的数据 */
    data: string | IAnyObject | ArrayBuffer;
    /** 开发者服务器返回的 HTTP 状态码 */
    statusCode: number;
    /** 开发者服务器返回的 HTTP Response Header
     *
     * 最低基础库： `1.2.0` */
    header: IAnyObject;
  }

  interface GeneralCallbackResult {
    errMsg: string;
  }

  interface RequestTask {
    /** [RequestTask.abort()](RequestTask.abort.md)
     *
     * 中断请求任务
     *
     * 最低基础库： `1.4.0` */
    abort(): void;
  }

  type RequestFailCallback = (res: GeneralCallbackResult) => void;

  type RequestSuccessCallback = (result: RequestSuccessCallbackResult) => void;

  type RequestCompleteCallback = (res: GeneralCallbackResult) => void;

  interface RequestOption {
    /** 开发者服务器接口地址 */
    url: string;
    /** 请求的参数 */
    data?: string | IAnyObject | ArrayBuffer;
    /** 设置请求的 header，header 中不能设置 Referer。
     *
     * `content-type` 默认为 `application/json` */
    header?: IAnyObject;
    /** HTTP 请求方法
     *
     * 可选值：
     * - 'OPTIONS': HTTP 请求 OPTIONS;
     * - 'GET': HTTP 请求 GET;
     * - 'HEAD': HTTP 请求 HEAD;
     * - 'POST': HTTP 请求 POST;
     * - 'PUT': HTTP 请求 PUT;
     * - 'DELETE': HTTP 请求 DELETE;
     * - 'TRACE': HTTP 请求 TRACE;
     * - 'CONNECT': HTTP 请求 CONNECT; */
    method?: RequestMethod;
    /** 返回的数据格式
     *
     * 可选值：
     * - 'json': 返回的数据为 JSON，返回后会对返回的数据进行一次 JSON.parse;
     * - '其他': 不对返回的内容进行 JSON.parse; */
    dataType?: 'json' | string;
    /** 响应的数据类型
     *
     * 可选值：
     * - 'text': 响应的数据为文本;
     * - 'arraybuffer': 响应的数据为 ArrayBuffer;
     *
     * 最低基础库： `1.7.0` */
    responseType?: 'text' | 'arraybuffer';
    /** 接口调用成功的回调函数 */
    success?: RequestSuccessCallback;
    /** 接口调用失败的回调函数 */
    fail?: RequestFailCallback;
    /** 接口调用结束的回调函数（调用成功、失败都会执行） */
    complete?: RequestCompleteCallback;
  }

  function request(option: RequestOption): RequestTask;
}

export class TTAdapter implements Adapter {
  request: Request;
  response: Promise<Response>;
  readyState!: ReadyState;

  constructor(req: Request) {
    this.request = req;

    this.response = new Promise<Response>((resolve, reject) => {
      const supportMethod: tt.RequestMethod[] = [
        'OPTIONS',
        'GET',
        'HEAD',
        'POST',
        'PUT',
        'DELETE',
        'TRACE',
        'CONNECT',
        'string',
      ];
      const method = RequestMethod[req.method].toUpperCase() as tt.RequestMethod;
      if (!supportMethod.includes(method)) {
        throw new Error('WXadapter Does not support secondary requests');
      }
      if (req.headers == null) {
        req.headers = new Headers();
      }
      const header: {
        [key: string]: string;
      } = {};
      req.headers.forEach((values, name) => (header[name!] = values.join(',')));
      let responseType = 'json';
      if (req.responseType != null) {
        switch (req.responseType) {
          case ResponseContentType.ArrayBuffer:
            responseType = 'arraybuffer';
            break;
          case ResponseContentType.Json:
            responseType = 'json';
            break;
          case ResponseContentType.Text:
            responseType = 'text';
            break;
          default:
            throw new Error('The selected responseType is not supported');
        }
      }

      const requestStart = new Date().valueOf();
      let timer: number | null;

      const requestTask = tt.request({
        url: req.url,
        method,
        header,
        dataType: responseType,
        data: req.getBody(),
        success(res) {
          if (timer) clearTimeout(timer!);
          const status = res.statusCode;
          const url = req.url;
          const statusText = 'OK';
          const responseOptions = new ResponseOptions({
            body: res.data,
            status,
            headers: new Headers(res.header),
            statusText,
            url,
            request: req,
            duration: new Date().valueOf() - requestStart,
          });
          const response = new Response(responseOptions);
          response.ok = isSuccess(status);
          if (response.ok) {
            return resolve(response);
          }
          reject(response);
        },
        fail(err) {
          if (timer) clearTimeout(timer!);
          const responseOptions = new ResponseOptions({
            body: err,
            type: ResponseType.Error,
            status: 0,
            statusText: err.errMsg,
            request: req,
            duration: new Date().valueOf() - requestStart,
          });
          reject(new Response(responseOptions));
        },
      });

      if (req.timeOut != null) {
        timer = setTimeout(() => {
          timer = 0;
          try {
            requestTask.abort();
          } catch (e) {}
          const waste = new Date().valueOf() - requestStart;
          const responseOptions = new ResponseOptions({
            type: ResponseType.Error,
            url: req.url,
            status: 0,
            statusText: `Request timed out ${req.timeOut}/${waste}`,
            request: req,
            duration: new Date().valueOf() - requestStart,
          });
          reject(new Response(responseOptions));
        }, req.timeOut);
      }
    });
  }
}

export class ConnectionTT implements ConnectionAdapter {
  createConnection(req: Request) {
    return new TTAdapter(req);
  }
}
