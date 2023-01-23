// Reference: https://github.com/facebookarchive/RakNet/blob/master/Source/MessageIdentifiers.h
export enum MessageIdentifiers {
    CONNECTED_PING,
    UNCONNECTED_PING,
    UNCONNECTED_PING_OPEN_CONNECTIONS,
    CONNECTED_PONG,
    DETECT_LOST_CONNECTIONS,
    OPEN_CONNECTION_REQUEST_1,
    OPEN_CONNECTION_REPLY_1,
    OPEN_CONNECTION_REQUEST_2,
    OPEN_CONNECTION_REPLY_2,
    CONNECTION_REQUEST,
    REMOTE_SYSTEM_REQUIRES_PUBLIC_KEY,
    OUR_SYSTEM_REQUIRES_SECURITY,
    PUBLIC_KEY_MISMATCH,
    OUT_OF_BAND_INTERNAL,
    SND_RECEIPT_ACKED,
    SND_RECEIPT_LOSS,
    CONNECTION_REQUEST_ACCEPTED,
    CONNECTION_ATTEMPT_FAILED,
    ALREADY_CONNECTED,
    NEW_INCOMING_CONNECTION,
    NO_FREE_INCOMING_CONNECTIONS,
    DISCONNECTION_NOTIFICATION,
    CONNECTION_LOST,
    CONNECTION_BANNED,
    INVALID_PASSWORD,
    INCOMPATIBLE_PROTOCOL_VERSION,
    IP_RECENTLY_CONNECTED,
    TIMESTAMP,
    UNCONNECTED_PONG,
    ADVERTISE_SYSTEM,
    DOWNLOAD_PROGRESS,
    REMOTE_DISCONNECTION_NOTIFICATION,
    REMOTE_CONNECTION_LOST,
    REMOTE_NEW_INCOMING_CONNECTION,

    ACKNOWLEDGE_PACKET = 0xc0,
    NACKNOWLEDGE_PACKET = 0xa0,
    QUERY = 0xfe
}