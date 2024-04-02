import { Config, Logger, Server } from '@jsprismarine/prismarine';

import fs from 'node:fs';
import path from 'node:path';

import pkg from '../package.json' assert { type: 'json' };

// Process metadata
process.title = 'Prismarine';

if (process.env.JSP_DIR && !fs.existsSync(path.join(process.cwd(), process.env.JSP_DIR)))
    fs.mkdirSync(path.join(process.cwd(), process.env.JSP_DIR));

const version = pkg.version as string;

const config = new Config(version);
const logger = new Logger();
const server = new Server({
    config,
    logger,
    version
});

(async () => {
    process.on('uncaughtException', async (error) => {
        console.error(error);
        await server.shutdown({ crash: true });
    });

    try {
        await server.bootstrap(config.getServerIp(), config.getServerPort());
    } catch (error: unknown) {
        console.error(error);
        logger.error(`Cannot start the server, is it already running on the same port?`, 'Prismarine');
        await server.shutdown({ crash: true });
    }
})();
