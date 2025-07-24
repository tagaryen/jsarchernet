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
}

