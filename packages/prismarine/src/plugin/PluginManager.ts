import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

import { PluginManager as ModuleManager } from 'live-plugin-manager';
import PluginApi from './api/PluginApi';
import PluginFile from './PluginFile';
import type Server from '../Server';
import Timer from '../utils/Timer';
import { cwd } from '../utils/cwd';

/**
 * Plugin manager.
 *
 * @public
 */
export class PluginManager {
    private readonly server: Server;
    private readonly plugins = new Map();

    public constructor(server: Server) {
        this.server = server;
    }

    /**
     * OnEnable hook.
     */
    public async onEnable() {
        // Create plugin folder
        if (!fs.existsSync(cwd() + '/plugins')) {
            fs.mkdirSync(cwd() + '/plugins');
        }

        // Register Plugin(s)
        const timer = new Timer();

        const plugins = fs.readdirSync(path.join(cwd(), 'plugins'));
        const res = (
            await Promise.all(
                plugins.map(async (id: string) => {
                    try {
                        return await this.registerPlugin(id);
                    } catch (error: unknown) {
                        this.server.getLogger().error(`§cFailed to load plugin ${id}: ${error}`);
                        this.server.getLogger().error(error);
                        return null;
                    }
                })
            )
        ).filter((a) => a);
        this.server.getLogger().debug(`Registered §b${res.length}§r plugin(s) (took §e${timer.stop()} ms§r)!`);
    }

    /**
     * OnDisable hook.
     */
    public async onDisable() {
        await Promise.all(
            Array.from(this.plugins.keys()).map(async (id: string) => {
                return this.deregisterPlugin(id);
            })
        );
    }

    /**
     * Register a new plugin and download the required dependencies.
     *
     * @param id - The plugin's path
     */
    private async registerPlugin(id: string): Promise<PluginFile | null> {
        if (id === '.extracted') return null;

        const timer = new Timer();

        let dir = path.join(cwd(), 'plugins', id);

        // Asset or config folder
        if (!fs.existsSync(path.join(dir, 'package.json'))) {
            return null;
        }

        const packagePluginFile = await fs.promises.readFile(path.join(dir, 'package.json'));
        const pkg = JSON.parse(packagePluginFile.toString());
        if (!pkg) throw new Error(`package.json is missing!`);

        if (!pkg.name || !pkg.prismarine) throw new Error(`package.json is invalid!`);

        if (!fs.existsSync(path.join(cwd(), '/plugins/', pkg.name))) {
            fs.mkdirSync(path.join(cwd(), '/plugins/', pkg.name));
        }

        if (pkg.dependencies)
            await Promise.all(
                Object.entries(pkg.dependencies).map(async (dependency) => {
                    const moduleManager = new ModuleManager({
                        cwd: dir,
                        pluginsPath: path.join(dir, 'node_modules')
                    });

                    if (([] as any).includes(dependency[0])) {
                        this.server
                            .getLogger()
                            .warn(
                                `plugin §b${pkg.name} ${pkg.version}§r is trying to depend on §5${dependency[0]}§r which should be a dev-dependency!`
                            );
                        return;
                    }

                    try {
                        await moduleManager.installFromNpm(dependency[0], dependency[1] as string);
                    } catch (error: unknown) {
                        this.server.getLogger().debug(`moduleManager failed with: ${error}`);
                        this.server.getLogger().error(error);
                        throw new Error(`Failed to install ${dependency[0]}`, { cause: error });
                    }
                })
            );
        const plugin = new PluginFile(this.server, dir, new PluginApi(this.server, pkg));

        try {
            await plugin.onEnable();
        } catch (error) {
            this.server.getLogger().warn(`Failed to enable §b${plugin.getName()}@${plugin.getVersion()}§r: ${error}!`);
            this.server.getLogger().debug((error as any).stack);
            return null;
        }

        this.plugins.set(pkg.name, plugin);

        this.server.getLogger().debug(`Plugin with id §b${plugin.getName()}@${plugin.getVersion()}§r registered`);
        this.server
            .getLogger()
            .info(
                `Plugin §b${plugin.getDisplayName()} ${plugin.getVersion()}§r loaded successfully (took §e${timer.stop()} ms§r)!`
            );
        return plugin;
    }

    public async registerClassPlugin(pkg: any, plugin: PluginFile): Promise<PluginFile | null> {
        const timer = new Timer();

        try {
            await plugin.onEnable();
        } catch (error) {
            this.server.getLogger().warn(`Failed to enable §b${plugin.getName()}@${plugin.getVersion()}§r: ${error}!`);
            return null;
        }

        this.plugins.set(pkg.name, plugin);

        this.server.getLogger().debug(`Plugin with id §b${plugin.getName()}@${plugin.getVersion()}§r registered`);
        this.server
            .getLogger()
            .info(
                `Plugin §b${plugin.getDisplayName()} ${plugin.getVersion()}§r loaded successfully (took §e${timer.stop()} ms§r)!`
            );
        return plugin;
    }

    /**
     * Deregister a plugin.
     *
     * @param id - The plugin's path
     */
    private async deregisterPlugin(id: string) {
        const plugin: PluginFile = this.plugins.get(id);
        try {
            await plugin.onDisable();
        } catch (error) {
            this.server.getLogger().warn(`Failed to disable §b${plugin.getName()}@${plugin.getVersion()}§r: ${error}!`);
        }

        this.plugins.delete(id);
    }

    /**
     * Return enabled plugins.
     */
    public getPlugins() {
        return Array.from(this.plugins.values());
    }
}
