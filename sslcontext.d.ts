export = SslContext;
declare class SslContext {
    constructor(options: {
        verifyPeer: bool;
        sslVersionMax: int;
        sslVersionMin: int;
        ca: Buffer;
        crt: Buffer;
        key: Buffer;
        enCrt: Buffer;
        enKey: Buffer;
        matchedHostname: string;
        namedCurves: string;
    });
    verifyPeer: boolean;
    sslVersionMax: any;
    sslVersionMin: any;
    ca: any;
    crt: any;
    key: any;
    enCrt: any;
    enKey: any;
    matchedHostname: string;
    namedCurves: string;
}
