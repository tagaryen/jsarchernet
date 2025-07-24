const {lib} = require('./lib')
const ffi = require('koffi')
const SslContext = require('./sslcontext')
const {isInteger} = require('./util')

const NodeOnconnectCb = ffi.proto("void NodeOnconnectCb()");
const NodeOnreadCb = ffi.proto("void NodeOnreadCb(int8_t *data, size_t data_len)");
const NodeOnerrorCb = ffi.proto("void NodeOnerrorCb(const char *error)");
const NodeOncloseCb = ffi.proto("void NodeOncloseCb()");


const NodeServerOnconnectCb = ffi.proto("void NodeServerOnconnectCb(int64_t fd, const char *host, int port)");
const NodeServerOnreadCb = ffi.proto("void NodeServerOnreadCb(int64_t fd, const char *host, int port, int8_t *data, size_t data_len)");
const NodeServerOnerrorCb = ffi.proto("void NodeServerOnerrorCb(int64_t fd, const char *host, int port, const char *error)");
const NodeServerOncloseCb = ffi.proto("void NodeServerOncloseCb(int64_t fd, const char *host, int port)");


const channel_new_fd = lib.func('ARCHER_channel_new_fd', 'long long', []);
const channel_connect = lib.func('ARCHER_channel_connect', 'const char *', ['long long', 'const char *', 'int', 'int', 
                                                                            'const char *', 'const char *', 'const char *', 'const char *','const char *', 'const char *','const char *','int','int', 
                                                                            ffi.pointer(NodeOnconnectCb), ffi.pointer(NodeOnreadCb), ffi.pointer(NodeOnerrorCb), ffi.pointer(NodeOncloseCb)])
const channel_write = lib.func('ARCHER_channel_write', 'void', ['long long', 'char *', 'int'])
const channel_close = lib.func('ARCHER_channel_close', 'void', ['long long'])



 
const server_channel_new_fd = lib.func('ARCHER_server_channel_new_fd', 'long long', []);
const server_channel_listen = lib.func('ARCHER_server_channel_listen', 'const char *', ['long long', 'const char *', 'int', 'int', 'int',
                                                                                        'const char *','const char *','const char *','const char *','const char *','int','int',
                                                                                        ffi.pointer(NodeServerOnconnectCb), ffi.pointer(NodeServerOnreadCb),ffi.pointer(NodeServerOnerrorCb),ffi.pointer(NodeServerOncloseCb)]);
const server_channel_close = lib.func('ARCHER_server_channel_close', 'void', ['long long']);



const SSL_VERSION_MAX = 772;
const SSL_VERSION_MIN = 769;


class Channel {
    /**
     * @param {SslContext} sslCtx SslContext
    */
    constructor(sslCtx) {
        this.sslCtx = sslCtx;
        this.fd = 0;
        this.isConnected = false;
        this.on_connect_cb = null;
        this.on_read_cb = null;
        this.on_error_cb = null;
        this.on_close_cb = null;
        this.isClientSide = true;
        if(this.sslCtx) {
            this.verifyPeer = sslCtx.verifyPeer ? 1 : 0;
        } else {
            this.verifyPeer = -1;
        }
    }

    /**
     * @param {String} host server host address
     * @param {int} port server port
     * @returns {void}
    */
    connect(host, port) {

        if(!isInteger(port) || port < 80 || port > 65535) {
            throw new Error("invalid port " + port);
        }

        this.host = host;
        this.port = port;

        let ca = null, crt = null, key = null, enCrt = null, enKey = null;
        let maxVer = SSL_VERSION_MAX, minVer = SSL_VERSION_MIN, matchedHostname = null, namedCurves = null;
        if(this.sslCtx) {
            ca = this.sslCtx.ca;
            crt = this.sslCtx.crt;
            key = this.sslCtx.key;
            enCrt = this.sslCtx.enCrt;
            enKey = this.sslCtx.enKey;
            matchedHostname = this.sslCtx.matchedHostname;
            namedCurves = this.sslCtx.namedCurves;
            maxVer = this.sslCtx.sslVersionMax;
            minVer = this.sslCtx.sslVersionMin;
        }

        this.fd = channel_new_fd();

        let self = this;
        let err_msg = channel_connect(this.fd, this.host, this.port, 
            this.verifyPeer, ca, crt, key, enCrt, enKey,matchedHostname, namedCurves, maxVer, minVer,
            () => { //on_connect
                this.isConnected = true;
                if(self.on_connect_cb) {
                    try {
                        self.on_connect_cb();
                    } catch(err) {
                        self.on_error(err);
                    }
                }
            },            
            (data, len) => {
                if(self.on_read_cb) {
                    try {
                        let buf = ffi.decode(data, ffi.array('int8_t', len, 'Typed'));
                        self.on_read_cb(Buffer.from(buf));
                    } catch(err) {
                        self.on_error(err);
                    }
                }
            },
            (err) => {
                self.on_error(err);
            },
            () => {
                this.isConnected = false;
                if(self.on_close_cb) {
                    try {
                        self.on_close_cb();
                    } catch(err) {
                        self.on_error(err);
                    }
                }
            },
        );
        if(err_msg) {
            throw new Error(err_msg);
        }
    }

    /**
     * @param {Buffer} data 
     * @returns {void}
    */
    write(data) {
        if(!this.connected()) {
            return ;
        }
        let buf;
        if (data instanceof Buffer) {
            buf = data;
        } else {
            buf = Buffer.from(data);
        }
        channel_write(this.fd, buf, buf.length);
    }


    getId() {
        return this.fd + 65537;
    }

    /**
     * @returns {void}
    */
    close() {
        if(this.connected()) {
            channel_close(this.fd);
        }
    }

    /**
     * @returns {bool}, return true if this channel is connected else false
    */
    connected() {
        return this.fd === 0 ? false : this.isConnected;
    }

    
    /**
     * @param {"connect"|"read"|"error"|"close"} event 
     * @param {function(null|Buffer|String):void} callback 
     * @returns {void}
    */
    on(event, callback) {
        switch(event){
            case "connect": {
                this.on_connect_cb = callback;
                break ;
            }
            case "read": {
                this.on_read_cb = callback;
                break ;
            }
            case "error": {
                this.on_error_cb = callback;
                break ;
            }
            case "close": {
                this.on_close_cb = callback;
                break ;
            }
        }
    }

    /**
     * @private
     * @param {String} err 
     * @returns {void}
    */
    on_error(err) {
        if(this.on_error_cb) {
            try {
                this.on_error_cb(err);
            } catch(ex) {
                console.error(err);
                console.error(ex);
            }
        } else {
            console.error(err);
        }
    }
}



class ServerChannel {
    /**
     * @param {SslContext} sslCtx SslContext
    */
    constructor(sslCtx) {
        this.sslCtx = sslCtx;
        this.fd = 0;
        this.on_connect_cb = null;
        this.on_read_cb = null;
        this.on_error_cb = null;
        this.on_close_cb = null;
        this.channelMap = {};
        if(this.sslCtx) {
            this.ssl = 1;
        } else {
            this.ssl = 0;
        }
    }

    /**
     * @param {String} host server host address
     * @param {int} port server port
     * @returns {void}
    */
    listen(host, port, threadNum=0) {

        if(!isInteger(port) || port < 80 || port > 65535) {
            throw new Error("invalid port " + port);
        }
        
        if(!isInteger(threadNum)) {
            throw new Error("invalid threadNum " + threadNum);
        }

        this.host = host;
        this.port = port;
        if(threadNum < 1) {
            threadNum = 0
        } 
        if(threadNum > 256) {
            threadNum = 256;
        }

        let ca = null, crt = null, key = null, enCrt = null, enKey = null, maxVer = SSL_VERSION_MAX, minVer = SSL_VERSION_MIN;
        if(this.sslCtx) {
            ca = this.sslCtx.ca;
            crt = this.sslCtx.crt;
            key = this.sslCtx.key;
            enCrt = this.sslCtx.enCrt;
            enKey = this.sslCtx.enKey;
            maxVer = this.sslCtx.sslVersionMax;
            minVer = this.sslCtx.sslVersionMin;
        }

        this.fd = server_channel_new_fd();

        let self = this;
        let err_msg = server_channel_listen(this.fd, this.host, this.port, 
            this.ssl, threadNum, ca, crt, key, enCrt, enKey,maxVer,minVer,
            (ch_fd, host, port) => { //on_connect
                let ch = self.__getChannel(ch_fd, host, port)
                if(self.on_connect_cb) {
                    try {
                        self.on_connect_cb(ch);
                    } catch(err) {
                        self.on_error(ch, err)
                    }
                }
            },            
            (ch_fd, host, port, data, len) => {
                let ch = self.__getChannel(ch_fd, host, port)
                if(!ch) {
                    console.error("channel not connected")
                    return;
                }
                if(self.on_read_cb) {
                    try {
                        let buf = ffi.decode(data, ffi.array('int8_t', len, 'Typed'));
                        self.on_read_cb(ch, Buffer.from(buf));
                    } catch(err) {
                        self.on_error(ch, err)
                    }
                }
            },
            (ch_fd, host, port, err) => {
                let ch = self.__getChannel(ch_fd, host, port);
                self.on_error(ch, err);
            },
            (ch_fd, host, port) => {
                let ch = self.__getChannel(ch_fd, host, port)
                if(!ch) {
                    console.error("channel not connected")
                    return;
                }
                delete self.channelMap[ch_fd];
                ch.isConnected = false;
                if(self.on_close_cb) {
                    try {
                        self.on_close_cb(ch);
                    } catch(err) {
                        self.on_error(ch, err)
                    }
                }
            },
        );
        if(err_msg) {
            throw new Error(err_msg);
        }
    }



    /**
     * @returns {void}
    */
    close() {
        if(this.fd > 0) {
            server_channel_close(this.fd);
        }
    }

    
    /**
     * @param {"connect"|"read"|"error"|"close"} event 
     * @param {function(Channel, null|Buffer|String):void} callback 
     * @returns {void}
    */
    on(event, callback) {
        switch(event){
            case "connect": {
                this.on_connect_cb = callback;
                break ;
            }
            case "read": {
                this.on_read_cb = callback;
                break ;
            }
            case "error": {
                this.on_error_cb = callback;
                break ;
            }
            case "close": {
                this.on_close_cb = callback;
                break ;
            }
        }
    }
    

    /**
     * @private
     * @param {Channel} callback 
     * @param {String} err 
     * @returns {void}
    */
    on_error(channel, err) {
        if(this.on_error_cb) {
            try {
                this.on_error_cb(channel, err);
            } catch(ex) {
                console.log(err);
                console.log(ex);
            }
        } else {
            console.log(err);
        }
    }

    /**
     * @private
    */
    __getChannel(ch_fd, host, port) {
        let ch = this.channelMap[ch_fd];
        if(!ch) {
            let ch = new Channel();
            ch.host = host;
            ch.port = port;
            ch.fd = ch_fd;
            ch.isConnected = true;
            ch.isClientSide = false;
            this.channelMap[ch_fd] = ch;
        }
        return ch;
    }
}

module.exports = {Channel,ServerChannel};