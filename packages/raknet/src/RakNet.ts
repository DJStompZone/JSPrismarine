import * as Protocol from './protocol/Protocol';

import Connection from './Connection';
import InetAddress from './utils/InetAddress';
import Listener from './Listener';
import RakNetListener from './RakNetListener';
import ServerName from './utils/ServerName';

export type { RakNetListener };

// Minecraft related protocol
const MINECRAFT_PROTOCOL = 10;

// Raknet ticks
const RAKNET_TPS = 100;
const RAKNET_TICK_LENGTH = 1 / RAKNET_TPS;

export { Connection, Protocol, Listener, InetAddress, ServerName, MINECRAFT_PROTOCOL, RAKNET_TICK_LENGTH };
