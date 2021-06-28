import Identifiers from './Identifiers';
import OfflinePacket from './OfflinePacket';
import { RemoteInfo } from 'dgram';

export default class OpenConnectionReply2 extends OfflinePacket {
    public constructor(buffer?: Buffer) {
        super(Identifiers.OPEN_CONNECTION_REPLY_2, buffer);
    }

    public serverGUID!: bigint;
    public clientAddress!: RemoteInfo;
    public mtuSize!: number;

    public decodePayload(): void {
        this.readMagic();
        this.serverGUID = this.readLong();
        this.clientAddress = this.readAddress();
        this.mtuSize = this.readShort();
        this.readByte(); // Secure
    }

    public encodePayload(): void {
        this.writeMagic();
        this.writeLong(this.serverGUID);
        this.writeAddress(this.clientAddress);
        this.writeShort(this.mtuSize);
        this.writeByte(0); // Secure
    }
}
