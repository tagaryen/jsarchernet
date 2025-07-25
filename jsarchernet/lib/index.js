const os = require('os');

/**
 * @property {function():void} channel_new_fd 
 * @property {function(int,string,int,int,string,string,string,string,string,string,string,int,int,function():void,function():void,function():void,function():void,):void} channel_connect 
 * @property {function(int,Buffer):void} channel_write 
 * @property {function(int):void} channel_close 
 * @property {function():void} server_channel_new_fd 
 * @property {function(int,string,int,int,int,string,string,string,string,string,int,int,function():void,function():void,function():void,function():void,):void):void} server_channel_listen 
 * @property {function(int):void} server_channel_close
*/
const LIB_FUNCS = {
    libloaded: false,
    channel_new_fd:()=>{throw new Error("Library is not initialized")},
    channel_connect: ()=>{throw new Error("Library is not initialized")},
    channel_write: ()=>{throw new Error("Library is not initialized")},
    channel_close: ()=>{throw new Error("Library is not initialized")},
    server_channel_new_fd: ()=>{throw new Error("Library is not initialized")},
    server_channel_listen: ()=>{throw new Error("Library is not initialized")},
    server_channel_close: ()=>{throw new Error("Library is not initialized")},
    loader: null,
    isWindows: false
};

function loadWindows() {
    let libloader = require('./win');
    let lib = libloader.load(__dirname + "/win/libarchernet.dll")

    
    let NodeOnconnectCb = libloader.proto("void NodeOnconnectCb()");
    let NodeOnreadCb = libloader.proto("void NodeOnreadCb(int8_t *data, size_t data_len)");
    let NodeOnerrorCb = libloader.proto("void NodeOnerrorCb(const char *error)");
    let NodeOncloseCb = libloader.proto("void NodeOncloseCb()");


    let NodeServerOnconnectCb = libloader.proto("void NodeServerOnconnectCb(int64_t fd, const char *host, int port)");
    let NodeServerOnreadCb = libloader.proto("void NodeServerOnreadCb(int64_t fd, const char *host, int port, int8_t *data, size_t data_len)");
    let NodeServerOnerrorCb = libloader.proto("void NodeServerOnerrorCb(int64_t fd, const char *host, int port, const char *error)");
    let NodeServerOncloseCb = libloader.proto("void NodeServerOncloseCb(int64_t fd, const char *host, int port)");

    LIB_FUNCS.isWindows = true;
    LIB_FUNCS.loader = libloader;

    LIB_FUNCS.channel_new_fd = lib.func('ARCHER_channel_new_fd', 'long long', []);
    LIB_FUNCS.channel_connect = lib.func('ARCHER_channel_connect', 'const char *', ['long long', 'const char *', 'int', 'int', 
                                                                                'const char *', 'const char *', 'const char *', 'const char *','const char *', 'const char *','const char *','int','int', 
                                                                                libloader.pointer(NodeOnconnectCb), libloader.pointer(NodeOnreadCb), libloader.pointer(NodeOnerrorCb), libloader.pointer(NodeOncloseCb)]);
    
    
    LIB_FUNCS.channel_write = lib.func('ARCHER_channel_write', 'void', ['long long', 'char *', 'int']);
    LIB_FUNCS.channel_close = lib.func('ARCHER_channel_close', 'void', ['long long']);

    
    LIB_FUNCS.server_channel_new_fd = lib.func('ARCHER_server_channel_new_fd', 'long long', []);
    LIB_FUNCS.server_channel_listen = lib.func('ARCHER_server_channel_listen', 'const char *', ['long long', 'const char *', 'int', 'int', 'int',
                                                                                            'const char *','const char *','const char *','const char *','const char *','int','int',
                                                                                            libloader.pointer(NodeServerOnconnectCb), libloader.pointer(NodeServerOnreadCb),libloader.pointer(NodeServerOnerrorCb),libloader.pointer(NodeServerOncloseCb)]);
    LIB_FUNCS.server_channel_close = lib.func('ARCHER_server_channel_close', 'void', ['long long']);
    
    let initFunc = lib.func('ARCHER_net_init', 'void', []);
    initFunc();
}


function loadLinux() {
    let lib = require('./linux/archernet');
    LIB_FUNCS.channel_new_fd = lib.ARCHER_channel_new_fd;
    LIB_FUNCS.channel_connect = lib.ARCHER_channel_connect;
    
    
    LIB_FUNCS.channel_write = lib.ARCHER_channel_write;
    LIB_FUNCS.channel_close = lib.ARCHER_channel_close;

    
    LIB_FUNCS.server_channel_new_fd = lib.ARCHER_server_channel_new_fd;
    LIB_FUNCS.server_channel_listen = lib.ARCHER_server_channel_listen;
    LIB_FUNCS.server_channel_close = lib.ARCHER_server_channel_close;

    lib.ARCHER_init();
}

if(!LIB_FUNCS.libloaded) {
    if (os.type() === 'Windows_NT') {
        loadWindows();
        LIB_FUNCS.libloaded = true;
    } else if (os.type() === 'Linux') {
        loadLinux();
        LIB_FUNCS.libloaded = true;
    } else {
        throw new Error("platform is not supported! " + os.type());
    }
}

module.exports = LIB_FUNCS;