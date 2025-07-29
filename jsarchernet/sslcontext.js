const {isInteger} = require('./util')

module.exports = class SslContext {

    /**
     * @param {{verifyPeer: bool, sslVersionMax: int, sslVersionMin: int, ca: Buffer,crt: Buffer,key: Buffer,enCrt: Buffer,enKey: Buffer,matchedHostname: String,namedCurves: String}} options ssl params
    */
    constructor(options) {
        this.verifyPeer = true;
        this.sslVersionMax = 772;
        this.sslVersionMin = 769;
        this.ca = null;
        this.crt = null;
        this.key = null;
        this.enCrt = null;
        this.enKey = null;
        this.matchedHostname = null;
        this.namedCurves = null;
        if(options) {
            if(options.verifyPeer === false) {
                this.verifyPeer = false;
            }
            this.sslVersionMax = options.sslVersionMax;
            this.sslVersionMin = options.sslVersionMin;
            this.ca = options.ca;
            this.crt = options.crt;
            this.key = options.key;
            this.enCrt = options.enCrt;
            this.enKey = options.enKey;
            this.matchedHostname = options.matchedHostname;
            this.namedCurves = options.namedCurves;
        }
        if(!this.checkCrt(this.ca)) {
            throw new Error("ca must be a Buffer");
        }
        if(!this.checkCrtKey(this.crt, this.key)) {
            throw new Error("crt and key both must be Buffers");
        }
        if(!this.checkCrtKey(this.enCrt, this.enKey)) {
            throw new Error("enCrt and enKey both must be Buffers");
        }
        if(!this.checkVersion(this.sslVersionMax)) {
            this.sslVersionMax = 772;
        }
        if(!this.checkVersion(this.sslVersionMin)) {
            this.sslVersionMin = 769;
        }
        if(this.sslVersionMax < this.sslVersionMin) {
            this.sslVersionMax = this.sslVersionMin
        }
    }

    checkVersion(v) {
        return isInteger(v) && 769 <= v && v <= 772;
    }

    checkCrt(c) {
        return c ? !(c instanceof Buffer) : true;
    }
    
    checkCrtKey(c, k) {
        if(c && k) {
            return true;
        }
        if(c && !k) {
            return false;
        }
        if(!c && k) {
            return false;
        }
        return !(c instanceof Buffer) || !(k instanceof Buffer);
    }
}

