import { RemoteInfo } from 'dgram';
import type { Socket } from 'dgram';

export default interface RakNetListener {
    sendBuffer(buffer: Buffer, rinfo: RemoteInfo): void;
    getSocket(): Socket;
    emit(event: string | symbol, ...args: any[]): void; // Class should also extend EventEmitter.
    removeConnection(connection: any, reason?: string): Promise<void>; // And also hold connections if needed.
}
