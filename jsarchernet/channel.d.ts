export class Channel {
    constructor(sslCtx: SslContext);
    host: string;
    port: int;
    sslCtx: SslContext;
    connect(host: string, port: int): void;
    write(data: Buffer): void;
    getId(): number;
    close(): void;
    connected(): bool;
    on(event: "connect", callback: () => void): void;
    on(event: "read", callback: (data: Buffer) => void): void;
    on(event: "error", callback: (err: string) => void): void;
    on(event: "close", callback: () => void): void;
}
export class ServerChannel {
    constructor(sslCtx: SslContext);
    host: string;
    port: int;
    sslCtx: SslContext;
    listen(host: string, port: int, threadNum?: int): void;
    close(): void;
    on(event: "connect", callback: (channel: Channel) => void): void;
    on(event: "read", callback: (channel: Channel, data: Buffer) => void): void;
    on(event: "error", callback: (channel: Channel, err: string) => void): void;
    on(event: "close", callback: (channel: Channel) => void): void;
}
import SslContext = require("./sslcontext");
