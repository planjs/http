function paramParser(rawParams: string = ''): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (rawParams.length > 0) {
    const params: string[] = rawParams.split('&');
    params.forEach((param: string) => {
      const eqIdx = param.indexOf('=');
      const [key, val]: string[] =
        eqIdx === -1 ? [param, ''] : [param.slice(0, eqIdx), param.slice(eqIdx + 1)];
      const list = map.get(key) || [];
      list.push(val);
      map.set(key, list);
    });
  }
  return map;
}

export class QueryEncoder {
  encodeKey(key: string): string {
    return standardEncoding(key);
  }

  encodeValue(value: string): string {
    return standardEncoding(value);
  }
}

function standardEncoding(v: string): string {
  return encodeURIComponent(v)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/gi, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%2B/gi, '+')
    .replace(/%3D/gi, '=')
    .replace(/%3F/gi, '?')
    .replace(/%2F/gi, '/');
}

export class URLSearchParams {
  paramsMap: Map<string, string[]>;
  constructor(
    public rawParams: string = '',
    private queryEncoder: QueryEncoder = new QueryEncoder()
  ) {
    this.paramsMap = paramParser(rawParams);
  }

  clone(): URLSearchParams {
    const clone = new URLSearchParams('', this.queryEncoder);
    clone.appendAll(this);
    return clone;
  }

  has(param: string): boolean {
    return this.paramsMap.has(param);
  }

  get(param: string): string | null {
    const storedParam = this.paramsMap.get(param);

    return Array.isArray(storedParam) ? storedParam[0] : null;
  }

  getAll(param: string): string[] {
    return this.paramsMap.get(param) || [];
  }

  set(param: string, val: string) {
    if (val === void 0 || val === null) {
      this.delete(param);
      return;
    }
    const list = this.paramsMap.get(param) || [];
    list.length = 0;
    list.push(val);
    this.paramsMap.set(param, list);
  }

  setAll(searchParams: URLSearchParams) {
    searchParams.paramsMap.forEach((value, param) => {
      const list = this.paramsMap.get(param) || [];
      list.length = 0;
      list.push(value[0]);
      this.paramsMap.set(param, list);
    });
  }

  append(param: string, val: string): void {
    if (val === void 0 || val === null) return;
    const list = this.paramsMap.get(param) || [];
    list.push(val);
    this.paramsMap.set(param, list);
  }

  appendAll(searchParams: URLSearchParams) {
    searchParams.paramsMap.forEach((value, param) => {
      const list = this.paramsMap.get(param) || [];
      for (let i = 0; i < value.length; ++i) {
        list.push(value[i]);
      }
      this.paramsMap.set(param, list);
    });
  }

  replaceAll(searchParams: URLSearchParams) {
    searchParams.paramsMap.forEach((value, param) => {
      const list = this.paramsMap.get(param) || [];
      list.length = 0;
      for (let i = 0; i < value.length; ++i) {
        list.push(value[i]);
      }
      this.paramsMap.set(param, list);
    });
  }

  toString(): string {
    const paramsList: string[] = [];
    this.paramsMap.forEach((values, k) => {
      values.forEach(v =>
        paramsList.push(this.queryEncoder.encodeKey(k) + '=' + this.queryEncoder.encodeValue(v))
      );
    });
    return paramsList.join('&');
  }

  delete(param: string): void {
    this.paramsMap.delete(param);
  }
}
