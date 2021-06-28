import Dgram, { RemoteInfo, Socket } from 'dgram';
import { MINECRAFT_PROTOCOL, RAKNET_TICK_LENGTH } from './RakNet';

import Connection from './Connection';
import Crypto from 'crypto';
import { EventEmitter } from 'events';
import IncompatibleProtocolVersion from './protocol/IncompatibleProtocolVersion';
import MessageIdentifiers from './protocol/Identifiers';
import OpenConnectionReply1 from './protocol/OpenConnectionReply1';
import OpenConnectionReply2 from './protocol/OpenConnectionReply2';
import OpenConnectionRequest1 from './protocol/OpenConnectionRequest1';
import OpenConnectionRequest2 from './protocol/OpenConnectionRequest2';
import RakNetListener from './RakNetListener';
import UnconnectedPing from './protocol/UnconnectedPing';
import UnconnectedPong from './protocol/UnconnectedPong';

// Listen to packets and then process them
export default class Listener extends EventEmitter implements RakNetListener {
    private readonly connections: Map<string, Connection> = new Map();
    private readonly socket: Socket;
    private readonly id: bigint;

    public constructor() {
        super();
        this.socket = Dgram.createSocket({ type: 'udp4' });
        // Generate a signed random 64 bit GUID
        const uniqueId = Crypto.randomBytes(8).readBigInt64BE();
        this.id = uniqueId;
    }

    /**
     * Creates a packet listener on given address and port.
     */
    public listen(address: string, port: number): Listener {
        this.socket.on('message', (buffer: Buffer, rinfo: RemoteInfo) => {
            const token = `${rinfo.address}:${rinfo.port}`;
            if (this.connections.has(token)) {
                return this.connections.get(token)!.receive(buffer);
            }
            this.handleUnconnected(buffer, rinfo)
                .then((response) => this.sendBuffer(response, rinfo))
                .catch((err: Error) => {
                    // TODO: JSP logger package
                    console.log(err.message);
                });
        });

        this.socket.bind(port, address, () => {
            const ticker = setInterval(() => {
                // TODO
                if (false) clearInterval(ticker);

                // Tick connections
                for (const connection of this.connections.values()) {
                    connection.update(Date.now());
                }
            }, RAKNET_TICK_LENGTH * 1000);
        });
        return this;
    }

    public kill(): void {
        // TODO: Wait for all remining packets to be sent
        /* 
        const inter = setInterval(() => {
            const packets = Array.from(this.connections.values()).map((a) => a.getSendQueue());

            if (packets.length <= 0) {
                clearInterval(inter);
            }
        }, 50); 
        */
        this.socket.removeAllListeners();
    }

    private async handleUnconnected(buffer: Buffer, rinfo: RemoteInfo): Promise<Buffer> {
        const header = buffer.readUInt8();

        switch (header) {
            case MessageIdentifiers.UNCONNECTED_PING:
                return this.handleUnconnectedPing(buffer);
            case MessageIdentifiers.OPEN_CONNECTION_REQUEST_1:
                return this.handleOpenConnectionRequest1(buffer);
            case MessageIdentifiers.OPEN_CONNECTION_REQUEST_2:
                return this.handleOpenConnectionRequest2(buffer, rinfo);
            default:
                const hexHeader = header.toString(16);
                throw new Error(
                    `Unhandled unconnected packet (dec=${header}, hex=0x${
                        hexHeader.length > 1 ? hexHeader : '0' + hexHeader
                    })`
                );
        }
    }

    private async handleUnconnectedPing(buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve) => {
            const decodedPacket = new UnconnectedPing(buffer);
            decodedPacket.decode();

            if (!decodedPacket.isValid()) {
                throw new Error('Received an invalid unconnected ping');
            }

            const packet = new UnconnectedPong();
            packet.sendTimestamp = decodedPacket.sendTimestamp;
            packet.serverGUID = this.id;

            // TODO: MOTD manager
            packet.serverName = 'MCPE;Test motd;428;1.16.210;0;20;' + this.id + ';Second line;Creative;';
            packet.encode();
            resolve(packet.getBuffer());
        });
    }

    private async handleOpenConnectionRequest1(buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve) => {
            const decodedPacket = new OpenConnectionRequest1(buffer);
            decodedPacket.decode();

            if (!decodedPacket.isValid()) {
                throw new Error('Received an invalid open connection request 1');
            }

            if (decodedPacket.protocol !== MINECRAFT_PROTOCOL) {
                const packet = new IncompatibleProtocolVersion();
                packet.protocol = MINECRAFT_PROTOCOL;
                packet.serverGUID = this.id;
                packet.encode();

                resolve(packet.getBuffer());
                return;
            }

            const packet = new OpenConnectionReply1();
            packet.serverGUID = this.id;
            packet.mtuSize = decodedPacket.mtuSize;
            packet.encode();
            resolve(packet.getBuffer());
        });
    }

    public async handleOpenConnectionRequest2(buffer: Buffer, rinfo: RemoteInfo): Promise<Buffer> {
        return new Promise((resolve) => {
            const decodedPacket = new OpenConnectionRequest2(buffer);
            decodedPacket.decode();

            if (!decodedPacket.isValid()) {
                throw new Error('Received an invalid offline message');
            }

            const packet = new OpenConnectionReply2();
            packet.serverGUID = this.id;
            packet.mtuSize = decodedPacket.mtuSize;
            packet.clientAddress = rinfo;
            packet.encode();

            this.connections.set(
                `${rinfo.address}:${rinfo.port}`,
                new Connection(this, decodedPacket.mtuSize, rinfo)
            ); 
            resolve(packet.getBuffer());
        });
    }

    /**
     * Remove a connection from all connections.
     */
    public async removeConnection(connection: Connection, reason?: string): Promise<void> {
        /* const inetAddr = connection.getAddress();
        const token = `${inetAddr.getAddress()}:${inetAddr.getPort()}`;
        if (this.connections.has(token)) {
            await this.connections.get(token)?.close();
            this.connections.delete(token);
        }

        this.emit('closeConnection', connection.getAddress(), reason); */
    }

    /**
     * Send packet buffer to the client.
     */
    public sendBuffer(buffer: Buffer, rinfo: RemoteInfo): void {
        this.socket.send(buffer, rinfo.port, rinfo.address);
    }

    public getSocket() {
        return this.socket;
    }

    public getConnections() {
        return this.connections;
    }
}
