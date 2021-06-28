import BinaryStream from '@jsprismarine/jsbinaryutils';
import Packet from './Packet';

export default class AcknowledgePacket extends Packet {
    public packets: number[] = [];

    public decodePayload(): void {
        this.packets = [];

        const recordCount = this.readShort();
        for (let i = 0; i < recordCount && !this.feof(); i++) {
            const singleRecord = this.readBool();

            if (singleRecord) {
                this.packets.push(this.readLTriad());
            } else {
                const start = this.readLTriad();
                const end = this.readLTriad();

                for (let i = start; i <= end; i++) {
                    this.packets.push(i);
                }
            }
        }
    }

    public encodePayload(): void {
        const stream = new BinaryStream();
        this.packets.sort((a, b) => a - b);
        const count = this.packets.length;
        let records = 0;

        if (count > 0) {
            let pointer = 1;
            let start = this.packets[0];
            let last = this.packets[0];

            while (pointer < count) {
                let current = this.packets[pointer++];
                const diff = current - last;
                if (diff == 1) {
                    last = current;
                } else if (diff > 1) {
                    if (start == last) {
                        stream.writeBool(true);
                        stream.writeLTriad(start);
                        start = last = current;
                    } else {
                        stream.writeBool(false);
                        stream.writeLTriad(start);
                        stream.writeLTriad(last);
                        start = last = current;
                    }
                    records++;
                }
            }

            if (start == last) {
                stream.writeBool(true);
                stream.writeLTriad(start);
            } else {
                stream.writeBool(false);
                stream.writeLTriad(start);
                stream.writeLTriad(last);
            }
            records++;
        }
        
        this.writeShort(records);
        this.append(stream.getBuffer());
    }
}
