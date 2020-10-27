import Command from "..";
import type Player from "../../player";

export default class SayCommand extends Command {
    constructor() {
        // TODO: add permissions to command
        super({ id: 'minecraft:say', description: 'Say something to all players.' });
    }

    execute(sender: Player, args: Array<string>) {
        if (!args[0]) {
            return sender.sendMessage(`§cPlease specify a message.`);
        }

        let message = args.join(' ');
        let messageToSend = `§5[${sender.getUsername()}] ${message}`;

        sender.getServer().getLogger().info(messageToSend);
        for (let player of sender.getServer().getOnlinePlayers()) {
            player.sendMessage(messageToSend);
        }
        return null;
    }
};