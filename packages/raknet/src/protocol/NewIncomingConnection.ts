import Identifiers from './Identifiers';
import Packet from './Packet';
import { RemoteInfo } from 'dgram';

export default class NewIncomingConnection extends Packet {
    public constructor(buffer?: Buffer) {
        super(Identifiers.NEW_INCOMING_CONNECTION, buffer);
    }

    public address!: RemoteInfo;
    public systemAddresses: RemoteInfo[] = [];

    public requestTimestamp!: bigint;
    public acceptedTimestamp!: bigint;

    public decodePayload(): void {
        this.address = this.readAddress();

        // Do not save in memory stuff we will not use
        // TODO: skip bytes (inet addr * 20 bytes)
        for (let i = 0; i < 20; i++) {
            this.systemAddresses.push(this.readAddress());
        }

        this.requestTimestamp = this.readLong();
        this.acceptedTimestamp = this.readLong();
    }

    public encodePayload(): void {
        this.writeAddress(this.address);
        for (let i = 0; i < 20; i++) {
            this.writeAddress(this.address);
        }

        this.writeLong(this.requestTimestamp);
        this.writeLong(this.acceptedTimestamp);
    }
}
