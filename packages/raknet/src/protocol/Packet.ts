import BinaryStream from '@jsprismarine/jsbinaryutils';
import { RemoteInfo } from 'dgram';
import assert from 'assert';

export default class Packet extends BinaryStream {
    private readonly id: number;

    public constructor(id: number, buffer?: Buffer) {
        super(buffer);
        this.id = id;
    }

    public getId(): number {
        return this.id;
    }

    // Decodes packet buffer
    public decode(): void {
        this.readByte(); // Skip the packet ID
        this.decodePayload();
    }

    protected decodePayload(): void {}

    // Encodes packet buffer
    public encode() {
        this.writeByte(this.getId());
        this.encodePayload();
    }

    protected encodePayload(): void {}

    // Reads a string from the buffer
    public readString(): string {
        return this.read(this.readShort()).toString();
    }

    // Writes a string length + buffer
    // valid only for offline packets
    public writeString(v: string): void {
        this.writeShort(Buffer.byteLength(v));
        this.append(Buffer.from(v, 'utf-8'));
    }

    // Reads a RakNet address passed into the buffer
    public readAddress(): RemoteInfo {
        const version = this.readByte();
        if (version == 4) {
            const complement = ~this.readInt();
            const hostname = `${(complement >> 24) & 0xff}.${(complement >> 16) & 0xff}.${(complement >> 8) & 0xff}.${
                complement & 0xff
            }`;
            const port = this.readShort();
            return { address: hostname, port: port, family: 'IPv4' } as RemoteInfo;
        } else {
            this.read(2);
            const port = this.readShort();
            this.read(4);
            const hostname = this.read(16).toString();
            this.read(4);
            return { address: hostname, port: port, family: 'IPv6' } as RemoteInfo;
        }
    }

    public writeAddress(rinfo: RemoteInfo): void {
        assert(['IPv4', 'IPv6'].includes(rinfo.family), 'Unknown address family');
        this.writeByte(rinfo.family === 'IPv4' ? 4 : 6);
        if (rinfo.family === 'IPv4') {
            const splittedAddress = rinfo.address.split('.', 4);
            for (const split of splittedAddress) {
                this.writeByte(-split - 1);
            }
            this.writeShort(rinfo.port);
        } else if (rinfo.family === 'IPv6') {
            // TODO: support IPv6
        }
    }
}
