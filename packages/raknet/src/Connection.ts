import ReliabilityLayer, { PacketReliability, isReliable, isSequencedOrOrdered } from "./protocol/ReliabilityLayer";

import ACK from "./protocol/ACK";
import BinaryStream from "@jsprismarine/jsbinaryutils";
import BitFlags from "./protocol/BitFlags";
import ConnectionRequest from "./protocol/ConnectionRequest";
import ConnectionRequestAccepted from "./protocol/ConnectionRequestAccepted";
import Datagram from "./protocol/Datagram";
import EncapsulatedPacket from "./protocol/EncapsulatedPacket";
import { Listener } from "./RakNet";
import MessageIdentifiers from "./protocol/Identifiers";
import Packet from "./protocol/Packet";
import { RemoteInfo } from "dgram";

export default class Connection {
    private readonly listener: Listener;
    private readonly mtuSize: number;
    private readonly rinfo: RemoteInfo;

    private lastPacketTime: number;

    private readonly inputSequenceNumbers: Set<number> = new Set();
    private readonly inputNackQueue: Set<number> = new Set();
    private readonly splitQueue: Map<number, Map<number, EncapsulatedPacket>> = new Map();
    private readonly highestOrderIndex: Map<number, number> = new Map();
    private readonly inputOrderIndex: Map<number, number> = new Map();
    private readonly inputOrderingQueue: Map<number, Map<number, EncapsulatedPacket>> = new Map();

    private readonly outputEncapsulatedQueue: Set<EncapsulatedPacket> = new Set();
    private readonly outputBackupQueue: Map<number, EncapsulatedPacket> = new Map();
    private readonly outputOrderingIndexes: Map<number, number> = new Map();
    private outputSeqNumber = 0;
    private outputMessageIndex = 0;
    private outputSplitId = 0;

    public constructor(listener: Listener, mtuSize: number, rinfo: RemoteInfo) {
        this.listener = listener;
        this.mtuSize = mtuSize;
        this.rinfo = rinfo;

        this.lastPacketTime = Date.now();
    }

    public update(time: number): void {
        if (Date.now() - this.lastPacketTime > 10 * 1000) {
            // TODO: timeout
        }

        // Send ACKs
        const ack = new ACK();
        ack.packets = Array.from(this.inputSequenceNumbers);
        this.inputSequenceNumbers.clear();

        // TODO: send nack
    }

    public receive(buffer: Buffer): void {
        const header = buffer.readUInt8();
        if (header & BitFlags.VALID) {
            this.handleDatagram(buffer);    
        } else if (header & BitFlags.ACK) {
            this.handleACK(buffer);
        } else if (header & BitFlags.NACK) {
            this.handleNACK(buffer);
        } else {
            // Offline messages
            return;
        }
    }

    private handleDatagram(buffer: Buffer): void {
        this.lastPacketTime = Date.now();
        
        const datagram = new Datagram(buffer);
        datagram.decode();

        // Duplicated message
        if (this.inputSequenceNumbers.has(datagram.sequenceNumber)) {
            return;
        }

        // Used for ACKs
        this.inputSequenceNumbers.add(datagram.sequenceNumber);

        // We received the Nack
        if (this.inputNackQueue.has(datagram.sequenceNumber)) {
            this.inputNackQueue.delete(datagram.sequenceNumber);
        }

        // TODO: check for Nack

        for (const encapsulated of datagram.packets) {
            this.handleEncapsulated(encapsulated);
        }
    }

    private handleSplit(split: EncapsulatedPacket): void {
        const splitId = split.splitId!;
        const splitIndex = split.splitIndex!;

        if (!this.splitQueue.has(splitId)) {
            this.splitQueue.set(split.splitId!, new Map([[split.splitIndex!, split]]));
        } else {
            const queue = this.splitQueue.get(splitId)!;
            queue.set(splitIndex, split);
            this.splitQueue.set(splitId, queue);

            if (split.splitCount == queue.size) {
                const stream = new BinaryStream()
                const splits = this.splitQueue.get(splitId)!
                for (let i = 0; i < splits.size; i++) {
                    const splitSlice = splits.get(i)!;
                    stream.append(splitSlice.buffer);
                }

                const encapsulated = new EncapsulatedPacket();
                encapsulated.buffer = stream.getBuffer();
                encapsulated.reliability = split.reliability;
                if (encapsulated.isSequencedOrOrdered()) {
                    encapsulated.orderIndex = split.orderIndex;
                    encapsulated.orderChannel = split.orderChannel;
                }

                this.splitQueue.delete(splitId);
                this.handleEncapsulated(encapsulated);
            } 
        }
    }

    private handleEncapsulated(encapsulated: EncapsulatedPacket): void {
        if (encapsulated.isSplit()) {
            this.handleSplit(encapsulated);
            return;
        }

        if (encapsulated.isSequenced()) {
            if (this.highestOrderIndex.has(encapsulated.orderChannel!)) {
                const highestOrderIndex = this.highestOrderIndex.get(encapsulated.orderChannel!)!;
                if (encapsulated.sequenceIndex! < highestOrderIndex) {
                    return;
                }
            } else {
                this.highestOrderIndex.set(encapsulated.orderChannel!, encapsulated.orderIndex!);
            }

            this.handleEncapsulatedRoute(encapsulated);
        } else if (encapsulated.isSequencedOrOrdered()) {
            if (!this.inputOrderIndex.has(encapsulated.orderChannel!)) {
                this.inputOrderIndex.set(encapsulated.orderChannel!, 0);
                this.inputOrderingQueue.set(encapsulated.orderChannel!, new Map());
            }

            const expectedOrderIndex = this.inputOrderIndex.get(encapsulated.orderChannel!)!;
            if (encapsulated.orderIndex == expectedOrderIndex) {
                this.highestOrderIndex.set(encapsulated.orderIndex, 0);

                const nextExpectedOrderIndex = expectedOrderIndex + 1;
                this.inputOrderIndex.set(encapsulated.orderChannel!, nextExpectedOrderIndex);
                
                this.handleEncapsulatedRoute(encapsulated);
                const outOfOrderQueue = this.inputOrderingQueue.get(encapsulated.orderChannel!)!;
                let i = nextExpectedOrderIndex;
                for (; outOfOrderQueue.has(i); i++) {
                    const packet = outOfOrderQueue.get(i)!;
                    this.handleEncapsulatedRoute(packet);
                    outOfOrderQueue.delete(i);
                }

                this.inputOrderIndex.set(encapsulated.orderChannel!, i);
            } else if (encapsulated.orderIndex! > expectedOrderIndex) {
                this.inputOrderingQueue.get(encapsulated.orderChannel!)!.set(encapsulated.orderIndex!, encapsulated);
            } else {
                // Duplicated packet
                return;
            }
        } else {
            this.handleEncapsulatedRoute(encapsulated);
        }
    }

    private handleEncapsulatedRoute(encapsulated: EncapsulatedPacket): void {
        if (encapsulated.buffer.byteLength == 0) return
        const id = encapsulated.buffer.readUInt8();

        switch (id) {
            case MessageIdentifiers.CONNECTION_REQUEST:
                const connectionRequest = new ConnectionRequest(encapsulated.buffer);
                connectionRequest.decode();

                const connAccepted = new ConnectionRequestAccepted();
                connAccepted.requestTimestamp = process.hrtime.bigint();
                connAccepted.acceptedTimestamp = process.hrtime.bigint();
                connAccepted.clientAddress = this.rinfo;
                this.sendImmediatePacket(connAccepted);
                break;
            case MessageIdentifiers.NEW_INCOMING_CONNECTION:
                this.listener.emit('openConnection');
                break;
            case MessageIdentifiers.DISCONNECT_NOTIFICATION:
                // TODO
                break;
            case 0xFE:
                console.log('Minecraft')
                break;
            default: 
                return;
        }
    }

    private sendImmediatePacket(packet: Packet, reliability = ReliabilityLayer.UNRELIABLE): void {
        packet.encode();
        
        const encapsulated = new EncapsulatedPacket();
        encapsulated.buffer = packet.getBuffer();
        encapsulated.reliability = reliability
        this.sendImmediateEncapsulated(encapsulated);
    }

    private sendImmediateEncapsulated(encapsulated: EncapsulatedPacket, reliability = ReliabilityLayer.UNRELIABLE): void {
        if (isReliable(reliability)) {
            encapsulated.messageIndex = this.outputMessageIndex++;
            if (isSequencedOrOrdered(reliability)) {
                if (!this.outputOrderingIndexes.has(encapsulated.orderChannel ?? 0)) {
                    this.outputOrderingIndexes.set(encapsulated.orderChannel ?? 0, 0)
                    encapsulated.orderIndex = 0
                } else {
                    const orderIndex = this.outputOrderingIndexes.get(encapsulated.orderChannel ?? 0)!
                    this.outputOrderingIndexes.set(encapsulated.orderChannel ?? 0, orderIndex + 1)
                    encapsulated.orderIndex = orderIndex + 1
                }
            }
        }
        
        if (encapsulated.getByteLength() > this.mtuSize) {
            const splits = this.splitEncapsulated(encapsulated);
            const datagram = new Datagram();
            datagram.sequenceNumber = this.outputSeqNumber++;
            datagram.packets = splits;
            datagram.encode();
            this.sendBuffer(datagram.getBuffer())
            return;
        }
        
        const datagram = new Datagram();
        datagram.sequenceNumber = this.outputSeqNumber++;
        datagram.packets = [encapsulated];
        datagram.encode();
        this.sendBuffer(datagram.getBuffer())
    }

    private splitEncapsulated(encapsulated: EncapsulatedPacket): EncapsulatedPacket[] {
        const splits: EncapsulatedPacket[] = [];
        const buffers: Map<number, Buffer> = new Map();
        let index = 0, splitIndex = 0;

        while (index < encapsulated.buffer.byteLength) {
            buffers.set(splitIndex++, encapsulated.buffer.slice(index, (index += this.mtuSize)))
        }

        for (const [index, buffer] of buffers) {
            const newEncapsulated = new EncapsulatedPacket();
            newEncapsulated.splitId = this.outputSplitId;
            newEncapsulated.splitCount = buffers.size;
            newEncapsulated.splitIndex = index;
            newEncapsulated.reliability = encapsulated.reliability;
            newEncapsulated.buffer = buffer;

            if (isReliable(newEncapsulated.reliability)) {
                newEncapsulated.messageIndex = this.outputMessageIndex++;
                if (isSequencedOrOrdered(newEncapsulated.reliability)) {
                    newEncapsulated.orderChannel = encapsulated.orderChannel;
                    newEncapsulated.orderIndex = encapsulated.orderIndex;
                }
            }

            splits.push(newEncapsulated);
        }
        this.outputSplitId++;
        return splits;
    }

    private handleACK(buffer: Buffer): void {
        const ack = new ACK(buffer);
        ack.decode();

        for (const seqNum of ack.packets) {
            
        }
    }

    private handleNACK(buffer: Buffer): void {
        
    }

    private sendBuffer(buffer: Buffer): void {
        this.listener.sendBuffer(buffer, this.rinfo);
    }

    public getRemoteInfo(): RemoteInfo {
        return this.rinfo;
    }
}
