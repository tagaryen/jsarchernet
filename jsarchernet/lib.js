const ffi = require('./koffi');
const os = require('os');

/**
 * @typedef {Object} Conf
 * @property {IKoffiLib} lib 
 */

/**
 * @type {Conf}
*/
const LIB_CONF = {libloaded:false, curPath: __dirname, lib: null, initFunc: null};

if(!LIB_CONF.libloaded) {
    if (os.type() == 'Windows_NT') {
        LIB_CONF.lib = ffi.load(LIB_CONF.curPath + "/lib/libarchernet.dll")
    } else if (os.type() == 'Linux') {
        LIB_CONF.lib = ffi.load(LIB_CONF.curPath + "/lib/libarchernet.so")
    } else {
        throw new Error("platform is not supported! " + os.type());
    }
    LIB_CONF.libloaded = true;
    LIB_CONF.initFunc = LIB_CONF.lib.func('ARCHER_net_init', 'void', []);
    LIB_CONF.initFunc();
}

/**
 * @type {Conf}
*/
module.exports = {lib:LIB_CONF.lib}