const {Channel, ServerChannel} = require('./channel');
const SslContext = require('./sslcontext');
const {isInteger, bufferSplit, bufferJoin} = require('./util')

const METHODS = {'GET':true, 'POST':true, 'PUT':true, 'DELETE':true, 'OPTION':true}

class HttpError extends Error {
    /**
     * @param {int} code 
     * @param {String} msg 
    */
    constructor(code, msg) {
        super(msg);
        this.code = code;
    }
}

/**
 * @param {int} code 
 * @returns {String}
*/
function http_status_to_message(code)  {
    let codeMap = {
        100: "Continue", 
        101: "Switching Protocols", 
        102: "Processing", 
        200: "OK", 
        201: "Created", 
        202: "Accepted", 
        203: "Non-Authoritative Information", 
        204: "No Content", 
        205: "Reset Content", 
        206: "Partial Content", 
        207: "Multi-Status", 
        300: "Multiple Choices", 
        301: "Moved Permanently", 
        302: "Found", 
        303: "See Other", 
        304: "Not Modified", 
        305: "Use Proxy", 
        307: "Temporary Redirect", 
        308: "Permanent Redirect", 
        400: "Bad Request", 
        401: "Unauthorized", 
        402: "Payment Required", 
        403: "Forbidden", 
        404: "Not Found", 
        405: "Method Not Allowed", 
        406: "Not Acceptable", 
        407: "Proxy Authentication Required", 
        408: "Request Timeout", 
        409: "Conflict", 
        410: "Gone", 
        411: "Length Required", 
        412: "Precondition Failed", 
        413: "Request Entity Too Large", 
        414: "Request-URI Too Long", 
        415: "Unsupported Media Type", 
        416: "Requested Range Not Satisfiable", 
        417: "Expectation Failed", 
        421: "Misdirected Request", 
        422: "Unprocessable Entity", 
        423: "Locked", 
        424: "Failed Dependency", 
        425: "Unordered Collection", 
        426: "Upgrade Required", 
        428: "Precondition Required", 
        429: "Too Many Requests", 
        431: "Request Header Fields Too Large", 
        500: "Internal Server Error", 
        501: "Not Implemented", 
        502: "Bad Gateway", 
        503: "Service Unavailable", 
        504: "Gateway Timeout", 
        505: "HTTP Version Not Supported", 
        506: "Variant Also Negotiates", 
        507: "Insufficient Storage", 
        510: "Not Extended", 
        511: "Network Authentication Required", 
    }
    if(!codeMap[code]) {
        return "Bad Request"
    }
    return codeMap[code]
}


class HttpRequest {
    constructor() {
        this.method = "GET";
        this.url = "/";
        this.version = "HTTP/1.1";
        this.queries = {};
        this.headers = {'content-type':'application/none','content-length':"0"};
        this.body = Buffer.alloc(0);
        this.contentType = this.headers['content-type'];
        this.contentLength = -1;
        this.chunked = false;
        this.chunkedBuf = Buffer.alloc(0);
        this.headParsed = false;
        this.finished = false;
    }

    init() {
        this.method = "GET";
        this.url = "/";
        this.version = "HTTP/1.1";
        this.queries = {};
        this.headers = {'content-type':'application/none','content-length':"0"};
        this.body = Buffer.alloc(0);
        this.contentType = this.headers['content-type'];
        this.contentLength = -1;
        this.chunked = false;
        this.chunkedBuf = Buffer.alloc(0);
        this.headParsed = false;
        this.finished = false;
    }

    /**
     * @param {Buffer} rawData
    */
    parse(rawData) {
        if(!rawData) {
            return ;
        }
        try {
            let parsed = this.parseHead(rawData);
            this.method = parsed.method;
            if(!METHODS[this.method]) {
                throw new HttpError(405, "Method Not Allowed")
            }
            this.url = parsed.url;
            this.version = parsed.version;
            this.queries = parsed.queries;
            this.headers = parsed.headers;
            this.headParsed = true;
            this.body = Buffer.alloc(0);
            this.contentType = this.headers['content-type'];
            this.contentLength = -1;
            this.chunked = false;
            this.chunkedBuf = Buffer.alloc(0);
            if(!this.contentType) {
                throw new HttpError(400, "Bad Request")
            }
            if('content-length' in this.headers) {
                this.chunked = false;
                this.contentLength = Number(this.headers['content-length'])
            }
            if('transfer-encoding' in this.headers && this.headers['transfer-encoding'] === 'chunked') {
                this.chunked = true;
                this.contentLength = -1;
            }
            this.finished = false;
    
            if(parsed.body) {
                this.parseContent(parsed.body)
            }
            if(this.contentLength > 0 && this.body.length >= this.contentLength) {
                this.finished = true;
            }     
        } catch(err) {
            throw new HttpError(400, "Bad Request")
        }
    }

    /**
     * @private
     * @param {Buffer} rawData 
     * @returns {{method: String, url:String, version: String, queries: {}, headers: {}}}
    */
    parseHead(rawData) {
        let lines = bufferSplit(rawData, '\n')
        if(lines.length < 4) {
            throw new HttpError(400, "Bad Request")
        }
        let ret = {method: "", url:"", version: "", queries: {}, headers: {}, body: null};
        let head = lines[0].toString('utf-8').trim();
        let heads = head.split(' ');
        ret.method = heads[0].trim();
        let uriParsed = this.parseUrl(heads[1].trim());
        ret.url = uriParsed.url;
        ret.queries = uriParsed.queries;
        ret.version = heads[2].trim();

        let remain = null;
        for(let i = 1; i < lines.length; i++) {
            let l = lines[i].toString('utf-8').trim();
            if(l === '') {
                if(i === lines.length - 1) {
                    return ;
                }
                remain = bufferJoin(lines.slice(i + 1, lines.length), '\n');
                break ;
            }
            let kv = l.indexOf(':');
            if(l <= 0) {
                throw new HttpError(502, "Bad Gateway")
            }
            ret.headers[l.substring(0, kv).trim().toLowerCase()] = l.substring(kv + 1, l.length).trim();
        }
        ret.body = remain;
        return ret;
    }
    /**
     * @private
     * @param {String} url 
     * @returns {{url:String, queries: {}}}
    */
    parseUrl(url) {
        let idx = url.indexOf('?');
        if(idx === -1) {
            return {
                url,
                queries: {}
            }
        }
        if(idx === url.length - 1) {
            return {
                url: url.substring(0, idx),
                queries: {}
            }
        }
        let ret = {url: "", queries: {}};
        ret.url = url.substring(0, idx);
        let query_str = url.substring(idx+1);
        let seps = query_str.substring('&');
        for(let sep of seps) {
            let kv = sep.split('=');
            if(kv.length !== 2) {
                throw new HttpError(400, "Bad Request")
            }
            ret.queries[decodeURI(kv[0].trim())] = decodeURI(kv[1]);
        }
        return ret;
    }

    
    /**
     * @private
     * @param {Buffer} rawData 
     * @returns {{url:String, queries: {}}}
    */
    parseContent(rawData) {
        if(!rawData) {
            return ;
        }
        if(this.chunked) {
            this.chunkedBuf = Buffer.concat([this.chunkedBuf, rawData]);
            let len = this.chunkedBuf.length;
            while(true) {
                let lf = this.chunkedBuf.indexOf('\n')
                if (lf <= 0) {
                    return 
                }
                let chunkedLen = parseInt(this.chunkedBuf.slice(0, lf).toString('utf-8').trim(), 16); 
                if (chunkedLen === 0) {
                    this.finished = true;
                    return ;
                }
                if((len - lf - 1) < chunkedLen) {
                    return ;
                } else {
                    this.body = Buffer.concat([this.body, this.chunkedBuf.slice(lf+1, lf+1+chunkedLen)]);
                    this.chunkedBuf = this.chunkedBuf.slice(lf+1+chunkedLen, len);
                    let off = 0;
                    if(this.chunkedBuf[off] === 13) {
                        off++;
                    }
                    if(this.chunkedBuf[off] === 10) {
                        off++;
                    }
                    if(off > 0) {
                        this.chunkedBuf = this.chunkedBuf.slice(off, len);
                    }
                }
            }
        } else {
            if(this.body.length + rawData.length > this.contentLength) {
                this.body = Buffer.concat([this.chunkedBuf, rawData.slice(0, this.contentLength - this.body.length)]);
            } else {
                this.body = Buffer.concat([this.chunkedBuf, rawData]);
            }
            if(this.body.length >= this.contentLength) {
                this.finished = true;
            }
        }
    }

    
    /**
     * @private
     * @returns {Buffer}
    */
    toBuffer() {
        let url = this.url;
        if(Object.keys(this.queries).length > 0) {
            url += "?"
            for(let k in this.queries) {
                url += encodeURI(k)+"=" + encodeURI(this.queries[k]) + "&";
            }
            url = url.substring(0, url.length-1);
        }
        let send = this.method + " " + url + " " + this.version + "\r\n";
        for(let k in this.headers) {
            send += k + ": " + this.headers[k] + "\r\n";
        }
        send += "\r\n";
        let buf = Buffer.from(send, 'utf-8');
        if(this.contentLength > 0) {
            buf = Buffer.concat([buf, this.body]);
        }
        return buf;
    }
}


class HttpResponse {

    constructor() {
        this.version = "HTTP/1.1";
        this.statusCode = 200;
        this.statusMsg = http_status_to_message(this.statusCode);
        this.contentType = "application/none";
        this.headers = {
            'Server': "ArcherNet/Nodejs",
            'Connection': "close",
            'Date': new Date().toDateString(),
            'content-type': this.contentType
        }
        this.contentLength = 0;
        this.chunked = false;
        this.chunkedBuf = null;
        this.body = Buffer.alloc(0);
    }

    /**
     * @private
    */
    init() {
        this.version = "HTTP/1.1";
        this.statusCode = 200;
        this.statusMsg = http_status_to_message(this.statusCode);
        this.contentType = "application/none";
        this.headers = {
            'Server': "ArcherNet/Nodejs",
            'Connection': "close",
            'Date': new Date().toDateString(),
            'content-type': this.contentType
        }
        this.contentLength = 0;
        this.chunked = false;
        this.chunkedBuf = null;
        this.body = Buffer.alloc(0);
    }
    
    /**
     * @param {int} code 
     * @returns {void}
    */
    setStatusCode(code) {
        this.statusCode = code;
        this.statusMsg = http_status_to_message(this.statusCode);
    }

    /**
     * @param {int} length 
     * @returns {void}
    */
    setContentLength(length) {
        this.contentLength = length;
        this.headers['content-length'] = String(length);
    }

    /**
     * @param {String} type 
     * @returns {void}
    */
    setContentType(type) {
        this.contentType = type;
        this.headers['content-type'] = type;
    }

    /**
     * @param {String} key 
     * @param {String} value 
     * @returns {void}
    */
    setHeader(key, value) {
        this.headers[key.toLowerCase()] = value;
    }

    /**
     * @param {Object} headers 
     * @returns {void}
    */
    setHeaders(headers) {
        if(headers instanceof Object) {
            for(let k in headers) {
                this.headers[k.toLowerCase()] = headers[k];
            }
        }
    }

    /**
     * @param {Buffer|String} body 
    */
    setBody(body) {
        let buf;
        if (body instanceof Buffer) {
            buf = body;
        } else {
            buf = Buffer.from(body);
        }
        this.setContentLength(buf.length);
        this.body = buf;
    }

    /**
     * @private
     * @param {Buffer} rawData 
    */
    parse(rawData) {
        if(!rawData) {
            return ;
        }
        try {
            let ret = this.parseHead(rawData);
            this.version = ret.version;
            this.statusCode = ret.statusCode;
            this.statusMsg = ret.statusMsg;
            this.headers = ret.headers;
            this.headParsed = true;
            
            this.body = Buffer.alloc(0);
            this.contentType = this.headers['content-type'];
            this.contentType = this.contentType?this.contentType:"text/plain"
            this.contentLength = -1;
            this.chunked = false;
            this.chunkedBuf = Buffer.alloc(0);
            if(!this.contentType) {
                throw new HttpError(502, "Bad Request")
            }
            if('content-length' in this.headers) {
                this.chunked = false;
                this.contentLength = Number(this.headers['content-length'])
            }
            if('transfer-encoding' in this.headers && this.headers['transfer-encoding'] === 'chunked') {
                this.chunked = true;
                this.contentLength = -1;
            }
            this.finished = false;
    
            if(ret.body) {
                this.parseContent(ret.body)
            }
            if(this.contentLength > 0 && this.body.length >= this.contentLength) {
                this.finished = true;
            }  
        } catch(err) {
            console.log(err);
            throw new HttpError(502, "Bad Gateway " + err);
        }   
    }

    
    /**
     * @private
     * @param {Buffer} rawData 
     * @returns {{statusCode: int, statusMsg:String, version: String, headers: {}}}
    */
    parseHead(rawData) {
        let lines = bufferSplit(rawData, '\n')
        if(lines.length < 4) {
            throw new HttpError(502, "Bad Gateway")
        }
        let ret = {statusCode: 200, statusMsg: "", version: "", headers: {}, body: null};
        let head = lines[0].toString('utf-8').trim();
        let heads = head.split(' ');
        if(heads.length < 2) {
            throw new HttpError(502, "Bad Gateway")
        }
        ret.version = heads[0].trim();
        ret.statusCode = parseInt(heads[1].trim());
        if(heads.length === 2) {
            ret.statusMsg = http_status_to_message(ret.statusCode);
        } else {
            ret.statusMsg = heads.slice(2, heads.length).join(' ').trim();
        }

        let remain = null;
        for(let i = 1; i < lines.length; i++) {
            let l = lines[i].toString('utf-8').trim();
            if(l === '') {
                if(i === lines.length - 1) {
                    return ;
                }
                remain = bufferJoin(lines.slice(i + 1, lines.length), '\n');
                break ;
            }
            let kv = l.indexOf(':');
            if(l <= 0) {
                throw new HttpError(502, "Bad Gateway")
            }
            ret.headers[l.substring(0, kv).trim().toLowerCase()] = l.substring(kv + 1, l.length).trim();
        }
        ret.body = remain;
        return ret;
    }
    
    /**
     * @private
     * @param {Buffer} rawData 
     * @returns {{url:String, queries: {}}}
    */
    parseContent(rawData) {
        if(this.chunked) {
            this.chunkedBuf = Buffer.concat([this.chunkedBuf, rawData]);
            let len = this.chunkedBuf.length;
            while(true) {
                let lf = this.chunkedBuf.indexOf('\n')
                if (lf <= 0) {
                    return 
                }
                let chunkedLen = parseInt(this.chunkedBuf.slice(0, lf).toString('utf-8').trim(), 16); 
                if (chunkedLen === 0) {
                    this.finished = true;
                    return ;
                }
                if((len - lf - 1) < chunkedLen) {
                    return ;
                } else {
                    this.body = Buffer.concat([this.body, this.chunkedBuf.slice(lf+1, lf+1+chunkedLen)]);
                    this.chunkedBuf = this.chunkedBuf.slice(lf+1+chunkedLen, len);
                    let off = 0;
                    if(this.chunkedBuf[off] === 13) {
                        off++;
                    }
                    if(this.chunkedBuf[off] === 10) {
                        off++;
                    }
                    if(off > 0) {
                        this.chunkedBuf = this.chunkedBuf.slice(off, len);
                    }
                }
            }
        } else {
            if(this.body.length + rawData.length > this.contentLength) {
                this.body = Buffer.concat([this.chunkedBuf, rawData.slice(0, this.contentLength - this.body.length)]);
            } else {
                this.body = Buffer.concat([this.chunkedBuf, rawData]);
            }
            if(this.body.length >= this.contentLength) {
                this.finished = true;
            }
        }
    }

    /**
     * @private
     * @returns {Buffer}
    */
    toBuffer() {
        let send = this.version + " " + this.statusCode + " " + this.statusMsg + "\r\n";
        for(let k in this.headers) {
            send += k + ": " + this.headers[k] + "\r\n";
        }
        send += "\r\n";
        let buf = Buffer.from(send, 'utf-8');
        if(this.contentLength > 0) {
            buf = Buffer.concat([buf, this.body]);
        }
        return buf;
    }
}


/**
 * @param {String} host
 * @param {int} port  
 * @param {{threadNum:int,sslCtx:SslContext}} options  
 * @param {function(HttpRequest, HttpResponse):void} callback
 * @param {function(String):void} errorCallback
 * @returns {void}
*/
function createHttpServer(host, port, options = null, callback, errorCallback) {
    let chMap = {};
    /**
     * @param {int} id 
     * @returns {{request: HttpRequest, response: HttpResponse}}
    */
    function getHttpPair(id) {
        if(id in chMap) {
            return chMap[id];
        } else {
            let pair = {
                request: new HttpRequest(), response: new HttpResponse()
            }
            chMap[id] = pair;
            return pair;
        }
    }
    if(!options) {
        options = {threadNum:0, sslCtx: null};
    }
    if(!options.threadNum) {
        options.threadNum = 0;
    }
    let server = new ServerChannel(options.sslCtx);
    server.on('read', (ch, data) => {
        let {request, response} = getHttpPair(ch.getId());
        try {
            if(!request.headParsed) {
                request.parse(data);
            } else {
                request.parseContent(data);
            }
            if(request.finished) {
                if(callback) {
                    callback(request, response);
                }
                ch.write(response.toBuffer());
            }
        } catch(err) {
            response.setContentType("text/plain");
            response.setStatusCode(503);
            response.setBody("503 Service Error");
            ch.write(response.toBuffer());
            server.on_error(ch, err)
        }
        request.init();
        response.init();
    });
    server.on("error", (ch, err) => {
        if(errorCallback) {
            errorCallback(err);
        }
    });
    server.listen(host, port, options.threadNum)
}

/**
 * @param {String} url 
 * @param {{method: String, headers:Object,sslCtx:SslContext,body:Buffer,formData:Object}} options 
 * @returns {HttpResponse}
*/
function request(url, options) {
    let uri = "/", ssl = false, host = "127.0.0.1", port = 80;
    let l = url;
    if(l.startsWith("https://")) {
        ssl = true;
        l = l.substring(8, url.length)     
    } else if(l.startsWith("http://")) {
        l = l.substring(7, url.length)
    }
    let i = l.indexOf(':'), j = l.indexOf('/');
    if(j === -1 && i === -1) {
        host = l;
        port = ssl ? 443 : 80;
        l = "";
    } else if(j < i || i === -1) {
        host = l.substring(0, j);
        port = ssl ? 443 : 80;
        l = l.substring(j, l.length);
    } else {
        host = l.substring(0, i);
        port = parseInt(l.substring(i+1, j));
        l = l.substring(j, l.length);
    }
    if(l.length > 0) {
        uri = l;
    }
    if(!options) {
        options = {}
    }
    if(!options.method) {
        options.method = "GET";
    } else {
        if(!METHODS[options.method]) {
            throw new HttpError(405, "Method Not Allowed")
        }
    }
    let request = new HttpRequest();
    request.method = options.method;
    request.url = uri;
    request.headers["host"] = host + ":" + port;
    request.headers["user-agent"] = "Archer-Net/nodejs";
    request.headers["connection"] = "close";
    request.headers["accept"] = "text/html, image/gif, image/jpeg, *; q=.2, */*; q=.2";
    if(options.headers && Object.keys(options.headers).length > 0) {
        for(let k in options.headers) {
            request.headers[k.toLowerCase()] = options.headers[k];
        }
    }
    if(options.body) {
        request.headers["content-length"] = options.body.length;
        request.body = body;
    }
    if(ssl && !options.sslCtx) {
        options.sslCtx = new SslContext();
    }
    let response = new HttpResponse();
    let ch = new Channel(options.sslCtx);
    ch.on('connect', () => {
        ch.write(request.toBuffer());
    });
    ch.on("read", (data) => {
        if(!response.headParsed) {
            response.parse(data)
        } else {
            response.parseContent(data)
        }
        if(response.finished) {
            ch.close();
        }
    });
    ch.connect(host, port);
    return response;
}


module.exports = {
    HttpError,
    HttpRequest,
    HttpResponse,
    http: {
        createHttpServer,
        request
    }
}