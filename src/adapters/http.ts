import { Adapter, ConnectionAdapter } from '../interfaces';
import { Request } from '../request';
import { Response } from '../response';
import { ReadyState } from '../enums';
import * as http from 'http';
import * as https from 'https';

export class HTTPAdapter implements Adapter {
  request: Request;
  response: Promise<Response>;
  readyState!: ReadyState;

  constructor(req: Request) {
    this.request = req;

    // eslint-disable-next-line promise/param-names
    this.response = new Promise<Response>((_resolve, _reject) => {
      const transport = req.url.includes('https:') ? https : http;
      const request = transport.request(
        {
          path: req.url,
          headers: req.headers.toJSON(),
        },
        res => {
          if (res.aborted) {
            // TODO error
            return;
          }
          res.on('data', chunk => {
            console.log(chunk);
          });
          console.log(res);
        }
      );

      request.on('error', err => {
        console.log(err);
        _reject(err);
      });

      if (req.timeOut) {
        setTimeout(() => {
          if (!request.aborted) {
            request.abort();
          }
          // TODO timeout
        }, req.timeOut);
      }
    });
  }
}

export class ConnectionHTTP implements ConnectionAdapter {
  createConnection(req: Request) {
    return new HTTPAdapter(req);
  }
}
