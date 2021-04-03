/* eslint-disable promise/prefer-await-to-then */
import { CommandDispatcher, argument, literal, string } from '@jsprismarine/brigadier';

import Command from '../Command';
import Player from '../../player/Player';

export default class DebugCommand extends Command {
    public constructor() {
        super({
            id: 'jsprismarine:debug',
            description: 'Debug output',
            permission: 'jsprismarine.command.debug'
        });
    }

    public async register(dispatcher: CommandDispatcher<any>) {
        dispatcher.register(
            literal('debug')
                .then(
                    argument('action', string()).then(
                        argument('value', string()).executes(async (context) => {
                            const source = context.getSource() as Player;
                            const action = context.getArgument('action') as string;
                            const value = context.getArgument('value') as string;

                            switch (action) {
                                case 'loadWorld': {
                                    const worldData = source.getServer().getConfig().getWorlds()[value];
                                    const world = await source
                                        .getServer()
                                        .getWorldManager()
                                        .loadWorld(worldData, value);
                                    return `Loaded world ${world.getName()}`;
                                }
                                case 'changeWorld': {
                                    const world = source.getServer().getWorldManager().getWorldByName(value)!;
                                    await source.setWorld(world);
                                    return `Moved ${source.getFormattedUsername()} to ${world.getName()}`;
                                }
                                default:
                                    throw new Error('Invalid action!');
                            }
                        })
                    )
                )
                .executes(async (context) => {
                    const source = context.getSource() as Player;

                    const worlds = source.getServer().getWorldManager().getWorlds();
                    await source.sendMessage(`§dWorlds Loaded§r (${worlds.length}):`);
                    for (const world of worlds) {
                        await source.sendMessage(
                            `- id: §a${world.getUniqueId()}§r, name: §b${world.getName()}§r, ticks: §b${world.getTicks()}§r`
                        );

                        const gamerules = Array.from(world.getGameruleManager().getGamerules());
                        await source.sendMessage(`  §dGamerules§r (${gamerules.length}):`);
                        await Promise.all(
                            gamerules.map(async ([id, value]) => {
                                await source.sendMessage(`  - id: §a${id}§r, value: §b${value}§r`);
                            })
                        );

                        const entities = world.getEntities();
                        await source.sendMessage(`  §dEntities§r (${entities.length}):`);
                        await Promise.all(
                            entities.map(async (e) =>
                                source.sendMessage(
                                    `  - id: §a${e.getRuntimeId()}§r, name: §b${e.getName()}§r, type: §b${e.getType()}§r, x: §b${e.getX()}§r, y: §b${e.getY()}§r, z: §b${e.getZ()}§r`
                                )
                            )
                        );
                    }
                })
        );
    }
}
