import Identifiers from './Identifiers';
import Packet from './Packet';

export default class ConnectedPong extends Packet {
    public constructor() {
        super(Identifiers.CONNECTED_PONG);
    }

    public clientTimestamp!: bigint;
    public serverTimestamp!: bigint;

    public encodePayload(): void {
        this.writeLong(this.clientTimestamp);
        this.writeLong(this.serverTimestamp);
    }
}
