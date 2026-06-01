export class HttpError extends Error {
    constructor(code: int, msg: string);
    code: int;
}
export class StreamBody {
    write(chunk: string | Buffer): void;
    end(): void;
}
export class HttpRequest {
    method: string;
    url: string;
    version: string;
    queries: {};
    headers: {};
    body: Buffer;
    contentType: string;
    contentLength: number;
}
export class HttpResponse {
    setStatusCode(code: int): void;
    setContentLength(length: int): void;
    setContentType(type: string): void;
    setHeader(key: string, value: string): void;
    setHeaders(headers: Object): void;
    sendBody(body: Buffer|String): void;
    streamBody(): StreamBody
}

export class Response {
    version: string;
    statusCode: number;
    statusMsg: string;
    headers: {};
    contentType: string;
    contentLength: number;
    body: Buffer;
}
/**
 * @param {{host:string,port:int,sslCtx:SslContext}} options  
 * @param {function(HttpRequest, HttpResponse):void} callback
 * @param {function(Error):void} errorCallback
 * @returns {void}
*/
declare function createHttpServer(options: {host:string,port:int,sslCtx:SslContext}, callback: (req: HttpRequest, res: HttpResponse) => void, errorCallback: (err: Error) => void): void;
/**
 * @param {String} url
 * @param {{method: String, headers:Object,sslCtx:SslContext,body:Buffer|String|Object,formData:Object}} options
 * @returns {Response}
*/
declare function request(url: string, options: {
    method: string;
    headers: {};
    sslCtx: SslContext;
    body: Buffer;
}): Response;
/**
 * @param {String} url
 * @param {Object} headers
 * @returns {Response}
*/
declare function get(url: string, headers: {}): Response;
/**
 * @param {String} url
 * @param {Object} headers
 * @param {Any} body
 * @returns {Response}
*/
declare function post(url: string, headers: {}, body: any): Response;
/**
 * @param {String} url
 * @param {Object} headers
 * @param {Any} body
 * @returns {Response}
*/
declare function put(url: string, headers: {}, body: any): Response;
/**
 * @param {String} url
 * @param {Object} headers
 * @param {Any} body
 * @returns {Response}
*/
declare function del(url: string, headers: {}, body: any): Response;
/**
 * @param {String} url
 * @param {{method: String, headers:Object,sslCtx:SslContext,body:Buffer|String|Object,formData:Object}} options
 * @param {function(Response, err):void} onresponse
 * @param {function(Buffer):void} ondata
 * @returns {void}
*/
declare function streamRequest(url: string, options: {
    method: string;
    headers: {};
    sslCtx: SslContext;
    body: Buffer;
}, onresponse: (res: Response, err: Error) => void, ondata: (chunk: Buffer) => void): void;
import SslContext = require("./sslcontext");
export declare namespace http {
    export { createHttpServer };
    export { request };
    export { get };
    export { post };
    export { put };
    export { del };
    export { streamRequest };
}
export {};
