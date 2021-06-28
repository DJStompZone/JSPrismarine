import BitFlags from './BitFlags';
import EncapsulatedPacket from './EncapsulatedPacket';
import Packet from './Packet';

export default class Datagram extends Packet {
    public constructor(buffer?: Buffer) {
        super(BitFlags.VALID, buffer);
    }

    public packets: EncapsulatedPacket[] = [];

    // Packet sequence number
    // used to check for missing packets
    public sequenceNumber!: number;

    public decodePayload(): void {
        this.sequenceNumber = this.readLTriad();
        do {
            this.packets.push(EncapsulatedPacket.fromBinary(this));
        } while (!this.feof()); 
    }

    public encodePayload(): void {
        this.writeLTriad(this.sequenceNumber);
        for (const packet of this.packets) {
            this.append(packet.toBinary().getBuffer());
        }
    }

    public getTotalByteLength(): number {
        // header (1 byte) + seqNumber (3 bytes)
        let length = 4;
        for (const packet of this.packets) {
            length += packet.getByteLength();
        }
        return length;
    }
}
