import Identifiers from './Identifiers';
import OfflinePacket from './OfflinePacket';
import { RemoteInfo } from 'dgram';

export default class OpenConnectionRequest2 extends OfflinePacket {
    public constructor(buffer?: Buffer) {
        super(Identifiers.OPEN_CONNECTION_REQUEST_2, buffer);
    }

    public serverAddress!: RemoteInfo;
    public mtuSize!: number;
    public clientGUID!: bigint;

    public decodePayload(): void {
        this.readMagic();
        this.serverAddress = this.readAddress();
        this.mtuSize = this.readShort();
        this.clientGUID = this.readLong();
    }

    public encodePayload(): void {
        this.writeMagic();
        this.writeAddress(this.serverAddress);
        this.writeShort(this.mtuSize);
        this.writeLong(this.clientGUID);
    }
}
