import Player from "../../player/Player";

const Command = require('../Command').default;

export default class PluginsCommand extends Command {
    constructor() {
        super({ namespace: 'jsprismarine', name: 'plugins', description: 'Lists all plugins that run on the server.', aliases: ["pl"] });
    }

    /**
     * @param {Player} sender
     * @param {Array} args
     */
    public execute(sender: Player, args: Array<any>): void {

        let plugins = sender.getServer().getPluginManager().getPlugins();

        if (plugins.length == 0) {
            sender.sendMessage("§cCan't find any plugins.");
            return;
        }

        let message = `§7Plugins (${plugins.length}):§r ${plugins.map(p => `${p.manifest.name} ${p.manifest.version}`).join(", ")}`;

        sender.sendMessage(message);
        return;
    }
}
