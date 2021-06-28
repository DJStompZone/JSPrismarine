enum MessageIdentifiers {
    CONNECTED_PING = 0x00,
    UNCONNECTED_PING,
    UNCONNECTED_PING_OPEN_CONNECTION,
    CONNECTED_PONG,

    OPEN_CONNECTION_REQUEST_1 = 0x05,
    OPEN_CONNECTION_REPLY_1,
    OPEN_CONNECTION_REQUEST_2,
    OPEN_CONNECTION_REPLY_2,

    CONNECTION_REQUEST,
    CONNECTION_REQUEST_ACCEPTED = 0x10,

    ALREADY_CONNECTED = 0x12,
    NEW_INCOMING_CONNECTION,

    DISCONNECT_NOTIFICATION = 0x15,

    INCOMPATIBLE_PROTOCOL_VERSION = 0x19,

    UNCONNECTED_PONG = 0x1c,

    ACKNOWLEDGEMENT = 0xc0,
    NACKNOWLEDGEMENT = 0xa0,

    GAME_PACKET = 0xfe
}
export default MessageIdentifiers;
