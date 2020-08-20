import { Adapter, ConnectionAdapter } from '../interfaces';
import { Headers } from '../headers';
import { Request } from '../request';
import { ResponseOptions } from '../response_options';
import { Response } from '../response';
import {
  ContentType,
  ReadyState,
  RequestMethod,
  ResponseContentType,
  ResponseType,
} from '../enums';
import { isSuccess } from '../http_utils';

const XSSI_PREFIX = /^\)\]\}',?\n/;

export class XHRAdapter implements Adapter {
  request: Request;
  response: Promise<Response>;
  readyState!: ReadyState;

  constructor(req: Request) {
    this.request = req;

    this.response = new Promise<Response>((resolve, reject) => {
      const _xhr: XMLHttpRequest = new XMLHttpRequest();
      _xhr.open(RequestMethod[req.method].toUpperCase(), req.url);
      const requestStart = new Date().valueOf();
      if (req.withCredentials != null) {
        _xhr.withCredentials = req.withCredentials;
      }
      if (req.timeOut != null) {
        _xhr.timeout = req.timeOut;
      }
      // load event handler
      const onLoad = () => {
        // normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
        let status: number = _xhr.status === 1223 ? 204 : _xhr.status;

        let body: any = null;

        // HTTP 204 means no content
        if (status !== 204) {
          // responseText is the old-school way of retrieving response (supported by IE8 & 9)
          // response/responseType properties were introduced in ResourceLoader Level2 spec
          // (supported by IE10)
          body = typeof _xhr.response === 'undefined' ? _xhr.responseText : _xhr.response;

          // Implicitly strip a potential XSSI prefix.
          if (typeof body === 'string') {
            body = body.replace(XSSI_PREFIX, '');
          }
        }

        // fix status code when it is 0 (0 status is undocumented).
        // Occurs when accessing file resources or on Android 4.1 stock browser
        // while retrieving files from application cache.
        if (status === 0) {
          status = body ? 200 : 0;
        }

        const headers: Headers = Headers.fromResponseHeaderString(_xhr.getAllResponseHeaders());
        const url = req.url;
        const statusText: string = _xhr.statusText || 'OK';

        const responseOptions = new ResponseOptions({
          body,
          status,
          headers,
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
      };
      // error event handler
      const onError = (err: ProgressEvent<XMLHttpRequestEventTarget>) => {
        const responseOptions = new ResponseOptions({
          request: req,
          body: err,
          type: ResponseType.Error,
          status: _xhr.status,
          statusText: _xhr.statusText,
          duration: new Date().valueOf() - requestStart,
        });
        reject(new Response(responseOptions));
      };

      this.setDetectedContentType(req, _xhr);

      if (req.headers == null) {
        req.headers = new Headers();
      }
      if (!req.headers.has('Accept')) {
        req.headers.append('Accept', 'application/json, text/plain, */*');
      }
      req.headers.forEach((values, name) => _xhr.setRequestHeader(name!, values.join(',')));

      // Select the correct buffer type to stores the response
      if (req.responseType != null && _xhr.responseType != null) {
        switch (req.responseType) {
          case ResponseContentType.ArrayBuffer:
            _xhr.responseType = 'arraybuffer';
            break;
          case ResponseContentType.Json:
            _xhr.responseType = 'json';
            break;
          case ResponseContentType.Text:
            _xhr.responseType = 'text';
            break;
          case ResponseContentType.Blob:
            _xhr.responseType = 'blob';
            break;
          default:
            throw new Error('The selected responseType is not supported');
        }
      }

      _xhr.addEventListener('load', onLoad);
      _xhr.addEventListener('error', onError);
      _xhr.onreadystatechange = (e: Event) => {
        this.readyState = (e.currentTarget as XMLHttpRequest).readyState;
      };
      _xhr.send(this.request.getBody());
    });
  }

  setDetectedContentType(req: Request, _xhr: XMLHttpRequest) {
    if (req.headers != null && req.headers.get('Content-Type') != null) {
      return;
    }

    switch (req.contentType) {
      case ContentType.NONE:
        break;
      case ContentType.JSON:
        _xhr.setRequestHeader('content-type', 'application/json');
        break;
      case ContentType.FORM:
        _xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        break;
      case ContentType.TEXT:
        _xhr.setRequestHeader('content-type', 'text/plain');
        break;
      case ContentType.BLOB:
        if (req.blob().type) {
          _xhr.setRequestHeader('content-type', req.blob().type);
        }
        break;
    }
  }
}

export class ConnectionXHR implements ConnectionAdapter {
  createConnection(req: Request) {
    return new XHRAdapter(req);
  }
}
