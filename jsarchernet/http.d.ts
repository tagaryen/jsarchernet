export class HttpError extends Error {
    constructor(code: int, msg: string);
    code: int;
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
    setBody(body: Buffer|String): void;
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
 * @param {String} host
 * @param {int} port
 * @param {{threadNum:int,sslCtx:SslContext}} options  
 * @param {function(HttpRequest, HttpResponse):void} callback
 * @param {function(String):void} errorCallback
 * @returns {void}
*/
declare function createHttpServer(host: string, port: int, options: {threadNum:int,sslCtx:SslContext}, callback: (req: HttpRequest, res: HttpResponse) => void, errorCallback: (err: string) => void): void;
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
import SslContext = require("./sslcontext");
export declare namespace http {
    export { createHttpServer };
    export { request };
}
export {};
