export enum RequestMethod {
  Get,
  Post,
  Put,
  Delete,
  Options,
  Head,
  Patch,
}

export enum ReadyState {
  Unsent,
  Open,
  HeadersReceived,
  Loading,
  Done,
  Cancelled,
}

export enum ResponseType {
  Basic,
  Cors,
  Default,
  Error,
  Opaque,
}

export enum ContentType {
  NONE,
  JSON,
  FORM,
  FORM_DATA,
  TEXT,
  BLOB,
  ARRAY_BUFFER,
}

export enum ResponseContentType {
  Text,
  Json,
  ArrayBuffer,
  Blob,
}
